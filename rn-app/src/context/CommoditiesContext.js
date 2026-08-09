import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { YEARS } from "../data/data";
import { COMMODITIES, sortByCat, CAT_COLOR } from "../data/commodities";
import { lsGet, lsSet, lsDel } from "../utils/storage";
import { COMMODITY_SYM_DEF, quoteMany } from "../api/quotes";

const CommoditiesContext = createContext(null);

export function useCommodities() {
  const ctx = useContext(CommoditiesContext);
  if (!ctx) throw new Error("useCommodities must be used within CommoditiesProvider");
  return ctx;
}

const yi = (y) => YEARS.indexOf(y);
const getYR = (d) => d.yr;

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5분마다 자동 갱신

export function CommoditiesProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [year, setYear] = useState(2026);
  const [catFilter, setCatFilter] = useState("전체");
  const [over, setOver] = useState({});
  const [symbols, setSymbols] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    (async () => {
      const [o, s] = await Promise.all([lsGet("commodity_over", {}), lsGet("commodity_syms", {})]);
      setOver(o || {});
      setSymbols(s || {});
      setReady(true);
    })();
  }, []);

  const BASE = useMemo(() => sortByCat(COMMODITIES), []);

  const D = useMemo(
    () =>
      BASE.map((d) => {
        const o = over[d.id];
        if (!o) return d;
        return { ...d, val: o.val, prev: o.prev ?? d.prev, sub: o.sub || d.sub, edited: true };
      }),
    [BASE, over]
  );

  const CATS = useMemo(() => {
    const seen = [];
    BASE.forEach((d) => { if (!seen.includes(d.cat)) seen.push(d.cat); });
    return seen;
  }, [BASE]);

  const findOne = useCallback((id) => BASE.find((d) => d.id === id), [BASE]);

  const editValue = useCallback((id, patch) => {
    setOver((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      lsSet("commodity_over", next);
      return next;
    });
  }, []);

  const resetEdits = useCallback(() => {
    setOver({});
    lsDel("commodity_over");
  }, []);

  const saveSymbol = useCallback((id, sym) => {
    setSymbols((prev) => {
      const next = { ...prev, [id]: sym };
      lsSet("commodity_syms", next);
      return next;
    });
  }, []);

  const resetSymbols = useCallback(() => {
    setSymbols({});
    lsDel("commodity_syms");
  }, []);

  const symbolFor = useCallback((id) => symbols[id] || COMMODITY_SYM_DEF[id] || null, [symbols]);

  // 버튼 없이 10개 원자재 전체를 자동으로 갱신한다.
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const pairs = BASE.map((d) => [d.id, symbolFor(d.id)]).filter(([, sym]) => !!sym);
      const { ok } = await quoteMany(pairs);
      if (ok.length) {
        setOver((prev) => {
          const next = { ...prev };
          ok.forEach(({ id, val, date }) => {
            const d = findOne(id);
            next[id] = {
              val,
              prev: (prev[id] && prev[id].prev) ?? (d ? d.prev : undefined),
              sub: `실시간 · ${date || ""}`.trim(),
            };
          });
          lsSet("commodity_over", next);
          return next;
        });
      }
      setLastRefresh(new Date());
    } catch (e) {
      // 조용히 실패 — 시드 데이터가 그대로 유지된다.
    } finally {
      setRefreshing(false);
    }
  }, [BASE, symbolFor, findOne]);

  // 화면을 열면 즉시 자동 갱신 + 이후 주기적 자동 갱신. 버튼이 필요 없다.
  useEffect(() => {
    if (!ready) return;
    refreshAll();
    const id = setInterval(refreshAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const value = {
    ready,
    YEARS,
    year, setYear,
    catFilter, setCatFilter,
    CATS, CAT_COLOR,
    BASE, D,
    over, editValue, resetEdits,
    symbols, symbolFor, saveSymbol, resetSymbols,
    refreshing, lastRefresh, refreshAll,
    getYR, yi,
  };

  return <CommoditiesContext.Provider value={value}>{children}</CommoditiesContext.Provider>;
}
