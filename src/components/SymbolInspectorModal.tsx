import React, { useEffect, useMemo, useState } from 'react';
import { BarChart2, LineChart, Star, X } from 'lucide-react';
import {
  generateSeries,
  MarketSymbol,
  TIMEFRAMES,
  TimeframeKey,
} from '../data/marketsData';
import { InteractiveChart } from './InteractiveChart';

interface SymbolInspectorModalProps {
  symbol: MarketSymbol | null;
  onClose: () => void;
  isWatched: boolean;
  onToggleWatch: (symbolCode: string) => void;
}

export const SymbolInspectorModal: React.FC<SymbolInspectorModalProps> = ({
  symbol,
  onClose,
  isWatched,
  onToggleWatch,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1D');
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (symbol) {
      window.addEventListener('keydown', handleKey);
    }
    return () => window.removeEventListener('keydown', handleKey);
  }, [symbol, onClose]);

  const series = useMemo(() => {
    if (!symbol) return null;
    return generateSeries(symbol, timeframe);
  }, [symbol, timeframe]);

  if (!symbol || !series) return null;

  const isPositive = series.periodChangePct >= 0;

  const ratingScoreMap: Record<MarketSymbol['rating'], number> = {
    'Strong Sell': 12,
    Sell: 30,
    Neutral: 50,
    Buy: 72,
    'Strong Buy': 90,
  };
  const gaugePos = ratingScoreMap[symbol.rating];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${symbol.name} chart details`}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131722] border border-[#E0E3EB] dark:border-[#2A2E39] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#E0E3EB] dark:border-[#2A2E39]">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: symbol.badgeColor }}
            >
              {symbol.badgeText}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white">
                  {symbol.name}
                </h2>
                <span className="text-xs font-mono-num text-[#6A6D78] dark:text-[#868993]">
                  {symbol.exchange}:{symbol.symbol} · {symbol.category}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1 font-mono-num">
                <span className="text-2xl font-bold text-[#131722] dark:text-white">
                  {symbol.price.toLocaleString('en-US', {
                    minimumFractionDigits: symbol.decimals,
                    maximumFractionDigits: symbol.decimals,
                  })}
                  {symbol.unit && (
                    <span className="text-xs font-normal text-[#6A6D78] dark:text-[#868993] ml-1">
                      {symbol.unit}
                    </span>
                  )}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isPositive ? 'text-[#089981]' : 'text-[#F23645]'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {series.periodChangePct.toFixed(2)}% ({timeframe})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleWatch(symbol.symbol)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                isWatched
                  ? 'bg-[#2962FF]/10 border-[#2962FF] text-[#2962FF]'
                  : 'border-[#E0E3EB] dark:border-[#2A2E39] text-[#131722] dark:text-[#D1D4DC] hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-[#2962FF]' : ''}`} />
              <span>{isWatched ? 'Watchlisted' : 'Watchlist'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#6A6D78] hover:text-[#131722] dark:hover:text-white hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D] transition-colors cursor-pointer"
              aria-label="Close chart modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 bg-[#F0F3FA] dark:bg-[#1E222D] p-1 rounded-lg">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    timeframe === tf
                      ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                      : 'text-[#6A6D78] dark:text-[#868993] hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-[#F0F3FA] dark:bg-[#1E222D] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                    : 'text-[#6A6D78] dark:text-[#868993]'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Area</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('candles')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  chartType === 'candles'
                    ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                    : 'text-[#6A6D78] dark:text-[#868993]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Candles</span>
              </button>
            </div>
          </div>

          <InteractiveChart
            symbol={symbol}
            points={series.points}
            prevClose={series.prevClose}
            periodChangePct={series.periodChangePct}
            timeframe={timeframe}
            chartType={chartType}
            height={300}
          />

          {/* Key Stats & Technical Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#E0E3EB] dark:border-[#2A2E39]">
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Prev close</div>
                <div className="text-sm font-semibold font-mono-num mt-0.5">
                  {symbol.prevClose.toLocaleString('en-US', {
                    minimumFractionDigits: symbol.decimals,
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Day range</div>
                <div className="text-sm font-semibold font-mono-num mt-0.5">
                  {symbol.low24h.toFixed(symbol.decimals)} – {symbol.high24h.toFixed(symbol.decimals)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Volume</div>
                <div className="text-sm font-semibold font-mono-num mt-0.5">{symbol.volume}</div>
              </div>
              <div>
                <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Market cap</div>
                <div className="text-sm font-semibold font-mono-num mt-0.5">
                  {symbol.marketCap ?? 'Index / Rate'}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-3.5 bg-[#F8F9FD] dark:bg-[#1E222D] border border-[#E0E3EB] dark:border-[#2A2E39]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#6A6D78] dark:text-[#868993]">Technicals summary</span>
                <span
                  className={`font-semibold ${
                    symbol.rating.includes('Buy')
                      ? 'text-[#089981]'
                      : symbol.rating.includes('Sell')
                      ? 'text-[#F23645]'
                      : 'text-[#6A6D78] dark:text-[#D1D4DC]'
                  }`}
                >
                  {symbol.rating}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-[#F23645] via-[#868993] to-[#089981]">
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#131722] shadow-sm"
                  style={{ left: `${gaugePos}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6A6D78] dark:text-[#868993] mt-1.5">
                <span>Strong sell</span>
                <span>Neutral</span>
                <span>Strong buy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
