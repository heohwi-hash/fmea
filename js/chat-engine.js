/**
 * FMEA Chatbot NLP & Intent Resolution Engine
 */

class FMEAChatEngine {
  constructor() {
    this.kb = FMEA_KNOWLEDGE_BASE;
  }

  /**
   * 사용자 텍스트 정규화
   */
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[?!.,~_@#$%^&*()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * S, O, D 계산 질의 패턴 감지
   * 예: "S=9, O=4, D=3", "심각도 9 발생도 4 검출도 2", "S:9 O:3 D:4" 등
   */
  detectCalculationIntent(text) {
    const raw = text.toUpperCase();
    const sMatch = raw.match(/(?:S|심각도|SEVERITY)\s*[:=]?\s*([0-9]{1,2})/i);
    const oMatch = raw.match(/(?:O|발생도|OCCURRENCE)\s*[:=]?\s*([0-9]{1,2})/i);
    const dMatch = raw.match(/(?:D|검출도|DETECTION)\s*[:=]?\s*([0-9]{1,2})/i);

    if (sMatch && oMatch && dMatch) {
      const s = parseInt(sMatch[1], 10);
      const o = parseInt(oMatch[1], 10);
      const d = parseInt(dMatch[1], 10);

      if (s >= 1 && s <= 10 && o >= 1 && o <= 10 && d >= 1 && d <= 10) {
        return { s, o, d };
      }
    }
    return null;
  }

  /**
   * 질문 처리 및 답변 생성
   */
  processQuery(userInput) {
    const trimmed = userInput.trim();
    if (!trimmed) {
      return {
        text: "질문 내용을 입력해 주시면 FMEA 이론과 실무 표준에 대해 상세히 답변해 드립니다. 😊",
        followUps: QUICK_QUESTIONS.slice(0, 3)
      };
    }

    // 1. 계산 질의 감지
    const calc = this.detectCalculationIntent(trimmed);
    if (calc) {
      const result = FMEACalculator.calculateAP(calc.s, calc.o, calc.d);
      const sDesc = FMEACalculator.getSeverityDesc(calc.s);
      const oDesc = FMEACalculator.getOccurrenceDesc(calc.o);
      const dDesc = FMEACalculator.getDetectionDesc(calc.d);

      const responseText = `### 🧮 AIAG-VDA AP(조치우선순위) & RPN 판정 결과

입력하신 **S(심각도)=${calc.s}**, **O(발생도)=${calc.o}**, **D(검출도)=${calc.d}**에 대한 공식 평가 결과입니다.

| 지표 | 입력 점수 | 점수 의미 요약 |
| :--- | :---: | :--- |
| **S (심각도)** | **${calc.s}** / 10 | ${sDesc} |
| **O (발생도)** | **${calc.o}** / 10 | ${oDesc} |
| **D (검출도)** | **${calc.d}** / 10 | ${dDesc} |

---

#### 🏆 판정 등급: **${result.label}**
* **공식 AP 등급**: **[ ${result.ap} ]** (${result.description})
* **기존 RPN 산출값**: **${result.rpn}** ($S \\times O \\times D = ${calc.s} \\times ${calc.o} \\times ${calc.d}$)

---

#### 📋 권장 개선 조치 가이드라인
> ${result.action}

💡 **참고**: AP(Action Priority)는 과거 RPN과 달리 심각도(S)에 가장 높은 가중치를 두어 판정합니다. 추가 계산을 원하시면 상단 메뉴의 **'AP 계산기'** 도구를 활용해보세요!`;

      return {
        text: responseText,
        followUps: ["RPN과 AP의 차이점 알려줘", "S, O, D 점수 채점 기준 알려줘", "AIAG-VDA 7단계 절차"]
      };
    }

    // 2. 키워드 및 의도 매칭
    const normalizedInput = this.normalize(trimmed);
    const tokens = normalizedInput.split(" ").filter((t) => t.length > 0);

    let bestItem = null;
    let highestScore = 0;

    for (const item of this.kb) {
      let score = 0;

      // 키워드 정확 일치
      for (const kw of item.keywords) {
        const normKw = this.normalize(kw);
        if (normalizedInput === normKw) {
          score += 100;
        } else if (normalizedInput.includes(normKw)) {
          score += 30 + normKw.length * 2;
        }
      }

      // 개별 토큰 일치도
      for (const token of tokens) {
        if (token.length < 2) continue;
        for (const kw of item.keywords) {
          if (kw.includes(token)) {
            score += 10;
          }
        }
        if (item.title.toLowerCase().includes(token)) {
          score += 15;
        }
        if (item.category.toLowerCase().includes(token)) {
          score += 5;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestItem = item;
      }
    }

    // 신뢰도 임계치 검사
    if (bestItem && highestScore >= 15) {
      return {
        text: bestItem.response,
        followUps: bestItem.followUps || QUICK_QUESTIONS.slice(0, 3)
      };
    }

    // 3. Fallback (일치 항목이 애매한 경우 친절한 안내)
    const fallbackText = `### 🤔 질문하신 내용을 FMEA 지식베이스에서 찾는 중입니다

정확한 답변을 위해 아래의 주요 FMEA 핵심 토픽 중에서 원하시는 주제를 선택하시거나, 질문을 조금 더 구체적으로 입력해 주시겠어요?

#### 💡 추천 질문 리스트
* **FMEA 개요**: "FMEA가 뭐야?", "FMEA 목적과 필요성"
* **AIAG-VDA 7단계**: "7단계 절차 알려줘", "Step 1 기획", "Step 4 고장 분석"
* **평가 지표**: "RPN과 AP 차이가 뭐야?", "S O D 평가 기준"
* **종류 비교**: "DFMEA와 PFMEA 비교", "SFMEA나 FMEA-MSR은 뭐야?"
* **실전 예시**: "고장 체인 작성 예시 보여줘"
* **AP 계산**: 채팅창에 \`S=9, O=4, D=3\` 형식으로 입력하시면 즉시 AP 등급을 판정해 드립니다!`;

    return {
      text: fallbackText,
      followUps: [
        "FMEA가 뭐야? 왜 해야 해?",
        "AIAG-VDA 통합 FMEA 7단계 설명해줘",
        "RPN과 AP의 차이점이 뭐야?",
        "고장 체인(FE-FM-FC) 작성 예시 보여줘"
      ]
    };
  }

  /**
   * 마크다운 텍스트를 안전한 HTML로 변환하는 경량 파서
   */
  formatMarkdown(md) {
    if (!md) return "";

    let html = md;

    // 코드 블록 (``` ~ ```)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="code-block"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // 헤딩 (###, ####)
    html = html.replace(/^### (.*$)/gim, '<h3 class="chat-heading-3">$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4 class="chat-heading-4">$1</h4>');

    // 볼드 (**텍스트**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 이탤릭 (*텍스트*)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 인용문구 (> 텍스트)
    html = html.replace(/^> (.*$)/gim, '<blockquote class="chat-quote">$1</blockquote>');

    // 수평선 (---)
    html = html.replace(/^---$/gim, '<hr class="chat-divider">');

    // 마크다운 표 처리
    html = this.parseMarkdownTable(html);

    // 불릿 리스트 (* 항목)
    html = html.replace(/^\* (.*$)/gim, '<li class="chat-list-item">$1</li>');
    html = html.replace(/(<li class="chat-list-item">.*<\/li>(\n?))+/g, (match) => {
      return `<ul class="chat-list">${match}</ul>`;
    });

    // 줄바꿈 보존
    html = html.replace(/\n\n/g, '<p class="chat-paragraph"></p>');
    html = html.replace(/\n/g, '<br>');

    // 뱃지 강조 (예: [S = 9], [H])
    html = html.replace(/\[\s*(S\s*=\s*\d+|O\s*=\s*\d+|D\s*=\s*\d+)\s*\]/g, '<span class="score-pill">$1</span>');
    html = html.replace(/\[\s*(AP\s*=\s*High\s*\(H\)|AP\s*=\s*Medium\s*\(M\)|AP\s*=\s*Low\s*\(L\))\s*\]/g, '<span class="badge-ap">$1</span>');

    return html;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
  }

  /**
   * 간단한 마크다운 테이블 파서
   */
  parseMarkdownTable(text) {
    const tableRegex = /\|(.+)\|[\r\n]+\|([-: ]+\|)+[\r\n]+((\|.+[\r\n]+)+)/g;
    return text.replace(tableRegex, (match) => {
      const lines = match.trim().split("\n").map((l) => l.trim());
      if (lines.length < 3) return match;

      const headerCells = lines[0]
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map((c) => `<th>${c.trim()}</th>`)
        .join("");

      const bodyRows = lines
        .slice(2)
        .map((line) => {
          const cells = line
            .split("|")
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map((c) => `<td>${c.trim()}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `<div class="table-container"><table class="chat-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
    });
  }
}
