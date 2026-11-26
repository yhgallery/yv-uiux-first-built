import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  ChevronRight,
  LineChart,
  Moon,
  Search,
  Star,
  Sun,
  X,
} from 'lucide-react';
import {
  ALL_SYMBOLS,
  COMMUNITY_IDEAS,
  CommunityIdea,
  EARNINGS_CALENDAR,
  ECONOMIC_CALENDAR,
  generateSeries,
  MARKET_CATEGORIES,
  MarketCategory,
  MarketSymbol,
  NewsStory,
  TIMEFRAMES,
  TimeframeKey,
  TOP_STORIES,
  US_SECTORS,
} from './data/marketsData';
import { InteractiveChart } from './components/InteractiveChart';
import { Sparkline } from './components/Sparkline';
import { StockHeatmap } from './components/StockHeatmap';
import { YieldCurveChart } from './components/YieldCurveChart';
import { SymbolInspectorModal } from './components/SymbolInspectorModal';
import { ReaderModal } from './components/IdeaModal';
import { IdeaPreviewSvg } from './components/IdeaPreviewSvg';

function formatPrice(val: number, decimals: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function ChangeBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono-num font-medium ${
        isUp ? 'text-[#089981]' : 'text-[#F23645]'
      }`}
    >
      {isUp ? (
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isUp ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    </span>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [summaryCategory, setSummaryCategory] = useState<MarketCategory>('Indices');
  const [selectedSymbolCode, setSelectedSymbolCode] = useState<string>('SPX');
  const [summaryTimeframe, setSummaryTimeframe] = useState<TimeframeKey>('1D');
  const [summaryChartType, setSummaryChartType] = useState<'area' | 'candles'>('area');

  const [ideaFilter, setIdeaFilter] = useState<'All' | 'Indices' | 'Stocks' | 'Crypto' | 'Forex'>('All');
  const [stockListMode, setStockListMode] = useState<'movers' | 'active' | 'watchlist'>('movers');
  const [calendarTab, setCalendarTab] = useState<'economic' | 'earnings'>('economic');
  const [impactFilter, setImpactFilter] = useState<'All' | 'High'>('All');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [watchlist, setWatchlist] = useState<string[]>(['SPX', 'NVDA', 'AAPL', 'BTCUSD', 'GC1!']);
  const [modalSymbol, setModalSymbol] = useState<MarketSymbol | null>(null);
  const [activeIdea, setActiveIdea] = useState<CommunityIdea | null>(null);
  const [activeStory, setActiveStory] = useState<NewsStory | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const categorySymbols = useMemo(
    () => ALL_SYMBOLS.filter((s) => s.category === summaryCategory).slice(0, 6),
    [summaryCategory]
  );

  // When switching Market Summary category, auto-select its first benchmark
  const handleSelectCategory = (cat: MarketCategory) => {
    setSummaryCategory(cat);
    const first = ALL_SYMBOLS.find((s) => s.category === cat);
    if (first) setSelectedSymbolCode(first.symbol);
  };

  const activeSummarySymbol = useMemo(() => {
    return (
      ALL_SYMBOLS.find((s) => s.symbol === selectedSymbolCode) ||
      categorySymbols[0] ||
      ALL_SYMBOLS[0]
    );
  }, [selectedSymbolCode, categorySymbols]);

  const summarySeries = useMemo(
    () => generateSeries(activeSummarySymbol, summaryTimeframe),
    [activeSummarySymbol, summaryTimeframe]
  );

  const openSymbolInspector = (code: string) => {
    const found = ALL_SYMBOLS.find((s) => s.symbol === code);
    if (found) {
      setModalSymbol(found);
      return;
    }
    // Fallback for heatmap-only tickers not in ALL_SYMBOLS
    setModalSymbol({
      symbol: code,
      name: code,
      exchange: 'NASDAQ',
      category: 'Stocks',
      price: 245.5,
      change: 2.1,
      changePercent: 0.86,
      unit: 'USD',
      decimals: 2,
      badgeText: code.slice(0, 2),
      badgeColor: '#2962FF',
      volume: '18.4M',
      marketCap: '420B',
      high24h: 248.1,
      low24h: 241.8,
      prevClose: 243.4,
      rating: 'Buy',
      seed: code.charCodeAt(0) * 13,
      sparkline: [240, 241, 242, 243, 243.4, 244, 245, 245.5],
    });
  };

  const toggleWatchlist = (code: string) => {
    setWatchlist((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ALL_SYMBOLS.slice(0, 7);
    return ALL_SYMBOLS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const stocksList = useMemo(() => ALL_SYMBOLS.filter((s) => s.category === 'Stocks'), []);
  const stockGainers = useMemo(
    () => [...stocksList].filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent),
    [stocksList]
  );
  const stockLosers = useMemo(
    () => [...stocksList].filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent),
    [stocksList]
  );
  const mostActiveStocks = useMemo(() => stocksList.slice(0, 6), [stocksList]);
  const watchlistedSymbols = useMemo(
    () => ALL_SYMBOLS.filter((s) => watchlist.includes(s.symbol)),
    [watchlist]
  );

  const cryptoList = useMemo(() => ALL_SYMBOLS.filter((s) => s.category === 'Crypto'), []);
  const futuresList = useMemo(() => ALL_SYMBOLS.filter((s) => s.category === 'Futures'), []);
  const forexList = useMemo(() => ALL_SYMBOLS.filter((s) => s.category === 'Forex'), []);
  const bondsList = useMemo(() => ALL_SYMBOLS.filter((s) => s.category === 'Bonds'), []);

  const filteredIdeas = useMemo(
    () =>
      ideaFilter === 'All'
        ? COMMUNITY_IDEAS
        : COMMUNITY_IDEAS.filter((idea) => idea.category === ideaFilter),
    [ideaFilter]
  );

  const filteredEconomic = useMemo(
    () =>
      impactFilter === 'All'
        ? ECONOMIC_CALENDAR
        : ECONOMIC_CALENDAR.filter((e) => e.impact === 'High'),
    [impactFilter]
  );

  const renderSymbolRow = (item: MarketSymbol, showSparkline = true) => {
    const isWatched = watchlist.includes(item.symbol);
    return (
      <tr
        key={item.symbol}
        onClick={() => openSymbolInspector(item.symbol)}
        className="border-b border-[#E0E3EB] dark:border-[#2A2E39] last:border-b-0 hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D] transition-colors cursor-pointer group"
      >
        <td className="py-2.5 pl-3 pr-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{ backgroundColor: item.badgeColor }}
            >
              {item.badgeText}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#131722] dark:text-[#D1D4DC] group-hover:text-[#2962FF] transition-colors truncate">
                {item.symbol}
              </div>
              <div className="text-xs text-[#6A6D78] dark:text-[#868993] truncate max-w-[160px]">
                {item.name}
              </div>
            </div>
          </div>
        </td>
        {showSparkline && (
          <td className="py-2.5 px-2 hidden sm:table-cell">
            <Sparkline data={item.sparkline} isPositive={item.changePercent >= 0} />
          </td>
        )}
        <td className="py-2.5 px-2 text-right font-mono-num text-sm font-medium text-[#131722] dark:text-[#D1D4DC] whitespace-nowrap">
          {formatPrice(item.price, item.decimals)}
          {item.unit === '%' ? '%' : ''}
        </td>
        <td className="py-2.5 px-2 text-right text-sm whitespace-nowrap">
          <ChangeBadge value={item.changePercent} />
        </td>
        <td className="py-2.5 pl-1 pr-3 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(item.symbol);
            }}
            className="p-1.5 rounded-md text-[#868993] hover:text-[#2962FF] hover:bg-[#2962FF]/10 transition-colors cursor-pointer"
            aria-label={isWatched ? `Remove ${item.symbol} from watchlist` : `Add ${item.symbol} to watchlist`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-[#2962FF] text-[#2962FF]' : ''}`} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#131722] text-[#131722] dark:text-[#D1D4DC] transition-colors">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#131722]/95 backdrop-blur-sm border-b border-[#E0E3EB] dark:border-[#2A2E39]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#market-summary"
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#131722] dark:text-white whitespace-nowrap shrink-0"
          >
            <svg width="28" height="20" viewBox="0 0 36 24" fill="none" aria-hidden="true">
              <path d="M2 5H14V19H8V10H2V5Z" fill="currentColor" />
              <circle cx="19" cy="7.5" r="2.8" fill="#2962FF" />
              <path d="M23.5 19L29.2 5H35L29.3 19H23.5Z" fill="currentColor" />
            </svg>
            <span className="font-display">TradingView</span>
          </a>

          {/* Zone 2: 5 Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#131722] dark:text-[#D1D4DC]">
            <a
              href="#market-summary"
              className="hover:text-[#2962FF] transition-colors whitespace-nowrap shrink-0"
            >
              Markets
            </a>
            <a
              href="#us-stocks"
              className="hover:text-[#2962FF] transition-colors whitespace-nowrap shrink-0"
            >
              Stocks
            </a>
            <a
              href="#crypto"
              className="hover:text-[#2962FF] transition-colors whitespace-nowrap shrink-0"
            >
              Crypto
            </a>
            <a
              href="#futures"
              className="hover:text-[#2962FF] transition-colors whitespace-nowrap shrink-0"
            >
              Futures
            </a>
            <a
              href="#calendars"
              className="hover:text-[#2962FF] transition-colors whitespace-nowrap shrink-0"
            >
              Calendars
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => openSymbolInspector(activeSummarySymbol.symbol)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2962FF] hover:bg-[#1E53E5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch chart
            </button>
          </div>
        </div>
      </header>

      {/* Markets Sub-Toolbar: Search + Quick Section Jumps + Theme Toggle */}
      <div className="border-b border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8F9FD] dark:bg-[#1E222D]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-[#6A6D78] dark:text-[#868993] whitespace-nowrap shrink-0">
              Markets Overview
            </span>
            <span className="text-[#E0E3EB] dark:text-[#2A2E39]" aria-hidden="true">/</span>
            <div className="flex items-center gap-4 text-xs font-medium text-[#6A6D78] dark:text-[#868993]">
              <a href="#community-ideas" className="hover:text-[#131722] dark:hover:text-white whitespace-nowrap shrink-0">
                Ideas
              </a>
              <a href="#heatmap" className="hover:text-[#131722] dark:hover:text-white whitespace-nowrap shrink-0">
                Heatmap
              </a>
              <a href="#forex-bonds" className="hover:text-[#131722] dark:hover:text-white whitespace-nowrap shrink-0">
                Yield curves
              </a>
              <a href="#top-stories" className="hover:text-[#131722] dark:hover:text-white whitespace-nowrap shrink-0">
                News flow
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Live Symbol Search */}
            <div ref={searchRef} className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-[#6A6D78] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search symbol or market..."
                className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg bg-white dark:bg-[#131722] border border-[#E0E3EB] dark:border-[#2A2E39] text-[#131722] dark:text-[#D1D4DC] placeholder:text-[#868993] focus:outline-none focus:border-[#2962FF]"
                aria-label="Search market symbols"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6A6D78] hover:text-[#131722] dark:hover:text-white cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {searchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-white dark:bg-[#1E222D] border border-[#E0E3EB] dark:border-[#2A2E39] shadow-xl z-50 overflow-hidden">
                  <div className="px-3 py-1.5 text-[11px] font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                    {searchQuery ? 'Matching symbols' : 'Popular markets'}
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-[#6A6D78] dark:text-[#868993] text-center">
                      No markets matched &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-[#E0E3EB] dark:divide-[#2A2E39]">
                      {searchResults.map((sym) => (
                        <li key={sym.symbol}>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              openSymbolInspector(sym.symbol);
                            }}
                            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-[#F0F3FA] dark:hover:bg-[#2A2E39] cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                                style={{ backgroundColor: sym.badgeColor }}
                              >
                                {sym.badgeText}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#131722] dark:text-white truncate">
                                  {sym.symbol}
                                </div>
                                <div className="text-[11px] text-[#6A6D78] dark:text-[#868993] truncate">
                                  {sym.name} · {sym.exchange}
                                </div>
                              </div>
                            </div>
                            <div className="text-right font-mono-num text-xs shrink-0">
                              <div className="font-semibold text-[#131722] dark:text-white">
                                {formatPrice(sym.price, sym.decimals)}
                              </div>
                              <div className={sym.changePercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}>
                                {sym.changePercent >= 0 ? '+' : ''}
                                {sym.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-lg bg-white dark:bg-[#131722] border border-[#E0E3EB] dark:border-[#2A2E39] text-[#6A6D78] dark:text-[#D1D4DC] hover:text-[#131722] dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light theme' : 'Dark theme'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-14">
        {/* SECTION 1: MARKET SUMMARY */}
        <section id="market-summary" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131722] dark:text-white flex items-center gap-1.5">
                <span>Market summary</span>
                <ChevronRight className="w-6 h-6 text-[#6A6D78]" aria-hidden="true" />
              </h1>
              <p className="text-sm text-[#6A6D78] dark:text-[#868993] mt-1">
                Global benchmarks across equities, crypto, futures, currencies, and sovereign debt.
              </p>
            </div>

            <div className="text-xs text-[#6A6D78] dark:text-[#868993] font-mono-num">
              Watchlist: <strong className="text-[#131722] dark:text-white">{watchlist.length}</strong> symbols
            </div>
          </div>

          {/* Asset Class Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-[#E0E3EB] dark:border-[#2A2E39]">
            {MARKET_CATEGORIES.map((cat) => {
              const active = summaryCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 -mb-[1px] ${
                    active
                      ? 'border-[#2962FF] text-[#2962FF]'
                      : 'border-transparent text-[#6A6D78] dark:text-[#868993] hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Benchmark Selector Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {categorySymbols.map((sym) => {
              const isSelected = sym.symbol === activeSummarySymbol.symbol;
              const isUp = sym.changePercent >= 0;
              return (
                <button
                  key={sym.symbol}
                  type="button"
                  onClick={() => setSelectedSymbolCode(sym.symbol)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F0F3FA] dark:bg-[#1E222D] border-[#2962FF] ring-1 ring-[#2962FF]/20'
                      : 'bg-white dark:bg-[#131722] border-[#E0E3EB] dark:border-[#2A2E39] hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: sym.badgeColor }}
                      >
                        {sym.badgeText}
                      </span>
                      <span className="text-xs font-semibold text-[#131722] dark:text-white truncate">
                        {sym.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between gap-1 font-mono-num">
                    <span className="text-sm font-bold text-[#131722] dark:text-white">
                      {formatPrice(sym.price, sym.decimals)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isUp ? 'text-[#089981]' : 'text-[#F23645]'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {sym.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary Interactive Market Summary Chart Card */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: activeSummarySymbol.badgeColor }}
                >
                  {activeSummarySymbol.badgeText}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#131722] dark:text-white">
                      {activeSummarySymbol.name}
                    </h2>
                    <span className="text-xs font-mono-num text-[#6A6D78] dark:text-[#868993]">
                      {activeSummarySymbol.exchange}:{activeSummarySymbol.symbol}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2.5 font-mono-num">
                    <span className="text-xl font-bold text-[#131722] dark:text-white">
                      {formatPrice(activeSummarySymbol.price, activeSummarySymbol.decimals)}
                      {activeSummarySymbol.unit ? ` ${activeSummarySymbol.unit}` : ''}
                    </span>
                    <ChangeBadge value={summarySeries.periodChangePct} />
                    <span className="text-xs text-[#6A6D78] dark:text-[#868993]">
                      ({summaryTimeframe})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[#F0F3FA] dark:bg-[#1E222D] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSummaryChartType('area')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                      summaryChartType === 'area'
                        ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                        : 'text-[#6A6D78] dark:text-[#868993]'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Area</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryChartType('candles')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                      summaryChartType === 'candles'
                        ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                        : 'text-[#6A6D78] dark:text-[#868993]'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Candles</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openSymbolInspector(activeSummarySymbol.symbol)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E0E3EB] dark:border-[#2A2E39] text-[#131722] dark:text-[#D1D4DC] hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  See full chart
                </button>
              </div>
            </div>

            <InteractiveChart
              symbol={activeSummarySymbol}
              points={summarySeries.points}
              prevClose={summarySeries.prevClose}
              periodChangePct={summarySeries.periodChangePct}
              timeframe={summaryTimeframe}
              chartType={summaryChartType}
              height={310}
            />

            {/* Timeframe Selector Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-[#E0E3EB] dark:border-[#2A2E39]">
              <div className="flex flex-wrap items-center gap-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setSummaryTimeframe(tf)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      summaryTimeframe === tf
                        ? 'bg-[#131722] text-white dark:bg-[#2962FF]'
                        : 'text-[#6A6D78] dark:text-[#868993] hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D] hover:text-[#131722] dark:hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[#6A6D78] dark:text-[#868993] font-mono-num">
                Day range: {formatPrice(activeSummarySymbol.low24h, activeSummarySymbol.decimals)} –{' '}
                {formatPrice(activeSummarySymbol.high24h, activeSummarySymbol.decimals)}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: COMMUNITY IDEAS */}
        <section id="community-ideas" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Community ideas</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#F0F3FA] dark:bg-[#1E222D] rounded-lg">
              {(['All', 'Indices', 'Stocks', 'Crypto', 'Forex'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIdeaFilter(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    ideaFilter === cat
                      ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                      : 'text-[#6A6D78] dark:text-[#868993] hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredIdeas.map((idea) => (
              <article
                key={idea.id}
                onClick={() => setActiveIdea(idea)}
                className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden hover:border-[#2962FF] transition-colors cursor-pointer flex flex-col"
              >
                <IdeaPreviewSvg pattern={idea.chartPattern} direction={idea.direction} />
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono-num text-[#6A6D78] dark:text-[#868993]">
                      <span className="font-semibold text-[#131722] dark:text-[#D1D4DC]">{idea.symbol}</span>
                      {' · '}
                      <span>{idea.timeframe}</span>
                      {' · '}
                      <span className={idea.direction === 'Long' ? 'text-[#089981]' : 'text-[#F23645]'}>
                        {idea.direction}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white leading-snug line-clamp-2">
                      {idea.title}
                    </h3>
                    <p className="text-xs text-[#6A6D78] dark:text-[#868993] line-clamp-2 leading-relaxed">
                      {idea.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between text-[11px] text-[#6A6D78] dark:text-[#868993]">
                    <span>
                      {idea.author} · {idea.publishedAt}
                    </span>
                    <span className="font-mono-num">
                      {idea.likes} boosts · {idea.comments}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* SECTION 3: US STOCKS + HEATMAP + SECTORS */}
        <section id="us-stocks" className="scroll-mt-24 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>US stocks</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#F0F3FA] dark:bg-[#1E222D] rounded-lg">
              <button
                type="button"
                onClick={() => setStockListMode('movers')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  stockListMode === 'movers'
                    ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                    : 'text-[#6A6D78] dark:text-[#868993]'
                }`}
              >
                Gainers &amp; Losers
              </button>
              <button
                type="button"
                onClick={() => setStockListMode('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  stockListMode === 'active'
                    ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                    : 'text-[#6A6D78] dark:text-[#868993]'
                }`}
              >
                Most Active
              </button>
              <button
                type="button"
                onClick={() => setStockListMode('watchlist')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  stockListMode === 'watchlist'
                    ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                    : 'text-[#6A6D78] dark:text-[#868993]'
                }`}
              >
                My Watchlist ({watchlist.length})
              </button>
            </div>
          </div>

          {stockListMode === 'movers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Stock gainers</h3>
                  <span className="text-xs text-[#6A6D78] dark:text-[#868993]">NYSE / NASDAQ</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody>{stockGainers.slice(0, 6).map((item) => renderSymbolRow(item))}</tbody>
                </table>
              </div>

              {/* Top Losers */}
              <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Stock losers</h3>
                  <span className="text-xs text-[#6A6D78] dark:text-[#868993]">NYSE / NASDAQ</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody>{stockLosers.slice(0, 6).map((item) => renderSymbolRow(item))}</tbody>
                </table>
              </div>
            </div>
          )}

          {stockListMode === 'active' && (
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Most active US stocks</h3>
                <span className="text-xs text-[#6A6D78] dark:text-[#868993]">Sorted by share volume</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                      <th className="py-2 pl-3 pr-2">Ticker</th>
                      <th className="py-2 px-2 hidden sm:table-cell">Trend</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Change %</th>
                      <th className="py-2 pl-1 pr-3 text-right">Watch</th>
                    </tr>
                  </thead>
                  <tbody>{mostActiveStocks.map((item) => renderSymbolRow(item))}</tbody>
                </table>
              </div>
            </div>
          )}

          {stockListMode === 'watchlist' && (
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E0E3EB] dark:border-[#2A2E39] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Your Watchlist</h3>
                <span className="text-xs text-[#6A6D78] dark:text-[#868993]">Click star icon on any row to customize</span>
              </div>
              {watchlistedSymbols.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#6A6D78] dark:text-[#868993]">
                  Your watchlist is empty. Star any ticker across the tables to pin it here.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>{watchlistedSymbols.map((item) => renderSymbolRow(item))}</tbody>
                </table>
              )}
            </div>
          )}

          {/* Stock Market Heatmap */}
          <div id="heatmap" className="scroll-mt-24 space-y-3 pt-2">
            <h3 className="text-lg font-bold text-[#131722] dark:text-white flex items-center gap-1">
              <span>Stock market heatmap</span>
              <ChevronRight className="w-4 h-4 text-[#6A6D78]" aria-hidden="true" />
            </h3>
            <StockHeatmap onSelectSymbol={openSymbolInspector} />
          </div>

          {/* US Sector Performance Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-bold text-[#131722] dark:text-white">
              US stock sectors performance
            </h3>
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="text-xs font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                    <th className="py-2.5 px-4">Sector</th>
                    <th className="py-2.5 px-3 text-right">Stocks</th>
                    <th className="py-2.5 px-3 text-right">Market Cap</th>
                    <th className="py-2.5 px-3 text-right">1D %</th>
                    <th className="py-2.5 px-3 text-right">1W %</th>
                    <th className="py-2.5 px-3 text-right">1M %</th>
                    <th className="py-2.5 px-4 text-right">P/E</th>
                  </tr>
                </thead>
                <tbody>
                  {US_SECTORS.map((sec) => (
                    <tr
                      key={sec.name}
                      className="border-b border-[#E0E3EB] dark:border-[#2A2E39] last:border-b-0 hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D] transition-colors text-sm"
                    >
                      <td className="py-2.5 px-4 font-semibold text-[#131722] dark:text-[#D1D4DC]">
                        {sec.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-[#6A6D78] dark:text-[#868993]">
                        {sec.stocksCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num">{sec.marketCap}</td>
                      <td className="py-2.5 px-3 text-right">
                        <ChangeBadge value={sec.change1D} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <ChangeBadge value={sec.change1W} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <ChangeBadge value={sec.change1M} />
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-num text-[#6A6D78] dark:text-[#868993]">
                        {sec.peRatio}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: CRYPTO */}
        <section id="crypto" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Crypto</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <span className="text-xs text-[#6A6D78] dark:text-[#868993]">24/7 global spot markets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8F9FD] dark:bg-[#1E222D]">
              <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Total crypto market cap</div>
              <div className="flex items-baseline gap-2.5 mt-1 font-mono-num">
                <span className="text-xl font-bold text-[#131722] dark:text-white">$3.24T</span>
                <ChangeBadge value={2.81} />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8F9FD] dark:bg-[#1E222D]">
              <div className="text-xs text-[#6A6D78] dark:text-[#868993]">Bitcoin dominance (BTC.D)</div>
              <div className="flex items-baseline gap-2.5 mt-1 font-mono-num">
                <span className="text-xl font-bold text-[#131722] dark:text-white">58.02%</span>
                <ChangeBadge value={-0.14} />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-[#F8F9FD] dark:bg-[#1E222D]">
              <div className="text-xs text-[#6A6D78] dark:text-[#868993]">24h global spot volume</div>
              <div className="flex items-baseline gap-2.5 mt-1 font-mono-num">
                <span className="text-xl font-bold text-[#131722] dark:text-white">$168.4B</span>
                <ChangeBadge value={14.2} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-xs font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                  <th className="py-2.5 pl-3 pr-2">Coin</th>
                  <th className="py-2.5 px-2 hidden sm:table-cell">7D Trend</th>
                  <th className="py-2.5 px-2 text-right">Price (USD)</th>
                  <th className="py-2.5 px-2 text-right">24h %</th>
                  <th className="py-2.5 pl-1 pr-3 text-right">Watch</th>
                </tr>
              </thead>
              <tbody>{cryptoList.map((item) => renderSymbolRow(item))}</tbody>
            </table>
          </div>
        </section>

        {/* SECTION 5: FUTURES & COMMODITIES */}
        <section id="futures" className="scroll-mt-24 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Futures &amp; commodities</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <span className="text-xs text-[#6A6D78] dark:text-[#868993]">Energy · Metals · Index Futures</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {futuresList.map((fut) => (
              <button
                key={fut.symbol}
                type="button"
                onClick={() => openSymbolInspector(fut.symbol)}
                className="p-4 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] hover:border-[#2962FF] transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: fut.badgeColor }}
                  >
                    {fut.badgeText}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#131722] dark:text-white truncate">
                      {fut.name}
                    </div>
                    <div className="text-xs font-mono-num text-[#6A6D78] dark:text-[#868993]">
                      {fut.exchange}:{fut.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono-num shrink-0">
                  <div className="text-sm font-bold text-[#131722] dark:text-white">
                    {formatPrice(fut.price, fut.decimals)}
                  </div>
                  <div className="text-xs">
                    <ChangeBadge value={fut.changePercent} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 6: FOREX & BONDS / YIELD CURVES */}
        <section id="forex-bonds" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forex Pairs */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Currencies</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody>{forexList.map((item) => renderSymbolRow(item, true))}</tbody>
              </table>
            </div>
          </div>

          {/* US Yield Curve + Benchmark Sovereign Bonds */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Yield curves &amp; bonds</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <div className="p-4 rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722]">
              <div className="text-xs font-semibold text-[#131722] dark:text-white mb-2">
                US Treasury Yield Curve (%)
              </div>
              <YieldCurveChart />
            </div>
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody>{bondsList.slice(0, 4).map((item) => renderSymbolRow(item, false))}</tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 7: CALENDARS & TOP STORIES */}
        <section id="calendars" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Economic & Earnings Calendars */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#F0F3FA] dark:bg-[#1E222D] rounded-lg">
                <button
                  type="button"
                  onClick={() => setCalendarTab('economic')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    calendarTab === 'economic'
                      ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                      : 'text-[#6A6D78] dark:text-[#868993]'
                  }`}
                >
                  Economic calendar
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTab('earnings')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    calendarTab === 'earnings'
                      ? 'bg-white dark:bg-[#2A2E39] text-[#131722] dark:text-white shadow-xs'
                      : 'text-[#6A6D78] dark:text-[#868993]'
                  }`}
                >
                  Earnings calendar
                </button>
              </div>

              {calendarTab === 'economic' && (
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setImpactFilter('All')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      impactFilter === 'All'
                        ? 'bg-[#131722] text-white dark:bg-[#2962FF]'
                        : 'text-[#6A6D78] hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D]'
                    }`}
                  >
                    All impact
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpactFilter('High')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      impactFilter === 'High'
                        ? 'bg-[#131722] text-white dark:bg-[#2962FF]'
                        : 'text-[#6A6D78] hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D]'
                    }`}
                  >
                    High impact
                  </button>
                </div>
              )}
            </div>

            {calendarTab === 'economic' ? (
              <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="text-xs font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-2">Ccy</th>
                      <th className="py-2.5 px-2">Event</th>
                      <th className="py-2.5 px-2 text-right">Actual</th>
                      <th className="py-2.5 px-2 text-right">Forecast</th>
                      <th className="py-2.5 px-3 text-right">Prior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEconomic.map((ev) => (
                      <tr
                        key={ev.id}
                        className="border-b border-[#E0E3EB] dark:border-[#2A2E39] last:border-b-0 text-xs hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D]"
                      >
                        <td className="py-2.5 px-3 font-mono-num text-[#6A6D78] dark:text-[#868993]">
                          {ev.time}
                        </td>
                        <td className="py-2.5 px-2 font-semibold">{ev.currency}</td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-[#131722] dark:text-[#D1D4DC]">{ev.title}</div>
                          <div className="text-[11px] text-[#6A6D78] dark:text-[#868993]">
                            Impact: {ev.impact}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-semibold">{ev.actual}</td>
                        <td className="py-2.5 px-2 text-right font-mono-num text-[#6A6D78] dark:text-[#868993]">
                          {ev.forecast}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-[#6A6D78] dark:text-[#868993]">
                          {ev.prior}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px]">
                  <thead>
                    <tr className="text-xs font-medium text-[#6A6D78] dark:text-[#868993] border-b border-[#E0E3EB] dark:border-[#2A2E39]">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-2">Schedule</th>
                      <th className="py-2.5 px-2 text-right">Est. EPS</th>
                      <th className="py-2.5 px-2 text-right">Reported</th>
                      <th className="py-2.5 px-3 text-right">Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EARNINGS_CALENDAR.map((er) => (
                      <tr
                        key={er.symbol}
                        onClick={() => openSymbolInspector(er.symbol)}
                        className="border-b border-[#E0E3EB] dark:border-[#2A2E39] last:border-b-0 text-xs hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D] cursor-pointer"
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#131722] dark:text-white">{er.symbol}</div>
                          <div className="text-[11px] text-[#6A6D78] dark:text-[#868993]">{er.company}</div>
                        </td>
                        <td className="py-2.5 px-2 text-[#6A6D78] dark:text-[#868993]">
                          {er.date} · {er.timing}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num">${er.epsEstimate}</td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-semibold">
                          {er.epsReported === '—' ? '—' : `$${er.epsReported}`}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num">
                          {er.surprisePercent !== null ? (
                            <ChangeBadge value={er.surprisePercent} />
                          ) : (
                            <span className="text-[#6A6D78] dark:text-[#868993]">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Stories News Feed */}
          <div id="top-stories" className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white flex items-center gap-1">
              <span>Top stories</span>
              <ChevronRight className="w-5 h-5 text-[#6A6D78]" aria-hidden="true" />
            </h2>
            <div className="rounded-xl border border-[#E0E3EB] dark:border-[#2A2E39] bg-white dark:bg-[#131722] divide-y divide-[#E0E3EB] dark:divide-[#2A2E39]">
              {TOP_STORIES.map((story) => (
                <article
                  key={story.id}
                  onClick={() => setActiveStory(story)}
                  className="p-4 hover:bg-[#F8F9FD] dark:hover:bg-[#1E222D] transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="text-xs text-[#6A6D78] dark:text-[#868993]">
                    <span>{story.source}</span>
                    {' · '}
                    <span>{story.timeAgo}</span>
                    {' · '}
                    <span>{story.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white leading-snug">
                    {story.headline}
                  </h3>
                  <p className="text-xs text-[#6A6D78] dark:text-[#868993] line-clamp-2">
                    {story.excerpt}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#E0E3EB] dark:border-[#2A2E39] mt-12 bg-[#F8F9FD] dark:bg-[#1E222D]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#6A6D78] dark:text-[#868993]">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-[#131722] dark:text-white">
              TradingView Markets
            </span>
            <span aria-hidden="true">·</span>
            <span>Global market data &amp; interactive charts</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#market-summary" className="hover:text-[#131722] dark:hover:text-white">
              Indices
            </a>
            <a href="#us-stocks" className="hover:text-[#131722] dark:hover:text-white">
              Stocks
            </a>
            <a href="#crypto" className="hover:text-[#131722] dark:hover:text-white">
              Crypto
            </a>
            <a href="#futures" className="hover:text-[#131722] dark:hover:text-white">
              Futures
            </a>
            <a href="#forex-bonds" className="hover:text-[#131722] dark:hover:text-white">
              Forex &amp; Bonds
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <SymbolInspectorModal
        symbol={modalSymbol}
        onClose={() => setModalSymbol(null)}
        isWatched={modalSymbol ? watchlist.includes(modalSymbol.symbol) : false}
        onToggleWatch={toggleWatchlist}
      />
      <ReaderModal
        idea={activeIdea}
        story={activeStory}
        onClose={() => {
          setActiveIdea(null);
          setActiveStory(null);
        }}
        onOpenSymbol={openSymbolInspector}
      />
    </div>
  );
}
