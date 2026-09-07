/**
 * AIAG-VDA 통합 1판 표준 Action Priority (AP) 및 RPN 계산기 모듈
 */

const FMEACalculator = {
  /**
   * 공식 AIAG-VDA AP 매트릭스 로직
   * @param {number} s - 심각도 (1-10)
   * @param {number} o - 발생도 (1-10)
   * @param {number} d - 검출도 (1-10)
   * @returns {{ ap: 'H'|'M'|'L', label: string, color: string, description: string, action: string }}
   */
  calculateAP: function (s, o, d) {
    s = Math.max(1, Math.min(10, parseInt(s, 10)));
    o = Math.max(1, Math.min(10, parseInt(o, 10)));
    d = Math.max(1, Math.min(10, parseInt(d, 10)));

    let ap = "L";

    if (s >= 9) {
      // S = 9 ~ 10
      if (o >= 8) {
        ap = "H";
      } else if (o >= 6) {
        ap = d >= 2 ? "H" : "M";
      } else if (o >= 4) {
        if (d >= 5) ap = "H";
        else if (d >= 2) ap = "M";
        else ap = "L";
      } else if (o >= 2) {
        if (d >= 7) ap = "H";
        else if (d >= 5) ap = "M";
        else ap = "L";
      } else {
        // O = 1
        ap = "L";
      }
    } else if (s >= 7) {
      // S = 7 ~ 8
      if (o >= 8) {
        ap = d >= 2 ? "H" : "M";
      } else if (o >= 6) {
        if (d >= 5) ap = "H";
        else ap = "M";
      } else if (o >= 4) {
        if (d >= 7) ap = "H";
        else if (d >= 2) ap = "M";
        else ap = "L";
      } else if (o >= 2) {
        if (d >= 5) ap = "M";
        else ap = "L";
      } else {
        // O = 1
        ap = "L";
      }
    } else if (s >= 4) {
      // S = 4 ~ 6
      if (o >= 8) {
        if (d >= 7) ap = "H";
        else ap = "M";
      } else if (o >= 6) {
        if (d >= 5) ap = "M";
        else ap = "L";
      } else if (o >= 4) {
        if (d >= 7) ap = "M";
        else ap = "L";
      } else {
        // O = 1 ~ 3
        ap = "L";
      }
    } else if (s >= 2) {
      // S = 2 ~ 3
      if (o >= 8 && d >= 7) {
        ap = "M";
      } else {
        ap = "L";
      }
    } else {
      // S = 1
      ap = "L";
    }

    const rpn = s * o * d;

    const details = {
      H: {
        ap: "H",
        label: "High (높은 우선순위)",
        badgeClass: "badge-high",
        color: "#ef4444",
        bgLight: "rgba(239, 68, 68, 0.15)",
        description: "최우선적 조치가 요구되는 고위험 항목입니다.",
        action: "반드시 예방(발생도 저감) 또는 검출 대책을 수립하고 실행해야 합니다. 개선 조치를 취하지 않을 경우 경영진의 특별 승인 및 사유 문서화가 요구됩니다."
      },
      M: {
        ap: "M",
        label: "Medium (중간 우선순위)",
        badgeClass: "badge-medium",
        color: "#f59e0b",
        bgLight: "rgba(245, 158, 11, 0.15)",
        description: "위험 완화를 위한 개선 조치 검토가 권장되는 항목입니다.",
        action: "설계나 공정의 예방 및 검출 관리를 개선할 수 있는 합리적인 대책을 도출하고 실행을 검토해야 합니다."
      },
      L: {
        ap: "L",
        label: "Low (낮은 우선순위)",
        badgeClass: "badge-low",
        color: "#10b981",
        bgLight: "rgba(16, 185, 129, 0.15)",
        description: "현재 관리 수준으로 충분히 통제 가능한 저위험 항목입니다.",
        action: "현재의 예방 및 검출 관리 방안을 유지하며, 추가 개선 조치는 팀 자율 판단에 따릅니다."
      }
    };

    return {
      s,
      o,
      d,
      rpn,
      ...details[ap]
    };
  },

  /**
   * S 점수 의미 요약
   */
  getSeverityDesc: function (s) {
    if (s >= 9) return "안전 관련 결함 또는 규제/법규 위반 (치명적)";
    if (s >= 7) return "차량/시스템의 주요 기능 상실 (심각)";
    if (s >= 4) return "보조 기능 상실 또는 2차 편의기능 저하 (보통)";
    if (s >= 2) return "외관/소음 불만족 등 가벼운 고객 불만 (경미)";
    return "영향 없음 / 인지 불가";
  },

  /**
   * O 점수 의미 요약
   */
  getOccurrenceDesc: function (o) {
    if (o >= 8) return "발생 빈도 매우 높음 (거의 불가피)";
    if (o >= 6) return "유사 제품에서 빈번한 고장 이력 있음";
    if (o >= 4) return "간헐적 발생 가능성 (일반 공정 수준)";
    if (o >= 2) return "발생 가능성 극히 낮음 (철저한 예방 설계)";
    return "발생 가능성 거의 전무함 (포카요케 완비)";
  },

  /**
   * D 점수 의미 요약
   */
  getDetectionDesc: function (d) {
    if (d >= 8) return "검출 극히 어려움 / 신뢰성 매우 취약";
    if (d >= 5) return "수동 검사 또는 간접 측정에 의존";
    if (d >= 2) return "공정 내 자동 비전 검사 및 100% 전기적 인터록";
    return "결함 즉시 100% 자동 검출 및 라인 자동 정지";
  }
};
