import React from "react";
import { View, Text as RNText } from "react-native";
import Svg, { Line, Rect, Circle, Polyline, Path, Text as SvgText } from "react-native-svg";
import { C } from "../theme/colors";

const W = 320;
const PL = 40;
const PR = 8;
const PT = 10;
const PB = 20;

/**
 * points: [{ label: string, value: number|null, verified: boolean }]
 * kind:   "line" | "bar" | "area" | "step"
 * color:  선 색 (계열 색상)
 * refLine: 기준선 값 (예: 물가 목표 2, PMI 기준선 50) — 없으면 null
 * highlightIndex: 강조할 인덱스 (연도 모드에서 선택된 연도)
 * fmt: 값 포맷 함수
 */
export default function TrendChart({
  points,
  kind = "line",
  color = C.growth,
  refLine = null,
  highlightIndex = null,
  height = 132,
  fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(v % 1 === 0 ? 1 : 2)),
}) {
  const n = points.length;
  if (!n) return null;
  const vals = points.map((p) => p.value).filter((v) => v != null);
  let mn = Math.min(...vals);
  let mx = Math.max(...vals);
  const useBar = kind === "bar";
  if (useBar && mn > 0) mn = 0;
  if (refLine != null) {
    mn = Math.min(mn, refLine);
    mx = Math.max(mx, refLine);
  }
  const pad = (mx - mn) * 0.14 || Math.abs(mx * 0.1) || 1;
  mn -= pad;
  mx += pad;

  const X = (i) => PL + ((W - PL - PR) * (n === 1 ? 0.5 : i / (n - 1)));
  const Y = (v) => PT + (height - PT - PB) * (1 - (v - mn) / (mx - mn || 1));

  const gridLines = [0, 1, 2].map((k) => mn + ((mx - mn) * k) / 2);

  // 라벨 솎아내기: 11개 이상이면 강조 인덱스·양끝만 남기고 홀수 인덱스 생략
  const showLabel = (i) => {
    if (n <= 8) return true;
    if (i === 0 || i === n - 1) return true;
    if (highlightIndex === i) return true;
    return i % 2 === 0;
  };

  return (
    <View style={{ width: "100%" }}>
      <Svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}>
        {/* 격자선 + y축 라벨 */}
        {gridLines.map((v, k) => (
          <React.Fragment key={k}>
            <Line x1={PL} y1={Y(v)} x2={W - PR} y2={Y(v)} stroke={C.grid} strokeDasharray="2 3" />
            <SvgText x={PL - 4} y={Y(v) + 3} fontSize="7.5" fill={C.ink60} textAnchor="end">
              {fmt(v)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* 기준선 */}
        {refLine != null && (
          <Line x1={PL} y1={Y(refLine)} x2={W - PR} y2={Y(refLine)} stroke={C.ink60} strokeDasharray="4 3" />
        )}

        {/* 강조 세로선 (연도 모드) */}
        {highlightIndex != null && (
          <Line
            x1={X(highlightIndex)} y1={PT} x2={X(highlightIndex)} y2={height - PB}
            stroke={color} strokeDasharray="3 2" strokeOpacity={0.45}
          />
        )}

        {useBar ? (
          <>
            {points.map((p, i) => {
              if (p.value == null) return null;
              const bw = ((W - PL - PR) / n) * 0.6;
              const z = Y(Math.max(mn, 0));
              const y = Y(p.value);
              const top = Math.min(y, z);
              const h = Math.max(Math.abs(z - y), 1);
              const dim = highlightIndex != null && i !== highlightIndex;
              return (
                <Rect
                  key={i}
                  x={X(i) - bw / 2}
                  y={top}
                  width={bw}
                  height={h}
                  fill={color}
                  fillOpacity={dim ? 0.28 : p.verified ? 0.92 : 0.34}
                />
              );
            })}
            <Line x1={PL} y1={Y(0)} x2={W - PR} y2={Y(0)} stroke={C.ink} strokeWidth={1} />
          </>
        ) : (
          <>
            {kind === "area" && (
              <Path
                d={
                  `M${PL},${height - PB} ` +
                  points.map((p, i) => (p.value == null ? "" : `L${X(i)},${Y(p.value)}`)).join(" ") +
                  ` L${W - PR},${height - PB} Z`
                }
                fill={color}
                fillOpacity={0.13}
              />
            )}
            {kind === "step" ? (
              <Path
                d={points
                  .map((p, i) => {
                    if (p.value == null) return "";
                    const cmd = i === 0 ? `M${X(i)},${Y(p.value)}` : `H${X(i)} V${Y(p.value)}`;
                    return cmd;
                  })
                  .join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />
            ) : (
              <Polyline
                points={points
                  .map((p, i) => (p.value == null ? null : `${X(i)},${Y(p.value)}`))
                  .filter(Boolean)
                  .join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />
            )}
            {points.map((p, i) => {
              if (p.value == null) return null;
              const on = highlightIndex === i;
              return (
                <Circle
                  key={i}
                  cx={X(i)}
                  cy={Y(p.value)}
                  r={on ? 4.4 : 2.8}
                  fill={p.verified || on ? color : "#F6F7F3"}
                  stroke={color}
                  strokeWidth={1.4}
                />
              );
            })}
          </>
        )}

        {/* x축 라벨 */}
        {points.map((p, i) =>
          showLabel(i) ? (
            <SvgText
              key={i}
              x={X(i)}
              y={height - 5}
              fontSize="7.5"
              fontWeight={highlightIndex === i ? "700" : "400"}
              fill={highlightIndex === i ? C.ink : C.ink60}
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}

/** 보조(2단) 미니 라인차트 — 참가율·기대인플레 등 secondary series용 */
export function MiniChart({ points, label, height = 52, color = C.ink60 }) {
  const n = points.length;
  const vals = points.map((p) => p.value).filter((v) => v != null);
  let mn = Math.min(...vals), mx = Math.max(...vals);
  const pad = (mx - mn) * 0.2 || 0.5;
  mn -= pad; mx += pad;
  const X = (i) => PL + (W - PL - PR) * i / (n - 1);
  const Yv = (v) => 12 + (height - 16) * (1 - (v - mn) / (mx - mn || 1));
  return (
    <View style={{ width: "100%" }}>
      <RNText style={{ fontSize: 9, color: C.ink60, marginLeft: PL, marginBottom: 2 }}>{label}</RNText>
      <Svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height}>
        <SvgText x={PL - 4} y={Yv(mx - pad) + 3} fontSize="7" fill={C.ink60} textAnchor="end">
          {(mx - pad).toFixed(1)}
        </SvgText>
        <SvgText x={PL - 4} y={Yv(mn + pad) + 3} fontSize="7" fill={C.ink60} textAnchor="end">
          {(mn + pad).toFixed(1)}
        </SvgText>
        <Polyline
          points={points.map((p, i) => `${X(i)},${Yv(p.value)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.4}
        />
      </Svg>
    </View>
  );
}
