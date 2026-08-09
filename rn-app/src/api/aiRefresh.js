// 시장(지수·채권·원자재)이 아닌 나머지 거시지표(CPI, GDP, 실업률 등)는
// Stooq 같은 무료 실시간 시세 API가 없다. 대신 Claude API의 웹 검색 기능으로
// 각국 공식 발표처의 최신 공표치를 찾아와 자동 반영한다.
//
// ⚠️ 중요: 이 호출은 api.anthropic.com을 인증 없이 직접 두드린다. Claude.ai
// 아티팩트 환경 안에서는 이 방식이 동작하지만, 앱스토어에 배포하는 "진짜"
// 독립 앱에서는 API 키가 없어 이 호출이 실패한다. 프로덕션에서 쓰려면
// 자체 백엔드(서버리스 함수 등)를 하나 두고, 거기서 Anthropic API 키를 보관한
// 채로 이 URL 대신 그 백엔드 주소를 호출하도록 BACKEND_URL만 바꾸면 된다.
// 실패하더라도 화면에 있는 시드 데이터는 그대로 유지되고 앱이 멈추지 않는다.

const BACKEND_URL = "https://api.anthropic.com/v1/messages";

export async function refreshMacroIndicators(countryName, items) {
  // items: [{id, name, org, unit}]
  const list = items.map((d) => `${d.id} = ${d.name} (${d.org}, 단위 ${d.unit})`).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `오늘은 ${today}입니다. 아래는 ${countryName}의 경제지표입니다.
각각의 "가장 최근 공식 발표값"을 웹 검색으로 확인하세요.

${list}

아래 JSON 배열만 출력하세요. 서문·마크다운 백틱 금지.
[{"id":"cpi","val":숫자,"prev":숫자,"asOf":"2026년 6월 (7월 14일 발표)"}]
확인하지 못한 항목은 배열에서 제외하세요.`;

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  const txt = (j.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n");
  const m = txt.replace(/```json|```/g, "").match(/\[[\s\S]*\]/);
  if (!m) throw new Error("응답에서 데이터를 찾지 못했습니다");
  const rows = JSON.parse(m[0]).filter((r) => r && r.id && typeof r.val === "number");
  return rows; // [{id, val, prev?, asOf?}]
}
