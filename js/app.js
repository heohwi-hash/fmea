/**
 * FMEA Guru Application Main Script
 * - 완벽한 한국어 IME (한글 조합) 및 Enter 전송 처리
 * - 다크 / 라이트 테마 토글 지원
 * - 대화 내역 영구 보존 및 복사 기능
 * - 인터랙티브 AP/RPN 계산기 및 7단계 로드맵 연동
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
  const themeToggleBtn = document.getElementById("themeToggleBtn");

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
  let isComposing = false; // 한글 조합 상태 추적

  // 1. 테마 초기화 (Dark / Light)
  initTheme();

  // 2. UI 요소 초기화
  initSidebar();
  initQuickChips();
  initFeatureCards();
  initInputShortcuts();
  loadChatHistory();
  updateCalculatorUI();

  // ==========================================
  // [중요] 전송 및 입력 처리 (Enter & Click)
  // ==========================================

  function submitCurrentMessage() {
    if (isBotTyping) return;
    const text = userInput.value.trim();
    if (!text) {
      userInput.focus();
      return;
    }

    // 입력창 초기화
    userInput.value = "";
    userInput.style.height = "auto";
    updateSendButtonState();

    // 메시지 처리
    handleUserSubmit(text);
  }

  // 한글 IME 조합 이벤트
  userInput.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  userInput.addEventListener("compositionend", () => {
    isComposing = false;
    updateSendButtonState();
  });

  // 키보드 엔터 감지 (한글 조합 완료 및 즉시 전송 보장)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // 한글 조합 중인 경우: 조합이 브라우저에서 확정된 직후 전송되도록 setTimeout 활용
      if (isComposing || e.isComposing || e.keyCode === 229) {
        setTimeout(() => {
          submitCurrentMessage();
        }, 30);
        return;
      }
      e.preventDefault();
      submitCurrentMessage();
    }
  });

  // 전송 버튼 클릭
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    submitCurrentMessage();
  });

  // 폼 서브밋 방지 및 처리
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitCurrentMessage();
  });

  // 입력창 높이 자동 조절 및 전송 버튼 활성화
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 130) + "px";
    updateSendButtonState();
  });

  function updateSendButtonState() {
    const hasText = userInput.value.trim().length > 0;
    if (hasText && !isBotTyping) {
      sendBtn.classList.add("active");
    } else {
      sendBtn.classList.remove("active");
    }
  }

  // ==========================================
  // 대화 스트림 처리
  // ==========================================

  function handleUserSubmit(queryText) {
    if (isBotTyping) return;

    // 첫 질문 시 웰컴 히어로 숨김
    if (welcomeHero && welcomeHero.style.display !== "none") {
      welcomeHero.style.display = "none";
    }

    // 사용자 메시지 버블 추가
    appendMessage("user", queryText);

    // 봇 응답 로딩 표시
    isBotTyping = true;
    updateSendButtonState();
    const botRow = appendBotTypingPlaceholder();

    // 챗 엔진 처리 (부드러운 응답 딜레이)
    setTimeout(() => {
      try {
        const responseObj = engine.processQuery(queryText);
        renderBotResponse(botRow, responseObj);
        saveChatHistory();
      } catch (err) {
        console.error("Query processing error:", err);
        renderBotResponse(botRow, {
          text: `오류가 발생했습니다: ${err.message}`,
          followUps: QUICK_QUESTIONS.slice(0, 3)
        });
      } finally {
        isBotTyping = false;
        updateSendButtonState();
      }
    }, 400);
  }

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
    senderTitle.innerHTML = sender === "user" 
      ? `<span>나</span>` 
      : `<span>FMEA 전문 어시스턴트</span><span class="sender-badge">AIAG-VDA 1st Ed.</span>`;

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
    senderTitle.innerHTML = `<span>FMEA 전문 어시스턴트</span><span class="sender-badge">분석 중...</span>`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble typing-bubble";
    bubble.innerHTML = `
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <span class="typing-text">FMEA 표준 지식 베이스 검색 중...</span>
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
    const senderTitle = botRow.querySelector(".msg-sender");
    
    senderTitle.innerHTML = `<span>FMEA 전문 어시스턴트</span><span class="sender-badge">AIAG-VDA 1st Ed.</span>`;
    bubble.classList.remove("typing-bubble");
    bubble.innerHTML = engine.formatMarkdown(responseObj.text);

    // 액션 바 (복사, 도움됨 반응)
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "msg-actions";
    
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "msg-action-btn";
    copyBtn.innerHTML = `📋 답변 복사`;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(responseObj.text).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerText = "✓ 복사 완료!";
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `📋 답변 복사`;
        }, 2000);
      });
    });
    actionsDiv.appendChild(copyBtn);

    const helpfulBtn = document.createElement("button");
    helpfulBtn.type = "button";
    helpfulBtn.className = "msg-action-btn";
    helpfulBtn.innerHTML = `👍 도움됨`;
    helpfulBtn.addEventListener("click", () => {
      helpfulBtn.classList.add("helpful");
      helpfulBtn.innerHTML = `❤️ 피드백 감사합니다!`;
      helpfulBtn.disabled = true;
    });
    actionsDiv.appendChild(helpfulBtn);

    wrap.appendChild(actionsDiv);

    // 후속 추천 질문 칩
    if (responseObj.followUps && responseObj.followUps.length > 0) {
      const followUpsDiv = document.createElement("div");
      followUpsDiv.className = "followups-container";
      
      const followUpTitle = document.createElement("div");
      followUpTitle.className = "followup-header";
      followUpTitle.innerText = "💡 관련 추천 질문:";
      followUpsDiv.appendChild(followUpTitle);

      responseObj.followUps.forEach((item) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "followup-chip";
        chip.innerHTML = `<span>⚡</span><span>${item}</span>`;
        chip.addEventListener("click", () => {
          if (item.includes("AP 계산기")) {
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

  // ==========================================
  // 사이드바 & 퀵 질문 렌더링
  // ==========================================

  function initSidebar() {
    topicList.innerHTML = "";
    FMEA_KNOWLEDGE_BASE.forEach((item) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "topic-item";
      btn.innerHTML = `<span class="topic-dot"></span><span class="topic-text">${item.title}</span>`;
      btn.addEventListener("click", () => {
        handleUserSubmit(item.title);
        closeMobileSidebar();
      });
      topicList.appendChild(btn);
    });

    faqList.innerHTML = "";
    QUICK_QUESTIONS.forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "topic-item";
      btn.innerHTML = `<span class="topic-icon">💬</span><span class="topic-text">${q}</span>`;
      btn.addEventListener("click", () => {
        handleUserSubmit(q);
        closeMobileSidebar();
      });
      faqList.appendChild(btn);
    });
  }

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

  function initFeatureCards() {
    document.querySelectorAll(".feature-card").forEach((card) => {
      card.addEventListener("click", () => {
        const query = card.getAttribute("data-query");
        if (query) {
          handleUserSubmit(query);
        }
      });
    });
  }

  function initInputShortcuts() {
    document.querySelectorAll(".input-shortcut-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        if (query) {
          if (query === "open_calc") {
            openCalculatorModal();
          } else if (query === "open_roadmap") {
            openRoadmap();
          } else {
            handleUserSubmit(query);
          }
        }
      });
    });
  }

  // ==========================================
  // 모달 제어 (AP 계산기 & 7단계 로드맵)
  // ==========================================

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
  if (topbarCalcBtn) topbarCalcBtn.addEventListener("click", openCalculatorModal);
  closeCalcModal.addEventListener("click", closeCalculatorModal);

  openRoadmapBtn.addEventListener("click", openRoadmap);
  if (topbarRoadmapBtn) topbarRoadmapBtn.addEventListener("click", openRoadmap);
  closeRoadmapModal.addEventListener("click", closeRoadmap);

  calcModal.addEventListener("click", (e) => {
    if (e.target === calcModal) closeCalculatorModal();
  });
  roadmapModal.addEventListener("click", (e) => {
    if (e.target === roadmapModal) closeRoadmap();
  });

  // 로드맵 단계 클릭 시 해당 단계 질문 전송
  document.querySelectorAll(".roadmap-step").forEach((stepEl, idx) => {
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

  // AP 계산기 실시간 반영
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

  // ==========================================
  // 모바일 사이드바 & 테마 제어
  // ==========================================

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

  function initTheme() {
    const savedTheme = localStorage.getItem("fmea_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeToggleLabel(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("fmea_theme", newTheme);
        updateThemeToggleLabel(newTheme);
      });
    }
  }

  function updateThemeToggleLabel(theme) {
    if (!themeToggleBtn) return;
    if (theme === "dark") {
      themeToggleBtn.innerHTML = `<span>☀️</span><span>라이트 모드</span>`;
      themeToggleBtn.title = "밝은 테마로 변경";
    } else {
      themeToggleBtn.innerHTML = `<span>🌙</span><span>다크 모드</span>`;
      themeToggleBtn.title = "어두운 테마로 변경";
    }
  }

  // 대화 기록 초기화
  clearChatBtn.addEventListener("click", () => {
    if (confirm("대화 내역을 모두 지우고 초기화하시겠습니까?")) {
      localStorage.removeItem("fmea_chat_history");
      location.reload();
    }
  });

  // 로컬스토리지 대화 기록 저장/불러오기
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
      localStorage.setItem("fmea_chat_history", JSON.stringify(history.slice(-25)));
    } catch (e) {
      // ignore
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
          senderTitle.innerHTML = item.sender === "user" 
            ? `<span>나</span>` 
            : `<span>FMEA 전문 어시스턴트</span><span class="sender-badge">AIAG-VDA 1st Ed.</span>`;

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
      console.warn("History loading error", e);
    }
  }
});
