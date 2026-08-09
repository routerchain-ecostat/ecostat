import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  YEARS, ERA, IND_US, CDATA, COUNTRY_LIST, CORR_IDS, CORR, SHORT, SHORT_X,
  FAM_ORDER, CAL_US, CHAINS, Y, getYR, yi, sortByFam,
} from "../data/data";
import { lsGet, lsSet, lsDel } from "../utils/storage";
import { SYM_DEF, isMktId, quoteMany } from "../api/quotes";
import { refreshMacroIndicators } from "../api/aiRefresh";

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// 자동 갱신 주기 — 지수·채권은 자주(시장이 계속 움직이므로), 나머지 거시지표는
// 드물게(발표 자체가 한 달에 한 번인 경우가 대부분이므로) 돈다.
const MARKET_INTERVAL_MS = 5 * 60 * 1000;   // 5분
const MACRO_INTERVAL_MS = 30 * 60 * 1000;   // 30분

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [country, setCountryState] = useState("US");
  const [year, setYear] = useState(2026);
  const [famFilter, setFamFilter] = useState("전체");
  const [corSel, setCorSel] = useState(null); // [idA, idB] | null

  const [over, setOver] = useState({});       // 자동/수동으로 갱신된 값: { id: {val,prev,sub} }
  const [symbols, setSymbols] = useState({}); // Stooq 심볼 재정의: { id: "^symbol" }

  const [marketRefreshing, setMarketRefreshing] = useState(false);
  const [macroRefreshing, setMacroRefreshing] = useState(false);
  const [lastMarketRefresh, setLastMarketRefresh] = useState(null);
  const [lastMacroRefresh, setLastMacroRefresh] = useState(null);
  const [macroError, setMacroError] = useState(null);

  const overRef = useRef(over);
  overRef.current = over;

  // 최초 1회 저장된 값 불러오기
  useEffect(() => {
    (async () => {
      const [o, s] = await Promise.all([lsGet("over", {}), lsGet("syms", {})]);
      setOver(o || {});
      setSymbols(s || {});
      setReady(true);
    })();
  }, []);

  const isUS = country === "US";
  const meta = useMemo(() => COUNTRY_LIST.find((c) => c.id === country), [country]);

  const rawList = useMemo(() => (isUS ? IND_US : CDATA[country].ind), [isUS, country]);
  const BASE = useMemo(() => sortByFam(rawList), [rawList]);

  // 자동/수동으로 갱신된 값을 반영한 목록 (2026년 "최신" 화면 전용)
  const D = useMemo(
    () =>
      BASE.map((d) => {
        const o = over[d.id];
        if (!o) return d;
        return { ...d, val: o.val, prev: o.prev ?? d.prev, sub: o.sub || d.sub, edited: true };
      }),
    [BASE, over]
  );

  const ERAS = isUS ? ERA : CDATA[country].era;
  const CAL_C = isUS ? CAL_US : CDATA[country].cal;
  const CIDS_C = isUS ? CORR_IDS : CDATA[country].cids;
  const CORR_C = isUS ? CORR : CDATA[country].corr;
  const CHAIN_C = CHAINS[country];

  const FAMS = useMemo(() => {
    const seen = [];
    BASE.forEach((d) => { if (!seen.includes(d.fam)) seen.push(d.fam); });
    return seen;
  }, [BASE]);

  const SH = useCallback((id) => SHORT[id] || SHORT_X[id] || "", []);
  const corrC = useCallback(
    (a, b) => CORR_C[a + "|" + b] || CORR_C[b + "|" + a] || null,
    [CORR_C]
  );
  const findInd = useCallback(
    (cid, id) => (cid === "US" ? IND_US : CDATA[cid].ind).find((x) => x.id === id),
    []
  );

  const setCountry = useCallback((id) => {
    setCountryState(id);
    setFamFilter("전체");
    setCorSel(null);
  }, []);

  const editValue = useCallback((id, patch) => {
    setOver((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      lsSet("over", next);
      return next;
    });
  }, []);

  const resetEdits = useCallback(() => {
    setOver({});
    lsDel("over");
  }, []);

  const saveSymbol = useCallback((id, sym) => {
    setSymbols((prev) => {
      const next = { ...prev, [id]: sym };
      lsSet("syms", next);
      return next;
    });
  }, []);

  const resetSymbols = useCallback(() => {
    setSymbols({});
    lsDel("syms");
  }, []);

  const symbolFor = useCallback((id) => symbols[id] || SYM_DEF[id] || null, [symbols]);

  // ── 자동 갱신: 지수·채권 (Stooq) ──────────────────────────────
  // 버튼 없이 현재 나라의 시장(지수·채권) 지표를 자동으로 불러온다.
  const refreshMarket = useCallback(async () => {
    const targets = BASE.filter((d) => isMktId(d.id));
    if (!targets.length) return;
    setMarketRefreshing(true);
    try {
      const pairs = targets.map((d) => [d.id, symbolFor(d.id)]).filter(([, sym]) => !!sym);
      const { ok } = await quoteMany(pairs);
      if (ok.length) {
        setOver((prev) => {
          const next = { ...prev };
          ok.forEach(({ id, val, date }) => {
            const d = targets.find((x) => x.id === id);
            next[id] = {
              val,
              prev: (prev[id] && prev[id].prev) ?? (d ? d.prev : undefined),
              sub: `실시간 · ${date || ""}`.trim(),
            };
          });
          lsSet("over", next);
          return next;
        });
      }
      setLastMarketRefresh(new Date());
    } catch (e) {
      // 자동 갱신은 조용히 실패한다 — 화면의 시드 데이터가 그대로 유지된다.
    } finally {
      setMarketRefreshing(false);
    }
  }, [BASE, symbolFor]);

  // ── 자동 갱신: 나머지 거시지표 (Claude API + 웹 검색) ──────────
  const refreshMacro = useCallback(async () => {
    if (!BASE.length) return;
    setMacroRefreshing(true);
    setMacroError(null);
    try {
      const items = BASE.map((d) => ({ id: d.id, name: d.name, org: d.org, unit: d.unit }));
      const rows = await refreshMacroIndicators(meta.name, items);
      if (rows.length) {
        setOver((prev) => {
          const next = { ...prev };
          rows.forEach((r) => {
            const d = BASE.find((x) => x.id === r.id);
            next[r.id] = {
              val: r.val,
              prev: typeof r.prev === "number" ? r.prev : (prev[r.id] && prev[r.id].prev) ?? (d ? d.prev : undefined),
              sub: r.asOf || (d ? d.sub : undefined),
            };
          });
          lsSet("over", next);
          return next;
        });
      }
      setLastMacroRefresh(new Date());
    } catch (e) {
      // 백엔드가 연결돼 있지 않으면(로컬 개발 등) 여기서 실패한다.
      // 화면은 시드 데이터로 정상 동작하고, 상단에 조용한 안내만 남긴다.
      setMacroError(e.message || "자동 갱신을 사용할 수 없습니다");
    } finally {
      setMacroRefreshing(false);
    }
  }, [BASE, meta]);

  const refreshAll = useCallback(() => {
    refreshMarket();
    refreshMacro();
  }, [refreshMarket, refreshMacro]);

  // 나라가 바뀌거나 앱이 처음 준비되면 즉시 자동 갱신 + 이후 주기적으로 자동 갱신.
  // 사용자가 버튼을 누를 필요가 없다. 화면을 당겨서(pull-to-refresh) 수동으로도
  // 같은 refreshAll을 다시 부를 수 있다.
  useEffect(() => {
    if (!ready) return;
    refreshMarket();
    refreshMacro();
    const mId = setInterval(refreshMarket, MARKET_INTERVAL_MS);
    const gId = setInterval(refreshMacro, MACRO_INTERVAL_MS);
    return () => {
      clearInterval(mId);
      clearInterval(gId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, country]);

  const value = {
    ready,
    YEARS,
    country, setCountry,
    year, setYear,
    famFilter, setFamFilter,
    corSel, setCorSel,
    meta, isUS,
    BASE, D, FAMS,
    ERAS, CAL_C, CIDS_C, CORR_C, CHAIN_C,
    SH, corrC, findInd,
    over, editValue, resetEdits,
    symbols, symbolFor, saveSymbol, resetSymbols,
    marketRefreshing, macroRefreshing, lastMarketRefresh, lastMacroRefresh, macroError,
    refreshAll, refreshMarket, refreshMacro,
    getYR, yi,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
