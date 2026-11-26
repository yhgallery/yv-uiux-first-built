import React, { useMemo, useRef, useState } from 'react';
import { CandlePoint, MarketSymbol, TimeframeKey } from '../data/marketsData';

interface InteractiveChartProps {
  symbol: MarketSymbol;
  points: CandlePoint[];
  prevClose: number;
  periodChangePct: number;
  timeframe: TimeframeKey;
  chartType?: 'area' | 'candles';
  height?: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  points,
  prevClose,
  periodChangePct,
  chartType = 'area',
  height = 310,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 960;
  const padLeft = 10;
  const padRight = 76;
  const padTop = 18;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { minVal, maxVal, yTicks } = useMemo(() => {
    const lows = points.map((p) => p.low);
    const highs = points.map((p) => p.high);
    const rawMin = Math.min(...lows, prevClose);
    const rawMax = Math.max(...highs, prevClose);
    const span = rawMax - rawMin || 1;
    const min = rawMin - span * 0.08;
    const max = rawMax + span * 0.08;

    const tickCount = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(min + ((max - min) * i) / tickCount);
    }
    return { minVal: min, maxVal: max, yTicks: ticks };
  }, [points, prevClose]);

  const toX = (idx: number) => {
    if (points.length <= 1) return padLeft;
    return padLeft + (idx / (points.length - 1)) * plotW;
  };

  const toY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - ratio * plotH;
  };

  const isUp = periodChangePct >= 0;
  const lineColor = isUp ? '#089981' : '#F23645';
  const gradientId = `tv-area-grad-${symbol.symbol.replace(/[^a-zA-Z0-9]/g, '')}-${isUp ? 'up' : 'dn'}`;

  const linePath = useMemo(() => {
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx).toFixed(2)} ${toY(p.close).toFixed(2)}`)
      .join(' ');
  }, [points, minVal, maxVal]);

  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const lastX = toX(points.length - 1).toFixed(2);
    const firstX = toX(0).toFixed(2);
    const baseY = (padTop + plotH).toFixed(2);
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [linePath, points.length, plotH]);

  const prevCloseY = toY(prevClose);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const clampedX = Math.max(padLeft, Math.min(padLeft + plotW, relX));
    const ratio = (clampedX - padLeft) / plotW;
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];
  const activeX = hoverIdx !== null ? toX(hoverIdx) : null;
  const activeY = hoverIdx !== null && activePoint ? toY(activePoint.close) : null;

  const formatNum = (val: number) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: symbol.decimals,
      maximumFractionDigits: symbol.decimals,
    });

  // Choose ~6 evenly spaced X-axis labels
  const xLabelIndices = useMemo(() => {
    const steps = 6;
    const idxs: number[] = [];
    for (let i = 0; i < steps; i++) {
      idxs.push(Math.round((i / (steps - 1)) * (points.length - 1)));
    }
    return Array.from(new Set(idxs));
  }, [points.length]);

  const candleW = Math.max(3, Math.min(12, (plotW / points.length) * 0.62));

  return (
    <div className="relative w-full select-none">
      {/* Live / Hover Readout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[#6A6D78] dark:text-[#868993]">
          <span className="font-semibold text-[#131722] dark:text-[#D1D4DC]">
            {symbol.symbol} · {symbol.exchange}
          </span>
          {activePoint && (
            <div className="flex flex-wrap items-center gap-3 font-mono-num">
              <span>
                O <strong className="font-medium text-[#131722] dark:text-[#D1D4DC]">{formatNum(activePoint.open)}</strong>
              </span>
              <span>
                H <strong className="font-medium text-[#131722] dark:text-[#D1D4DC]">{formatNum(activePoint.high)}</strong>
              </span>
              <span>
                L <strong className="font-medium text-[#131722] dark:text-[#D1D4DC]">{formatNum(activePoint.low)}</strong>
              </span>
              <span>
                C <strong className={`font-medium ${isUp ? 'text-[#089981]' : 'text-[#F23645]'}`}>{formatNum(activePoint.close)}</strong>
              </span>
              <span className="hidden sm:inline text-[#6A6D78] dark:text-[#868993]">
                {activePoint.label}
              </span>
            </div>
          )}
        </div>
        <div className="font-mono-num text-xs text-[#6A6D78] dark:text-[#868993]">
          Prev close: <span className="text-[#131722] dark:text-[#D1D4DC] font-medium">{formatNum(prevClose)}</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto cursor-crosshair block"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`${symbol.name} interactive price chart`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.24" />
            <stop offset="85%" stopColor={lineColor} stopOpacity="0.02" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines + right Y-axis labels */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={i}>
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
                fontSize="11"
                className="fill-[#6A6D78] dark:fill-[#868993] font-mono-num"
              >
                {formatNum(tick)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines + X-axis labels */}
        {xLabelIndices.map((idx) => {
          const x = toX(idx);
          const pt = points[idx];
          if (!pt) return null;
          return (
            <g key={idx}>
              <line
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + plotH}
                stroke="currentColor"
                className="text-[#F0F3FA] dark:text-[#1E222D]"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                className="fill-[#6A6D78] dark:fill-[#868993] font-mono-num"
              >
                {pt.label}
              </text>
            </g>
          );
        })}

        {/* Dashed previous close baseline */}
        <line
          x1={padLeft}
          y1={prevCloseY}
          x2={padLeft + plotW}
          y2={prevCloseY}
          stroke="#787B86"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.7"
        />

        {chartType === 'area' ? (
          <>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.1"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        ) : (
          <g>
            {points.map((pt, idx) => {
              const x = toX(idx);
              const yHigh = toY(pt.high);
              const yLow = toY(pt.low);
              const yOpen = toY(pt.open);
              const yClose = toY(pt.close);
              const candleUp = pt.close >= pt.open;
              const cColor = candleUp ? '#089981' : '#F23645';
              const bodyTop = Math.min(yOpen, yClose);
              const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));
              return (
                <g key={idx}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={cColor} strokeWidth="1.2" />
                  <rect
                    x={x - candleW / 2}
                    y={bodyTop}
                    width={candleW}
                    height={bodyH}
                    fill={cColor}
                    rx="1"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Current price pill on right Y-axis */}
        {points.length > 0 && (
          <g transform={`translate(${padLeft + plotW + 2}, ${toY(points[points.length - 1].close) - 10})`}>
            <rect width="70" height="20" rx="3" fill={lineColor} />
            <text
              x="35"
              y="13.5"
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="600"
              fill="#FFFFFF"
              className="font-mono-num"
            >
              {formatNum(points[points.length - 1].close)}
            </text>
          </g>
        )}

        {/* Crosshair on hover */}
        {hoverIdx !== null && activeX !== null && activeY !== null && activePoint && (
          <g>
            <line
              x1={activeX}
              y1={padTop}
              x2={activeX}
              y2={padTop + plotH}
              stroke="#787B86"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={padLeft}
              y1={activeY}
              x2={padLeft + plotW}
              y2={activeY}
              stroke="#787B86"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={activeX} cy={activeY} r="4.5" fill={lineColor} stroke="#FFFFFF" strokeWidth="2" />

            {/* Y-axis hover price tag */}
            <g transform={`translate(${padLeft + plotW + 2}, ${activeY - 10})`}>
              <rect width="70" height="20" rx="3" fill="#131722" />
              <text
                x="35"
                y="13.5"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                fill="#FFFFFF"
                className="font-mono-num"
              >
                {formatNum(activePoint.close)}
              </text>
            </g>

            {/* X-axis hover time tag */}
            <g transform={`translate(${Math.min(Math.max(activeX - 32, padLeft), padLeft + plotW - 64)}, ${padTop + plotH + 4})`}>
              <rect width="64" height="19" rx="3" fill="#131722" />
              <text
                x="32"
                y="13"
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill="#FFFFFF"
                className="font-mono-num"
              >
                {activePoint.label}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
