/**
 * FMEA Guru Application Main Script
 */

document.addEventListener("DOMContentLoaded", () => {
  const engine = new FMEAChatEngine();

  // DOM Elements
  const chatStream = document.getElementById("chatStream");
  const welcomeHero = document.getElementById("welcomeHero");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const quickChipsContainer = document.getElementById("quickChipsContainer");
  const topicList = document.getElementById("topicList");
  const faqList = document.getElementById("faqList");
  const clearChatBtn = document.getElementById("clearChatBtn");

  // Modals DOM
  const calcModal = document.getElementById("calcModal");
  const roadmapModal = document.getElementById("roadmapModal");
  const openCalcBtn = document.getElementById("openCalcBtn");
  const topbarCalcBtn = document.getElementById("topbarCalcBtn");
  const closeCalcModal = document.getElementById("closeCalcModal");
  const openRoadmapBtn = document.getElementById("openRoadmapBtn");
  const topbarRoadmapBtn = document.getElementById("topbarRoadmapBtn");
  const closeRoadmapModal = document.getElementById("closeRoadmapModal");
  const insertCalcToChatBtn = document.getElementById("insertCalcToChatBtn");

  // Calculator Inputs
  const sInput = document.getElementById("sInput");
  const oInput = document.getElementById("oInput");
  const dInput = document.getElementById("dInput");
  const sValDisplay = document.getElementById("sValDisplay");
  const oValDisplay = document.getElementById("oValDisplay");
  const dValDisplay = document.getElementById("dValDisplay");
  const sDesc = document.getElementById("sDesc");
  const oDesc = document.getElementById("oDesc");
  const dDesc = document.getElementById("dDesc");
  const resApBadge = document.getElementById("resApBadge");
  const resRpnVal = document.getElementById("resRpnVal");
  const resActionGuide = document.getElementById("resActionGuide");

  // Mobile sidebar
  const sidebar = document.getElementById("sidebar");
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");

  let isBotTyping = false;
  let activeTypingTimer = null;

  // 1. Initialize UI Elements
  initSidebar();
  initQuickChips();
  loadChatHistory();
  updateCalculatorUI();

  // 2. Sidebar Population
  function initSidebar() {
    // Topic List
    topicList.innerHTML = "";
    FMEA_KNOWLEDGE_BASE.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "topic-item";
      btn.innerHTML = `<span class="topic-dot"></span><span>${item.title}</span>`;
      btn.addEventListener("click", () => {
        handleUserSubmit(item.title);
        closeMobileSidebar();
      });
      topicList.appendChild(btn);
    });

    // FAQs List
    faqList.innerHTML = "";
    QUICK_QUESTIONS.forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "topic-item";
      btn.innerHTML = `<span style="font-size: 0.8rem; color: var(--accent-indigo);">💬</span><span>${q}</span>`;
      btn.addEventListener("click", () => {
        handleUserSubmit(q);
        closeMobileSidebar();
      });
      faqList.appendChild(btn);
    });
  }

  // 3. Quick Chips in Welcome Hero
  function initQuickChips() {
    quickChipsContainer.innerHTML = "";
    QUICK_QUESTIONS.forEach((q) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "quick-chip";
      chip.innerHTML = `<span>⚡</span><span>${q}</span>`;
      chip.addEventListener("click", () => {
        handleUserSubmit(q);
      });
      quickChipsContainer.appendChild(chip);
    });
  }

  // 4. Input handling & Textarea auto-resize
  userInput.addEventListener("input", () => {
    userInput.style.height = "24px";
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
    sendBtn.disabled = userInput.value.trim().length === 0 || isBotTyping;
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isBotTyping) {
        chatForm.dispatchEvent(new Event("submit"));
      }
    }
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || isBotTyping) return;

    userInput.value = "";
    userInput.style.height = "24px";
    sendBtn.disabled = true;

    handleUserSubmit(text);
  });

  // 5. Message Processing
  function handleUserSubmit(queryText) {
    if (isBotTyping) return;

    // Remove welcome hero if present
    if (welcomeHero && welcomeHero.parentNode) {
      welcomeHero.style.display = "none";
    }

    // Append user message
    appendMessage("user", queryText);

    // Bot Typing Indicator
    isBotTyping = true;
    sendBtn.disabled = true;
    const botRow = appendBotTypingPlaceholder();

    // Process Query through Chat Engine
    setTimeout(() => {
      const responseObj = engine.processQuery(queryText);
      renderBotResponse(botRow, responseObj);
      saveChatHistory();
    }, 450);
  }

  // 6. DOM Message Creation
  function appendMessage(sender, text) {
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = `msg-avatar ${sender}`;
    avatar.innerHTML = sender === "user" ? "👤" : "🤖";

    const wrap = document.createElement("div");
    wrap.className = "msg-bubble-wrap";

    const senderTitle = document.createElement("div");
    senderTitle.className = "msg-sender";
    senderTitle.innerText = sender === "user" ? "사용자" : "FMEA AI 전문가";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    if (sender === "user") {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = engine.formatMarkdown(text);
    }

    wrap.appendChild(senderTitle);
    wrap.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(wrap);

    chatStream.appendChild(row);
    scrollToBottom();
    return row;
  }

  function appendBotTypingPlaceholder() {
    const row = document.createElement("div");
    row.className = "message-row bot";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar bot";
    avatar.innerHTML = "🤖";

    const wrap = document.createElement("div");
    wrap.className = "msg-bubble-wrap";

    const senderTitle = document.createElement("div");
    senderTitle.className = "msg-sender";
    senderTitle.innerText = "FMEA AI 전문가";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = `
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;

    wrap.appendChild(senderTitle);
    wrap.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(wrap);

    chatStream.appendChild(row);
    scrollToBottom();
    return row;
  }

  function renderBotResponse(botRow, responseObj) {
    const bubble = botRow.querySelector(".msg-bubble");
    const wrap = botRow.querySelector(".msg-bubble-wrap");
    const fullHtml = engine.formatMarkdown(responseObj.text);

    // Direct render with smooth fade
    bubble.innerHTML = fullHtml;
    isBotTyping = false;
    sendBtn.disabled = userInput.value.trim().length === 0;

    // Add Message Actions (Copy button)
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "msg-actions";
    
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "msg-action-btn";
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      답변 복사
    `;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(responseObj.text).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerText = "✓ 복사 완료!";
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            답변 복사
          `;
        }, 2000);
      });
    });
    actionsDiv.appendChild(copyBtn);
    wrap.appendChild(actionsDiv);

    // Add Follow-up recommendation chips
    if (responseObj.followUps && responseObj.followUps.length > 0) {
      const followUpsDiv = document.createElement("div");
      followUpsDiv.className = "followups-container";
      
      responseObj.followUps.forEach((item) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "followup-chip";
        chip.innerHTML = `<span>💡</span><span>${item}</span>`;
        chip.addEventListener("click", () => {
          if (item === "AP 계산기 열기" || item === "AP 계산기 사용해보기" || item === "AP 계산기 직접 사용해보기") {
            openCalculatorModal();
          } else {
            handleUserSubmit(item);
          }
        });
        followUpsDiv.appendChild(chip);
      });
      wrap.appendChild(followUpsDiv);
    }

    scrollToBottom();
  }

  function scrollToBottom() {
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  // 7. Modals Logic
  function openCalculatorModal() {
    calcModal.classList.add("active");
  }
  function closeCalculatorModal() {
    calcModal.classList.remove("active");
  }

  function openRoadmap() {
    roadmapModal.classList.add("active");
  }
  function closeRoadmap() {
    roadmapModal.classList.remove("active");
  }

  openCalcBtn.addEventListener("click", openCalculatorModal);
  topbarCalcBtn.addEventListener("click", openCalculatorModal);
  closeCalcModal.addEventListener("click", closeCalculatorModal);

  openRoadmapBtn.addEventListener("click", openRoadmap);
  topbarRoadmapBtn.addEventListener("click", openRoadmap);
  closeRoadmapModal.addEventListener("click", closeRoadmap);

  // Close modals on overlay click
  calcModal.addEventListener("click", (e) => {
    if (e.target === calcModal) closeCalculatorModal();
  });
  roadmapModal.addEventListener("click", (e) => {
    if (e.target === roadmapModal) closeRoadmap();
  });

  // Roadmap Step Click to Query
  document.querySelectorAll(".roadmap-step").forEach((stepEl, idx) => {
    stepEl.style.cursor = "pointer";
    stepEl.addEventListener("click", () => {
      closeRoadmap();
      const stepQueries = [
        "Step 1 기획 및 준비 자세히",
        "Step 2 구조 분석 설명해줘",
        "Step 3 기능 분석 설명해줘",
        "Step 4 고장 분석과 고장 체인",
        "Step 5 위험 분석 및 AP 도출",
        "Step 6 최적화 설명해줘",
        "Step 7 결과 문서화 설명해줘"
      ];
      handleUserSubmit(stepQueries[idx] || "AIAG-VDA 7단계 절차");
    });
  });

  // Calculator Real-time update
  function updateCalculatorUI() {
    const s = parseInt(sInput.value, 10);
    const o = parseInt(oInput.value, 10);
    const d = parseInt(dInput.value, 10);

    sValDisplay.innerText = s;
    oValDisplay.innerText = o;
    dValDisplay.innerText = d;

    sDesc.innerText = FMEACalculator.getSeverityDesc(s);
    oDesc.innerText = FMEACalculator.getOccurrenceDesc(o);
    dDesc.innerText = FMEACalculator.getDetectionDesc(d);

    const res = FMEACalculator.calculateAP(s, o, d);

    resApBadge.className = `result-ap-badge ${res.badgeClass}`;
    resApBadge.innerText = `${res.label} [${res.ap}]`;
    resRpnVal.innerHTML = `<strong>${res.rpn}</strong> (${s} × ${o} × ${d})`;
    resActionGuide.innerText = res.action;
  }

  [sInput, oInput, dInput].forEach((input) => {
    input.addEventListener("input", updateCalculatorUI);
  });

  insertCalcToChatBtn.addEventListener("click", () => {
    const s = sInput.value;
    const o = oInput.value;
    const d = dInput.value;
    closeCalculatorModal();
    handleUserSubmit(`S=${s}, O=${o}, D=${d}`);
  });

  // 8. Mobile Sidebar Controls
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  function closeMobileSidebar() {
    if (window.innerWidth <= 900) {
      sidebar.classList.remove("open");
    }
  }

  // 9. Clear Chat
  clearChatBtn.addEventListener("click", () => {
    if (confirm("대화 내역을 모두 지우고 초기화하시겠습니까?")) {
      localStorage.removeItem("fmea_chat_history");
      location.reload();
    }
  });

  // 10. Persistence
  function saveChatHistory() {
    const rows = chatStream.querySelectorAll(".message-row");
    const history = [];
    rows.forEach((r) => {
      const isUser = r.classList.contains("user");
      const bubble = r.querySelector(".msg-bubble");
      if (bubble) {
        history.push({
          sender: isUser ? "user" : "bot",
          html: bubble.innerHTML
        });
      }
    });
    try {
      localStorage.setItem("fmea_chat_history", JSON.stringify(history.slice(-20)));
    } catch (e) {
      // Storage quota exceeded or disabled
    }
  }

  function loadChatHistory() {
    try {
      const saved = localStorage.getItem("fmea_chat_history");
      if (!saved) return;
      const history = JSON.parse(saved);
      if (Array.isArray(history) && history.length > 0) {
        if (welcomeHero) welcomeHero.style.display = "none";
        history.forEach((item) => {
          const row = document.createElement("div");
          row.className = `message-row ${item.sender}`;

          const avatar = document.createElement("div");
          avatar.className = `msg-avatar ${item.sender}`;
          avatar.innerHTML = item.sender === "user" ? "👤" : "🤖";

          const wrap = document.createElement("div");
          wrap.className = "msg-bubble-wrap";

          const senderTitle = document.createElement("div");
          senderTitle.className = "msg-sender";
          senderTitle.innerText = item.sender === "user" ? "사용자" : "FMEA AI 전문가";

          const bubble = document.createElement("div");
          bubble.className = "msg-bubble";
          bubble.innerHTML = item.html;

          wrap.appendChild(senderTitle);
          wrap.appendChild(bubble);
          row.appendChild(avatar);
          row.appendChild(wrap);

          chatStream.appendChild(row);
        });
        scrollToBottom();
      }
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  }
});
