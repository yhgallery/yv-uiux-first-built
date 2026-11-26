import React, { useState } from 'react';
import { HEATMAP_TILES, HeatmapTile } from '../data/marketsData';

interface StockHeatmapProps {
  onSelectSymbol: (symbolCode: string) => void;
}

function getTileColors(change: number): { bg: string; hover: string } {
  if (change >= 3) return { bg: '#056656', hover: '#045245' };
  if (change >= 1.2) return { bg: '#089981', hover: '#067d69' };
  if (change > 0) return { bg: '#34A88F', hover: '#29937c' };
  if (change === 0) return { bg: '#787B86', hover: '#666973' };
  if (change > -1.5) return { bg: '#E05A66', hover: '#d04854' };
  if (change > -3) return { bg: '#F23645', hover: '#d92938' };
  return { bg: '#B22833', hover: '#961e28' };
}

const SECTORS_ORDER = [
  'Technology',
  'Communication',
  'Consumer Cyclical',
  'Financial',
  'Healthcare',
  'Energy',
];

export const StockHeatmap: React.FC<StockHeatmapProps> = ({ onSelectSymbol }) => {
  const [hoveredTile, setHoveredTile] = useState<HeatmapTile | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string>('All');

  const visibleSectors =
    sectorFilter === 'All'
      ? SECTORS_ORDER
      : SECTORS_ORDER.filter((s) => s === sectorFilter);

  return (
    <div className="space-y-3">
      {/* Filter strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSectorFilter('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sectorFilter === 'All'
                ? 'bg-[#131722] text-white dark:bg-[#2962FF]'
                : 'bg-[#F0F3FA] text-[#6A6D78] hover:text-[#131722] dark:bg-[#1E222D] dark:text-[#868993] dark:hover:text-[#D1D4DC]'
            }`}
          >
            All sectors
          </button>
          {SECTORS_ORDER.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSectorFilter(sec)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sectorFilter === sec
                  ? 'bg-[#131722] text-white dark:bg-[#2962FF]'
                  : 'bg-[#F0F3FA] text-[#6A6D78] hover:text-[#131722] dark:bg-[#1E222D] dark:text-[#868993] dark:hover:text-[#D1D4DC]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Live hover readout */}
        <div className="text-xs font-mono-num text-[#6A6D78] dark:text-[#868993] min-h-[20px]">
          {hoveredTile ? (
            <span className="text-[#131722] dark:text-[#D1D4DC]">
              <strong>{hoveredTile.symbol}</strong> ({hoveredTile.name}) · ${hoveredTile.price.toFixed(2)} ·{' '}
              <span className={hoveredTile.changePercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                {hoveredTile.changePercent >= 0 ? '+' : ''}
                {hoveredTile.changePercent.toFixed(2)}%
              </span>{' '}
              · MCap {hoveredTile.marketCapLabel}
            </span>
          ) : (
            <span>Click any tile to inspect chart</span>
          )}
        </div>
      </div>

      {/* Treemap sector grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-2 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8F9FD] dark:bg-[#1E222D]">
        {visibleSectors.map((sector) => {
          const tiles = HEATMAP_TILES.filter((t) => t.sector === sector);
          return (
            <div
              key={sector}
              className="flex flex-col rounded-lg overflow-hidden border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722]"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-[#131722] dark:text-[#D1D4DC] bg-[#F0F3FA] dark:bg-[#1E222D] border-b border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between">
                <span>{sector}</span>
                <span className="text-[#6A6D78] dark:text-[#868993] font-normal">{tiles.length} leaders</span>
              </div>
              <div className="grid grid-cols-6 auto-rows-[56px] gap-0.5 p-0.5 bg-white dark:bg-[#131722]">
                {tiles.map((tile) => {
                  const colSpan =
                    tile.marketCapWeight >= 14
                      ? 'col-span-3 row-span-2'
                      : tile.marketCapWeight >= 8
                      ? 'col-span-3 row-span-1'
                      : tile.marketCapWeight >= 5
                      ? 'col-span-2 row-span-1'
                      : 'col-span-2 row-span-1';
                  const colors = getTileColors(tile.changePercent);
                  return (
                    <button
                      key={tile.symbol}
                      type="button"
                      onClick={() => onSelectSymbol(tile.symbol)}
                      onMouseEnter={() => setHoveredTile(tile)}
                      onMouseLeave={() => setHoveredTile(null)}
                      style={{ backgroundColor: colors.bg }}
                      className={`${colSpan} p-1.5 flex flex-col items-center justify-center text-white rounded-[3px] transition-opacity hover:opacity-90 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2962FF]`}
                    >
                      <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight">
                        {tile.symbol}
                      </span>
                      <span className="text-[11px] font-mono-num leading-tight opacity-95">
                        {tile.changePercent >= 0 ? '+' : ''}
                        {tile.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scale legend */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] font-mono-num text-[#6A6D78] dark:text-[#868993]">
        <span>-3%</span>
        <span className="w-5 h-2.5 rounded-xs bg-[#B22833]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#F23645]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#E05A66]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#787B86]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#34A88F]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#089981]" />
        <span className="w-5 h-2.5 rounded-xs bg-[#056656]" />
        <span>+3%</span>
      </div>
    </div>
  );
};
