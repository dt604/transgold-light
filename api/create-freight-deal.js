const { Client } = require('@hubspot/api-client');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    company,
    serviceType,
    origin,
    destination,
    commodity,
    weight,
    palletCount,
    specialInstructions = ''
  } = req.body;

  // 1. Validate required fields
  if (!email || !serviceType || !origin || !destination || !commodity || !weight || !palletCount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. Check for required environment variables
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const pipelineId = process.env.HUBSPOT_DEAL_PIPELINE_ID;
  const stageId = process.env.HUBSPOT_DEAL_STAGE_ID;

  if (!accessToken || !pipelineId || !stageId) {
    console.error('Server is missing HubSpot environment variables');
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  const hubspotClient = new Client({ accessToken });

  try {
    // 3. Find HubSpot Contact by Email
    const contactSearchRequest = {
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
      }],
      properties: ['email'],
      limit: 1
    };
    
    const contactResponse = await hubspotClient.crm.contacts.searchApi.doSearch(contactSearchRequest);
    
    if (contactResponse.results.length === 0) {
      console.warn(`No contact found for email: ${email}`);
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const contactId = contactResponse.results[0].id;
    console.log(`Found Contact ID: ${contactId} for email: ${email}`);

    // 4. Duplicate Prevention (Idempotency check)
    // Check if a deal already exists for this contact with the same origin/destination created in the last 24 hours
    const dealSearchRequest = {
      filterGroups: [{
        filters: [
          { propertyName: 'associations.contact', operator: 'EQ', value: contactId },
          { propertyName: 'origin', operator: 'EQ', value: origin },
          { propertyName: 'destination', operator: 'EQ', value: destination },
          // A robust check would filter by createdate, but for simplicity, if any recent matching deal exists, we block
          { propertyName: 'createdate', operator: 'GTE', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
        ]
      }],
      limit: 1
    };

    const existingDealsResponse = await hubspotClient.crm.deals.searchApi.doSearch(dealSearchRequest);
    
    if (existingDealsResponse.results.length > 0) {
      console.log(`Duplicate deal prevented for contact: ${contactId}, origin: ${origin}, dest: ${destination}`);
      return res.status(200).json({ success: true, message: 'Deal already exists (duplicate prevented)' });
    }

    // 5. Generate Deal Name
    const dealName = company && company.trim() !== '' 
      ? `Freight Quote - ${company} - ${origin} to ${destination}`
      : `Freight Quote - ${origin} to ${destination}`;

    // Normalize service type
    let normalizedServiceType = serviceType;
    if (serviceType === 'TL') normalizedServiceType = 'FTL';

    // 6. Create the Deal and associate it with the Contact
    const dealObj = {
      properties: {
        dealname: dealName,
        pipeline: pipelineId,
        dealstage: stageId,
        quote_status: 'New Request',
        service_type: normalizedServiceType,
        origin: origin,
        destination: destination,
        commodity: commodity,
        weight: weight,
        pallet_count: palletCount,
        special_instructions: specialInstructions
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3 // Standard contact-to-deal association type
            }
          ]
        }
      ]
    };

    const apiResponse = await hubspotClient.crm.deals.basicApi.create(dealObj);
    console.log(`Successfully created Deal ID: ${apiResponse.id}`);

    return res.status(200).json({ success: true, dealId: apiResponse.id });

  } catch (error) {
    // Log the detailed error on the server side
    console.error('HubSpot API Error:', error.message);
    if (error.response && error.response.body) {
      console.error('HubSpot API Error Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    // Return a generic error to the frontend
    return res.status(500).json({ error: 'Failed to create deal' });
  }
};
