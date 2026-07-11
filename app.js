document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileMenu();
  initMapInteractivity();
  initQuoteForm();
  initAIChatbot();
});

/* ==========================================================================
   Header Scroll Effect
   ========================================================================== */
function initHeaderScroll() {
  const header = document.getElementById("main-header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("shrink");
    } else {
      header.classList.remove("shrink");
    }
  });
}

/* ==========================================================================
   Mobile Navigation Menu
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.querySelector(".mobile-nav-toggle");
  const menu = document.getElementById("nav-menu");
  const links = document.querySelectorAll(".nav-item");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen);
  });

  // Close menu when a link is clicked
  links.forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ==========================================================================
   Interactive SVG Map
   ========================================================================== */
function initMapInteractivity() {
  const nodes = document.querySelectorAll(".map-node");
  const panel = document.getElementById("hub-info-panel");
  const title = document.getElementById("hub-title");
  const details = document.getElementById("hub-details");
  const status = document.getElementById("hub-status");

  if (!panel || !title || !details || !status) return;

  const hubData = {
    delta: {
      name: "Delta Corporate HQ & Yard",
      desc: "Our primary operations base, driver staging yard, and Western Canada LTL consolidation facility. Managing a growing fleet of 11 tractors and 18 trailers.",
      statusText: "Operational Hub",
      statusClass: "badge-green"
    },
    "kelowna-kamloops": {
      name: "Kelowna / Kamloops Expansion",
      desc: "Planned regional cross-docking hubs for BC Interior logistics. Connecting local consumer markets to major Western transport lanes.",
      statusText: "Planned Target (Phase 1)",
      statusClass: "badge-gold"
    },
    calgary: {
      name: "Rockyview / Calgary Hub",
      desc: "Our primary Alberta terminal. Supports our signature daily Calgary Overnight express line. Strategic cross-docking and warehouse integration.",
      statusText: "Operational Hub",
      statusClass: "badge-green"
    },
    edmonton: {
      name: "Edmonton Distribution Point",
      desc: "Planned expansion node to support North Alberta consumer goods freight routing. Securing high-volume direct client paths.",
      statusText: "Planned Target (Phase 2)",
      statusClass: "badge-gold"
    },
    gta: {
      name: "Greater Toronto Area Terminal",
      desc: "Eastern Canada terminal supporting our continuous GTA Team Service. Quick trailer turnaround and direct transcontinental shipping corridors.",
      statusText: "Operational Hub",
      statusClass: "badge-green"
    }
  };

  nodes.forEach(node => {
    node.addEventListener("mouseenter", () => {
      const hubId = node.getAttribute("data-hub");
      const data = hubData[hubId];
      if (!data) return;

      // Update Info Display with smooth transitions
      panel.style.opacity = "0.3";
      panel.style.transform = "translateX(-5px)";
      
      setTimeout(() => {
        title.textContent = data.name;
        details.textContent = data.desc;
        status.textContent = data.statusText;
        
        // Handle badge classes
        status.className = "badge " + data.statusClass;
        
        panel.style.opacity = "1";
        panel.style.transform = "translateX(0)";
      }, 150);
    });
  });
}

/* ==========================================================================
   Multi-Step Quote Request Form
   ========================================================================== */
function initQuoteForm() {
  const form = document.getElementById("freight-quote-form");
  const nextBtns = document.querySelectorAll(".next-step-btn");
  const prevBtns = document.querySelectorAll(".prev-step-btn");
  const stepIndicators = document.querySelectorAll(".step-indicator");
  const stepLines = document.querySelectorAll(".step-line");
  const panels = document.querySelectorAll(".form-step-panel");
  const successDialog = document.getElementById("quote-success-dialog");

  if (!form || !successDialog) return;

  let currentStep = 1;

  // Next Button Click
  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  });

  // Back Button Click
  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      goToStep(currentStep - 1);
    });
  });

  // Handle Form Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateStep(4)) return;

    const submitBtn = document.getElementById("submit-quote-btn");
    const originalText = submitBtn.innerHTML;
    
    // Simulate AI routing optimization and scheduling intake delay
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing Rates...`;

    // Submit lead data to HubSpot Forms API
    submitToHubSpot(form);

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Capture inputs for dialog summary
      const serviceType = form.elements["service_type"].value;
      const origin = `${form.elements["origin_city"].value.trim()}, ${form.elements["origin_province"].value}`;
      const dest = `${form.elements["dest_city"].value.trim()}, ${form.elements["dest_province"].value}`;
      const palletCount = form.elements["skid_count"].value || "Full Load (TL)";
      
      // Generate simulated ID
      const randomID = "TG-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

      document.getElementById("summary-service").textContent = serviceType;
      document.getElementById("summary-route").textContent = `${origin} ➔ ${dest}`;
      document.getElementById("summary-pallets").textContent = palletCount;
      document.getElementById("summary-ref-id").textContent = randomID;

      // Show Native Modal
      successDialog.showModal();

      // Reset form and UI stepper
      form.reset();
      goToStep(1);
    }, 1800);
  });

  // Direct HubSpot Forms API submission
  function submitToHubSpot(formEl) {
    const portalId = "343435263";
    const formGuid = "56b16492-6182-442e-9bee-e5db6101ff2d";

    // Grab the HubSpot tracking cookie for visitor attribution
    const hutk = document.cookie.replace(/(?:(?:^|.*;\s*)hubspotutk\s*=\s*([^;]*).*$)|^.*$/, "$1");

    const payload = {
      fields: [
        { name: "email", value: formEl.elements["email"].value },
        { name: "firstname", value: formEl.elements["contact_name"].value.split(" ")[0] || "" },
        { name: "lastname", value: formEl.elements["contact_name"].value.split(" ").slice(1).join(" ") || "" },
        { name: "company", value: formEl.elements["company_name"].value },
        { name: "phone", value: formEl.elements["phone"].value },
        { name: "message", value: `Service: ${formEl.elements["service_type"].value} | Route: ${formEl.elements["origin_city"].value}, ${formEl.elements["origin_province"].value} → ${formEl.elements["dest_city"].value}, ${formEl.elements["dest_province"].value} | Commodity: ${formEl.elements["commodity"].value} | Weight: ${formEl.elements["weight"].value} lbs | Pallets: ${formEl.elements["skid_count"].value || "N/A"} | Notes: ${formEl.elements["special_needs"].value || "None"}` }
      ],
      context: {
        hutk: hutk || undefined,
        pageUri: window.location.href,
        pageName: document.title
      }
    };

    fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => console.warn("HubSpot submission error:", err));
  }

  function goToStep(stepNum) {
    // Hide all panels
    panels.forEach(p => p.classList.remove("active-panel"));
    // Show current panel
    document.getElementById(`step-panel-${stepNum}`).classList.add("active-panel");

    // Update Stepper Progress UI
    stepIndicators.forEach((ind, index) => {
      const idx = index + 1;
      ind.classList.remove("active-step", "completed-step");
      if (idx === stepNum) {
        ind.classList.add("active-step");
      } else if (idx < stepNum) {
        ind.classList.add("completed-step");
      }
    });

    stepLines.forEach((line, index) => {
      const idx = index + 1;
      line.classList.remove("completed-line");
      if (idx < stepNum) {
        line.classList.add("completed-line");
      }
    });

    currentStep = stepNum;
    
    // Scroll to top of form section on mobile
    const quoteSec = document.getElementById("quote-section");
    if (window.innerWidth < 768 && quoteSec) {
      quoteSec.scrollIntoView({ behavior: "smooth" });
    }
  }

  function validateStep(stepNum) {
    let isValid = true;
    const panel = document.getElementById(`step-panel-${stepNum}`);
    const requiredInputs = panel.querySelectorAll("[required]");

    requiredInputs.forEach(input => {
      const inputGroup = input.closest(".input-group");
      
      // Text inputs
      if (input.type === "text" || input.tagName === "SELECT") {
        if (!input.value.trim()) {
          inputGroup.classList.add("invalid-input");
          isValid = false;
        } else {
          inputGroup.classList.remove("invalid-input");
        }
      }

      // Numbers
      if (input.type === "number") {
        if (!input.value || Number(input.value) <= 0) {
          inputGroup.classList.add("invalid-input");
          isValid = false;
        } else {
          inputGroup.classList.remove("invalid-input");
        }
      }

      // Email validation
      if (input.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value)) {
          inputGroup.classList.add("invalid-input");
          isValid = false;
        } else {
          inputGroup.classList.remove("invalid-input");
        }
      }

      // Phone
      if (input.type === "tel") {
        const phoneRegex = /^\+?[\d\s-]{7,15}$/;
        if (!phoneRegex.test(input.value.replace(/[^\d]/g, ""))) {
          inputGroup.classList.add("invalid-input");
          isValid = false;
        } else {
          inputGroup.classList.remove("invalid-input");
        }
      }
    });

    return isValid;
  }
}

/* ==========================================================================
   AI Logistics Chatbot Simulator
   ========================================================================== */
function initAIChatbot() {
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-chat-btn");
  const messagesContainer = document.getElementById("chat-messages");
  const quickBtns = document.querySelectorAll(".quick-btn");

  if (!input || !sendBtn || !messagesContainer) return;

  // Send message events
  sendBtn.addEventListener("click", handleUserMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleUserMessage();
  });

  // Quick Prompts
  quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const query = btn.getAttribute("data-query");
      submitQuery(query);
    });
  });

  function handleUserMessage() {
    const text = input.value.trim();
    if (!text) return;
    submitQuery(text);
    input.value = "";
  }

  function submitQuery(queryText) {
    // Add user bubble
    appendMessage(queryText, "user");
    
    // Add typing spinner bubble
    const typingBubble = appendTypingIndicator();
    
    // Generate simulated AI reply
    setTimeout(() => {
      typingBubble.remove();
      const reply = getAIReply(queryText);
      appendMessage(reply, "bot");
    }, 1200);
  }

  function appendMessage(text, sender) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message", sender === "user" ? "user-message" : "bot-message");

    const bubble = document.createElement("div");
    bubble.classList.add("msg-bubble");
    
    // Simple markdown link/bold rendering
    bubble.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendTypingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message", "bot-message");

    const bubble = document.createElement("div");
    bubble.classList.add("msg-bubble", "typing-bubble");
    bubble.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;

    wrapper.appendChild(bubble);
    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return wrapper;
  }

  function getAIReply(query) {
    const lower = query.toLowerCase();

    // Matching routes/tracking numbers
    if (lower.includes("tg-9982")) {
      return `**Tracking Report: TG-9982**
      - **Status:** In Transit 
      - **Origin:** Delta Terminal, BC
      - **Destination:** Calgary (Rockyview Hub), AB
      - **Service:** Overnight Express
      - **ETA:** June 29, 2026, 06:30 AM MST.
      - **Driver Notes:** Clear weather across Rogers Pass. Capacity sealed.`;
    }

    if (lower.includes("track")) {
      return `Please enter a valid tracking reference. For this preview, you can test tracking code **TG-9982** (Active load Delta to Calgary).`;
    }

    // Matching Equipment
    if (lower.includes("equipment") || lower.includes("fleet") || lower.includes("vans") || lower.includes("trucks")) {
      return `**Transgold Operational Fleet Specifications:**
      - **Tractors:** 11 modern, fully registered power units.
      - **Trailers:** 18 total trailers, specializing in **53-foot dry vans**.
      - **Technology:** Fully equipped with real-time GPS tracking and EDI integration capabilities.
      - **Compliance:** Multi-jurisdiction IFTA licensed, SCAC (TJFT), USDOT (3525020) and MC (1171435) compliant.`;
    }

    // Matching Transit / Calgary / GTA
    if (lower.includes("calgary") || lower.includes("overnight") || lower.includes("bc to ab")) {
      return `Our daily **Calgary Overnight** service departs from Delta, BC with guaranteed next-day morning arrival in Calgary/Rockyview. 
      - **Cut-off Time:** 17:00 PST.
      - **Equipment Type:** 53' Dry Vans.
      - **Best for:** High-priority retail or mall deliveries.`;
    }

    if (lower.includes("gta") || lower.includes("toronto") || lower.includes("team")) {
      return `Our **GTA Team Service** features two drivers operating in continuous rotation.
      - **Average Transit Time:** 60-70 hours between Delta, BC/Calgary and the Greater Toronto Area.
      - **Technology:** 100% GPS tracked with real-time updates and EDI logistics integration.
      - **Security:** Monitored cargo locks and constant GPS geo-fencing.`;
    }

    if (lower.includes("rate") || lower.includes("cost") || lower.includes("price")) {
      return `To calculate custom rates, please fill out our **Request a Quote** step-by-step form above! 
      
      For the future AI phase, we are designing automated API links directly to major loadboard brokers for instant spot quotes.`;
    }

    // Compliance / Insurance / Address
    if (lower.includes("insurance") || lower.includes("liability") || lower.includes("insured")) {
      return `**Transgold Insurance & Liability Profile:**
      - **Auto Liability:** $5,000,000 CAD (ICBC policy).
      - **General Liability:** $5,000,000 CAD (Aviva policy).
      - **Cargo Limit:** $250,000 CAD.
      - **Trailer Interchange:** $100,000 CAD.
      - Verified through Scott Road Insurance Services.`;
    }

    if (lower.includes("safety") || lower.includes("cert") || lower.includes("dot") || lower.includes("mc") || lower.includes("nsc")) {
      return `**Transgold Safety Registry Credentials:**
      - **National Safety Code (NSC):** # 202-721-148 (British Columbia Ministry of Transportation)
      - **USDOT:** 3525020
      - **MC:** 1171435
      - **SCAC:** TJFT
      - **WCB Account:** 200373744
      - **Status:** Active, Satisfied compliance records.`;
    }

    // Default reply
    return `Thank you for your question. I am pre-loaded with Transgold's operations parameters. You can ask about:
    - **Fleet & Specs** ("What equipment do you have?")
    - **Transit Lines** ("Calculate transit BC to Calgary" or "Tell me about GTA team service")
    - **Safety Compliance** ("View DOT/MC numbers" or "What is your liability coverage?")
    - **Tracking** ("Track load TG-9982")`;
  }
}
