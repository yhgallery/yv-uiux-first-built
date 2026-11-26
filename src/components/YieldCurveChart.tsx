import React, { useState } from 'react';
import { YIELD_CURVE_DATA } from '../data/marketsData';

export const YieldCurveChart: React.FC = () => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showMonthAgo, setShowMonthAgo] = useState(true);
  const [showYearAgo, setShowYearAgo] = useState(true);

  const width = 640;
  const height = 240;
  const padLeft = 16;
  const padRight = 52;
  const padTop = 18;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minY = 3.8;
  const maxY = 5.6;
  const yTicks = [4.0, 4.4, 4.8, 5.2, 5.6];

  const toX = (i: number) => padLeft + (i / (YIELD_CURVE_DATA.length - 1)) * plotW;
  const toY = (v: number) => padTop + plotH - ((v - minY) / (maxY - minY)) * plotH;

  const buildPath = (key: 'current' | 'oneMonthAgo' | 'oneYearAgo') =>
    YIELD_CURVE_DATA.map(
      (pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt[key]).toFixed(1)}`
    ).join(' ');

  const hovered = hoverIdx !== null ? YIELD_CURVE_DATA[hoverIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#131722] dark:text-[#D1D4DC]">
            <span className="w-3 h-0.5 bg-[#2962FF] inline-block" />
            Current
          </span>
          <button
            type="button"
            onClick={() => setShowMonthAgo((v) => !v)}
            className={`inline-flex items-center gap-1.5 cursor-pointer transition-opacity ${
              showMonthAgo ? 'opacity-100 text-[#131722] dark:text-[#D1D4DC]' : 'opacity-40 text-[#6A6D78]'
            }`}
          >
            <span className="w-3 h-0.5 bg-[#F59E0B] inline-block" />
            1M ago
          </button>
          <button
            type="button"
            onClick={() => setShowYearAgo((v) => !v)}
            className={`inline-flex items-center gap-1.5 cursor-pointer transition-opacity ${
              showYearAgo ? 'opacity-100 text-[#131722] dark:text-[#D1D4DC]' : 'opacity-40 text-[#6A6D78]'
            }`}
          >
            <span className="w-3 h-0.5 bg-[#868993] inline-block" />
            1Y ago
          </button>
        </div>

        <div className="font-mono-num text-[#6A6D78] dark:text-[#868993]">
          {hovered ? (
            <span className="text-[#131722] dark:text-[#D1D4DC]">
              <strong>{hovered.maturity}</strong>: {hovered.current.toFixed(2)}% (1M: {hovered.oneMonthAgo.toFixed(2)}% · 1Y: {hovered.oneYearAgo.toFixed(2)}%)
            </span>
          ) : (
            <span>10Y–2Y spread: +0.04%</span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        {yTicks.map((t) => {
          const y = toY(t);
          return (
            <g key={t}>
              <line
                x1={padLeft}
                y1={y}
                x2={padLeft + plotW}
                y2={y}
                stroke="currentColor"
                className="text-[#E0E3EB] dark:text-[#2A2E39]"
                strokeWidth="1"
              />
              <text
                x={padLeft + plotW + 8}
                y={y + 3.5}
                fontSize="10.5"
                className="fill-[#6A6D78] dark:fill-[#868993] font-mono-num"
              >
                {t.toFixed(1)}%
              </text>
            </g>
          );
        })}

        {showYearAgo && (
          <path
            d={buildPath('oneYearAgo')}
            fill="none"
            stroke="#868993"
            strokeWidth="1.6"
            strokeDasharray="4 4"
          />
        )}
        {showMonthAgo && (
          <path
            d={buildPath('oneMonthAgo')}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.8"
          />
        )}
        <path
          d={buildPath('current')}
          fill="none"
          stroke="#2962FF"
          strokeWidth="2.4"
        />

        {YIELD_CURVE_DATA.map((pt, i) => {
          const x = toX(i);
          const y = toY(pt.current);
          return (
            <g
              key={pt.maturity}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer"
            >
              <rect x={x - 20} y={padTop} width="40" height={plotH} fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={hoverIdx === i ? 5 : 3.2}
                fill="#2962FF"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10.5"
                className="fill-[#6A6D78] dark:fill-[#868993] font-mono-num"
              >
                {pt.maturity}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
