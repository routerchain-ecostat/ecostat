// 지수·채권 실시간 시세 — Stooq 무료 CSV 엔드포인트.
// 네이티브 환경(iOS/Android)은 브라우저의 CORS 제약이 없어 프록시 없이 바로 호출 가능.
// 심볼 표기가 실제와 다를 수 있어 사용자가 설정 화면에서 직접 고칠 수 있게 SYM_DEF를 기본값으로 둔다.

export const SYM_DEF = {
  spx: "^spx",
  ust10: "10usy.b",
  kospi: "^kospi",
  kbond10: "10kry.b",
  nikkei: "^nkx",
  jgb10: "10jpy.b",
  sx5e: "^stx50",
  bund10: "10dey.b",
  sse: "^shc",
  cgb10: "10cny.b",
};

// 원자재 실시간 시세 심볼 (Stooq 선물 표기). 계약월이 바뀌면 실제와 다를 수 있어
// 설정 탭에서 개별 수정 가능하게 해뒀다.
export const COMMODITY_SYM_DEF = {
  wti: "cl.f",
  brent: "brn.f",
  natgas: "ng.f",
  spot_gold: "xauusd",
  spot_silver: "xagusd",
  platinum: "pl.f",
  copper: "hg.f",
  corn: "c.f",
  wheat: "w.f",
  soybean: "s.f",
  rbob: "rb.f",
  ttf: "ttf.f",
  gasoil: "qs.f",
  coffee: "kc.f",
  sugar: "sb.f",
  cotton: "ct.f",
  cocoa_ldn: "cc.uk",
  cocoa_ny: "cc.f",
  rice: "zr.f",
  palladium: "pa.f",
  aluminum: "aluminium.c",
  zinc: "zinc.c",
  nickel: "nickel.c",
  lead: "lead.c",
  cattle: "lc.f",
  hogs: "he.f",
};

export const isMktId = (id) => !!SYM_DEF[id];
export const isCommodityId = (id) => !!COMMODITY_SYM_DEF[id];

export const fmtNum = (v) =>
  Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2);

// 종목 하나의 최신 종가를 가져온다. 실패하면 에러를 던진다(호출부에서 try/catch).
export async function quoteOne(sym) {
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const txt = await res.text();
  const rows = txt.trim().split("\n");
  if (rows.length < 2) throw new Error("빈 응답");
  const head = rows[0].split(",").map((s) => s.trim().toLowerCase());
  const cell = rows[1].split(",");
  const ci = head.indexOf("close");
  const di = head.indexOf("date");
  const val = parseFloat(cell[ci]);
  if (isNaN(val)) throw new Error("시세 없음 (심볼 확인 필요)");
  return { val, date: (cell[di] || "").trim() };
}

// 여러 종목을 한 번에 병렬 조회한다. 자동(백그라운드) 갱신에서 사용.
// 실패한 항목은 결과에서 제외되고 나머지는 정상 반영된다.
export async function quoteMany(idSymPairs) {
  const settled = await Promise.allSettled(
    idSymPairs.map(async ([id, sym]) => ({ id, ...(await quoteOne(sym)) }))
  );
  const ok = [];
  const failed = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(r.value);
    else failed.push(idSymPairs[i][0]);
  });
  return { ok, failed };
}
