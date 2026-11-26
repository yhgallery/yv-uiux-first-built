export type MarketCategory =
  | 'Indices'
  | 'Stocks'
  | 'Crypto'
  | 'Futures'
  | 'Forex'
  | 'Bonds'
  | 'ETFs';

export type TimeframeKey = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All';

export interface CandlePoint {
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  exchange: string;
  category: MarketCategory;
  price: number;
  change: number;
  changePercent: number;
  unit?: string;
  decimals: number;
  badgeText: string;
  badgeColor: string;
  volume: string;
  marketCap?: string;
  high24h: number;
  low24h: number;
  prevClose: number;
  rating: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  sector?: string;
  seed: number;
  sparkline: number[];
}

export interface CommunityIdea {
  id: string;
  title: string;
  symbol: string;
  timeframe: string;
  direction: 'Long' | 'Short' | 'Neutral';
  author: string;
  publishedAt: string;
  summary: string;
  fullAnalysis: string[];
  likes: number;
  comments: number;
  category: 'Indices' | 'Stocks' | 'Crypto' | 'Forex';
  chartPattern: 'breakout' | 'channel' | 'reversal' | 'wedge';
  targetPrice: string;
  stopLoss: string;
}

export interface HeatmapTile {
  symbol: string;
  name: string;
  sector: string;
  marketCapWeight: number; // proportional weight for treemap sizing
  marketCapLabel: string;
  price: number;
  changePercent: number;
}

export interface SectorPerf {
  name: string;
  stocksCount: number;
  marketCap: string;
  change1D: number;
  change1W: number;
  change1M: number;
  peRatio: string;
}

export interface NewsStory {
  id: string;
  headline: string;
  source: string;
  timeAgo: string;
  category: string;
  relatedSymbols: string[];
  excerpt: string;
  body: string[];
}

export interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  currency: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  prior: string;
}

export interface EarningsEvent {
  symbol: string;
  company: string;
  date: string;
  timing: 'After close' | 'Before open';
  epsEstimate: string;
  epsReported: string;
  surprisePercent: number | null;
  marketCap: string;
}

export interface YieldCurvePoint {
  maturity: string;
  current: number;
  oneMonthAgo: number;
  oneYearAgo: number;
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  'Indices',
  'Stocks',
  'Crypto',
  'Futures',
  'Forex',
  'Bonds',
  'ETFs',
];

export const TIMEFRAMES: TimeframeKey[] = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'All'];

// Deterministic pseudo-random generator for reproducible chart curves
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSeries(
  sym: MarketSymbol,
  timeframe: TimeframeKey
): { points: CandlePoint[]; prevClose: number; periodChangePct: number } {
  const countMap: Record<TimeframeKey, number> = {
    '1D': 48,
    '5D': 45,
    '1M': 30,
    '6M': 52,
    'YTD': 48,
    '1Y': 52,
    '5Y': 60,
    'All': 64,
  };

  const volatilityMap: Record<TimeframeKey, number> = {
    '1D': 0.0022,
    '5D': 0.0045,
    '1M': 0.009,
    '6M': 0.018,
    'YTD': 0.022,
    '1Y': 0.025,
    '5Y': 0.045,
    'All': 0.06,
  };

  const tfOffset: Record<TimeframeKey, number> = {
    '1D': 1,
    '5D': 17,
    '1M': 31,
    '6M': 53,
    'YTD': 79,
    '1Y': 103,
    '5Y': 137,
    'All': 173,
  };

  const count = countMap[timeframe];
  const vol = volatilityMap[timeframe];
  const rand = seededRandom(sym.seed * 37 + tfOffset[timeframe]);

  // Anchor the final close to sym.price and work backward
  const targetChangePct =
    timeframe === '1D'
      ? sym.changePercent
      : sym.changePercent * (timeframe === '5D' ? 1.8 : timeframe === '1M' ? 3.2 : timeframe === '6M' ? 6.4 : timeframe === 'YTD' ? 7.8 : timeframe === '1Y' ? 9.5 : timeframe === '5Y' ? 24 : 42);

  const startPrice = sym.price / (1 + targetChangePct / 100);
  const rawCloses: number[] = [];
  let cursor = startPrice;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const drift = (sym.price - startPrice) / count;
    const wave = Math.sin(t * Math.PI * 3.2 + sym.seed) * sym.price * vol * 0.45;
    const noise = (rand() - 0.49) * sym.price * vol;
    cursor = Math.max(sym.price * 0.2, cursor + drift + noise * 0.65 + wave * 0.08);
    rawCloses.push(cursor);
  }

  // Smoothly pin end to exact sym.price
  const endDiff = sym.price - rawCloses[rawCloses.length - 1];
  const points: CandlePoint[] = rawCloses.map((c, idx) => {
    const blend = idx / (count - 1);
    const close = idx === count - 1 ? sym.price : c + endDiff * blend;
    const prev = idx === 0 ? startPrice : rawCloses[idx - 1] + endDiff * ((idx - 1) / (count - 1));
    const spread = Math.abs(close - prev) + sym.price * vol * (0.35 + rand() * 0.45);
    const high = Math.max(prev, close) + spread * 0.45;
    const low = Math.min(prev, close) - spread * 0.45;

    let label = '';
    if (timeframe === '1D') {
      const totalMins = 9 * 60 + 30 + Math.round((idx / (count - 1)) * 390);
      const hh = Math.floor(totalMins / 60);
      const mm = totalMins % 60;
      label = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    } else if (timeframe === '5D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const d = days[Math.min(4, Math.floor((idx / count) * 5))];
      const hr = 10 + (idx % 9);
      label = `${d} ${hr}:00`;
    } else if (timeframe === '1M') {
      label = `Nov ${Math.max(1, idx + 1)}`;
    } else if (timeframe === '6M' || timeframe === 'YTD' || timeframe === '1Y') {
      const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
      label = months[Math.min(months.length - 1, Math.floor((idx / count) * months.length))];
    } else {
      const yr = timeframe === '5Y' ? 2022 + Math.floor((idx / count) * 5) : 2016 + Math.floor((idx / count) * 11);
      label = `${yr}`;
    }

    return {
      label,
      open: Number(prev.toFixed(sym.decimals)),
      high: Number(high.toFixed(sym.decimals)),
      low: Number(Math.max(0.0001, low).toFixed(sym.decimals)),
      close: Number(close.toFixed(sym.decimals)),
      volume: Math.round(100000 + rand() * 900000),
    };
  });

  const baseline = timeframe === '1D' ? sym.prevClose : points[0].open;
  const periodChangePct = ((sym.price - baseline) / baseline) * 100;

  return {
    points,
    prevClose: Number(baseline.toFixed(sym.decimals)),
    periodChangePct: Number(periodChangePct.toFixed(2)),
  };
}

export const ALL_SYMBOLS: MarketSymbol[] = [
  // INDICES
  {
    symbol: 'SPX',
    name: 'S&P 500',
    exchange: 'SP',
    category: 'Indices',
    price: 5987.37,
    change: 32.14,
    changePercent: 0.54,
    unit: 'USD',
    decimals: 2,
    badgeText: '500',
    badgeColor: '#F23645',
    volume: '2.84B',
    high24h: 5998.12,
    low24h: 5949.80,
    prevClose: 5955.23,
    rating: 'Strong Buy',
    seed: 101,
    sparkline: [5912, 5928, 5919, 5944, 5955, 5968, 5979, 5987],
  },
  {
    symbol: 'NDX',
    name: 'Nasdaq 100',
    exchange: 'NASDAQ',
    category: 'Indices',
    price: 20894.60,
    change: 164.82,
    changePercent: 0.79,
    unit: 'USD',
    decimals: 2,
    badgeText: '100',
    badgeColor: '#2962FF',
    volume: '1.42B',
    high24h: 20935.10,
    low24h: 20710.45,
    prevClose: 20729.78,
    rating: 'Strong Buy',
    seed: 102,
    sparkline: [20490, 20550, 20610, 20595, 20730, 20790, 20845, 20894],
  },
  {
    symbol: 'DJI',
    name: 'Dow 30',
    exchange: 'DJ',
    category: 'Indices',
    price: 44296.51,
    change: 118.24,
    changePercent: 0.27,
    unit: 'USD',
    decimals: 2,
    badgeText: '30',
    badgeColor: '#0066CC',
    volume: '482M',
    high24h: 44390.15,
    low24h: 44120.80,
    prevClose: 44178.27,
    rating: 'Buy',
    seed: 103,
    sparkline: [43920, 44010, 44080, 44045, 44178, 44210, 44260, 44296],
  },
  {
    symbol: 'NI225',
    name: 'Nikkei 225',
    exchange: 'TSE',
    category: 'Indices',
    price: 38780.14,
    change: -142.36,
    changePercent: -0.37,
    unit: 'JPY',
    decimals: 2,
    badgeText: '225',
    badgeColor: '#1E293B',
    volume: '1.15B',
    high24h: 39012.00,
    low24h: 38690.50,
    prevClose: 38922.50,
    rating: 'Neutral',
    seed: 104,
    sparkline: [39120, 39040, 38990, 38950, 38922, 38860, 38810, 38780],
  },
  {
    symbol: 'UKX',
    name: 'FTSE 100',
    exchange: 'FTSE',
    category: 'Indices',
    price: 8262.08,
    change: 28.94,
    changePercent: 0.35,
    unit: 'GBP',
    decimals: 2,
    badgeText: 'UK',
    badgeColor: '#0F4C81',
    volume: '790M',
    high24h: 8278.40,
    low24h: 8224.10,
    prevClose: 8233.14,
    rating: 'Buy',
    seed: 105,
    sparkline: [8180, 8195, 8210, 8220, 8233, 8245, 8254, 8262],
  },
  {
    symbol: 'DAX',
    name: 'DAX Index',
    exchange: 'XETR',
    category: 'Indices',
    price: 19425.73,
    change: 136.45,
    changePercent: 0.71,
    unit: 'EUR',
    decimals: 2,
    badgeText: 'DE',
    badgeColor: '#D97706',
    volume: '612M',
    high24h: 19468.20,
    low24h: 19280.10,
    prevClose: 19289.28,
    rating: 'Strong Buy',
    seed: 106,
    sparkline: [19110, 19180, 19220, 19250, 19289, 19340, 19395, 19425],
  },

  // STOCKS (US Equities)
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 146.67,
    change: 4.92,
    changePercent: 3.47,
    unit: 'USD',
    decimals: 2,
    badgeText: 'NV',
    badgeColor: '#76B900',
    volume: '268.4M',
    marketCap: '3.59T',
    high24h: 147.88,
    low24h: 141.90,
    prevClose: 141.75,
    rating: 'Strong Buy',
    sector: 'Technology',
    seed: 201,
    sparkline: [137.2, 139.0, 140.4, 141.1, 141.75, 143.8, 145.2, 146.67],
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 232.87,
    change: 2.15,
    changePercent: 0.93,
    unit: 'USD',
    decimals: 2,
    badgeText: 'AP',
    badgeColor: '#111827',
    volume: '44.2M',
    marketCap: '3.52T',
    high24h: 233.40,
    low24h: 229.85,
    prevClose: 230.72,
    rating: 'Buy',
    sector: 'Technology',
    seed: 202,
    sparkline: [227.4, 228.5, 229.2, 230.1, 230.72, 231.4, 232.1, 232.87],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 423.46,
    change: 3.84,
    changePercent: 0.92,
    unit: 'USD',
    decimals: 2,
    badgeText: 'MS',
    badgeColor: '#00A4EF',
    volume: '21.8M',
    marketCap: '3.15T',
    high24h: 425.10,
    low24h: 418.90,
    prevClose: 419.62,
    rating: 'Buy',
    sector: 'Technology',
    seed: 203,
    sparkline: [414.2, 415.8, 417.1, 418.4, 419.62, 421.0, 422.3, 423.46],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 342.03,
    change: -11.42,
    changePercent: -3.23,
    unit: 'USD',
    decimals: 2,
    badgeText: 'TS',
    badgeColor: '#E31937',
    volume: '98.6M',
    marketCap: '1.09T',
    high24h: 356.10,
    low24h: 339.40,
    prevClose: 353.45,
    rating: 'Neutral',
    sector: 'Consumer Cyclical',
    seed: 204,
    sparkline: [361.0, 358.2, 356.4, 354.1, 353.45, 349.0, 345.2, 342.03],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 207.86,
    change: 4.18,
    changePercent: 2.05,
    unit: 'USD',
    decimals: 2,
    badgeText: 'AZ',
    badgeColor: '#FF9900',
    volume: '39.4M',
    marketCap: '2.18T',
    high24h: 208.90,
    low24h: 203.10,
    prevClose: 203.68,
    rating: 'Strong Buy',
    sector: 'Consumer Cyclical',
    seed: 205,
    sparkline: [199.5, 200.8, 201.9, 202.8, 203.68, 205.2, 206.7, 207.86],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 572.44,
    change: 8.61,
    changePercent: 1.53,
    unit: 'USD',
    decimals: 2,
    badgeText: 'MT',
    badgeColor: '#0668E1',
    volume: '14.9M',
    marketCap: '1.44T',
    high24h: 575.20,
    low24h: 562.80,
    prevClose: 563.83,
    rating: 'Buy',
    sector: 'Communication',
    seed: 206,
    sparkline: [555.0, 558.4, 560.1, 562.0, 563.83, 567.2, 570.1, 572.44],
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 64.92,
    change: 3.87,
    changePercent: 6.34,
    unit: 'USD',
    decimals: 2,
    badgeText: 'PL',
    badgeColor: '#1E293B',
    volume: '82.1M',
    marketCap: '147.8B',
    high24h: 65.40,
    low24h: 60.85,
    prevClose: 61.05,
    rating: 'Strong Buy',
    sector: 'Technology',
    seed: 207,
    sparkline: [58.4, 59.1, 60.2, 60.8, 61.05, 62.6, 63.9, 64.92],
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 138.42,
    change: -3.28,
    changePercent: -2.31,
    unit: 'USD',
    decimals: 2,
    badgeText: 'AM',
    badgeColor: '#ED1C24',
    volume: '47.3M',
    marketCap: '224.6B',
    high24h: 142.30,
    low24h: 137.90,
    prevClose: 141.70,
    rating: 'Sell',
    sector: 'Technology',
    seed: 208,
    sparkline: [144.2, 143.1, 142.8, 142.0, 141.70, 140.4, 139.1, 138.42],
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    exchange: 'NYSE',
    category: 'Stocks',
    price: 786.15,
    change: -16.40,
    changePercent: -2.04,
    unit: 'USD',
    decimals: 2,
    badgeText: 'LY',
    badgeColor: '#D52B1E',
    volume: '4.1M',
    marketCap: '746.2B',
    high24h: 805.00,
    low24h: 782.40,
    prevClose: 802.55,
    rating: 'Neutral',
    sector: 'Healthcare',
    seed: 209,
    sparkline: [812.0, 809.5, 807.0, 804.1, 802.55, 796.2, 790.4, 786.15],
  },
  {
    symbol: 'SMCI',
    name: 'Super Micro Computer',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 34.80,
    change: 2.66,
    changePercent: 8.28,
    unit: 'USD',
    decimals: 2,
    badgeText: 'SM',
    badgeColor: '#0284C7',
    volume: '76.8M',
    marketCap: '20.4B',
    high24h: 35.40,
    low24h: 31.95,
    prevClose: 32.14,
    rating: 'Buy',
    sector: 'Technology',
    seed: 210,
    sparkline: [30.2, 31.0, 31.4, 31.9, 32.14, 33.1, 34.0, 34.80],
  },
  {
    symbol: 'MSTR',
    name: 'MicroStrategy Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 388.45,
    change: -18.70,
    changePercent: -4.59,
    unit: 'USD',
    decimals: 2,
    badgeText: 'MR',
    badgeColor: '#D92D20',
    volume: '31.4M',
    marketCap: '87.4B',
    high24h: 412.00,
    low24h: 384.20,
    prevClose: 407.15,
    rating: 'Neutral',
    sector: 'Technology',
    seed: 211,
    sparkline: [418.0, 415.2, 412.4, 409.5, 407.15, 399.8, 393.0, 388.45],
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global, Inc.',
    exchange: 'NASDAQ',
    category: 'Stocks',
    price: 309.12,
    change: 14.38,
    changePercent: 4.88,
    unit: 'USD',
    decimals: 2,
    badgeText: 'CB',
    badgeColor: '#0052FF',
    volume: '18.2M',
    marketCap: '77.2B',
    high24h: 312.80,
    low24h: 294.10,
    prevClose: 294.74,
    rating: 'Strong Buy',
    sector: 'Financial',
    seed: 212,
    sparkline: [286.4, 289.1, 291.8, 293.4, 294.74, 299.6, 304.8, 309.12],
  },

  // CRYPTO
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 94820.50,
    change: 2418.40,
    changePercent: 2.62,
    unit: 'USD',
    decimals: 2,
    badgeText: '₿',
    badgeColor: '#F7931A',
    volume: '64.2B',
    marketCap: '1.88T',
    high24h: 95410.00,
    low24h: 91850.00,
    prevClose: 92402.10,
    rating: 'Strong Buy',
    seed: 301,
    sparkline: [90100, 91200, 91800, 92100, 92402, 93250, 94100, 94820],
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 3428.90,
    change: 112.45,
    changePercent: 3.39,
    unit: 'USD',
    decimals: 2,
    badgeText: 'Ξ',
    badgeColor: '#627EEA',
    volume: '31.8B',
    marketCap: '412.6B',
    high24h: 3465.00,
    low24h: 3295.40,
    prevClose: 3316.45,
    rating: 'Strong Buy',
    seed: 302,
    sparkline: [3240, 3275, 3290, 3305, 3316, 3355, 3392, 3428],
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 238.64,
    change: 9.82,
    changePercent: 4.29,
    unit: 'USD',
    decimals: 2,
    badgeText: 'S',
    badgeColor: '#14F195',
    volume: '8.9B',
    marketCap: '113.4B',
    high24h: 241.90,
    low24h: 227.10,
    prevClose: 228.82,
    rating: 'Strong Buy',
    seed: 303,
    sparkline: [220.4, 223.1, 225.8, 227.2, 228.82, 232.4, 235.9, 238.64],
  },
  {
    symbol: 'XRPUSD',
    name: 'XRP',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 1.448,
    change: -0.042,
    changePercent: -2.82,
    unit: 'USD',
    decimals: 3,
    badgeText: 'X',
    badgeColor: '#23292F',
    volume: '6.4B',
    marketCap: '82.5B',
    high24h: 1.512,
    low24h: 1.425,
    prevClose: 1.490,
    rating: 'Neutral',
    seed: 304,
    sparkline: [1.52, 1.51, 1.50, 1.495, 1.490, 1.472, 1.458, 1.448],
  },
  {
    symbol: 'BNBUSD',
    name: 'BNB',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 642.18,
    change: 11.30,
    changePercent: 1.79,
    unit: 'USD',
    decimals: 2,
    badgeText: 'B',
    badgeColor: '#F3BA2F',
    volume: '2.1B',
    marketCap: '92.4B',
    high24h: 648.50,
    low24h: 628.40,
    prevClose: 630.88,
    rating: 'Buy',
    seed: 305,
    sparkline: [621, 624, 627, 629, 630.8, 635, 639, 642.1],
  },
  {
    symbol: 'DOGEUSD',
    name: 'Dogecoin',
    exchange: 'CRYPTO',
    category: 'Crypto',
    price: 0.394,
    change: 0.018,
    changePercent: 4.79,
    unit: 'USD',
    decimals: 3,
    badgeText: 'Ð',
    badgeColor: '#C2A633',
    volume: '7.3B',
    marketCap: '57.8B',
    high24h: 0.402,
    low24h: 0.371,
    prevClose: 0.376,
    rating: 'Buy',
    seed: 306,
    sparkline: [0.362, 0.368, 0.371, 0.374, 0.376, 0.383, 0.389, 0.394],
  },

  // FUTURES
  {
    symbol: 'CL1!',
    name: 'Crude Oil WTI',
    exchange: 'NYMEX',
    category: 'Futures',
    price: 68.94,
    change: -0.82,
    changePercent: -1.18,
    unit: 'USD',
    decimals: 2,
    badgeText: 'CL',
    badgeColor: '#374151',
    volume: '342K',
    high24h: 70.12,
    low24h: 68.55,
    prevClose: 69.76,
    rating: 'Sell',
    seed: 401,
    sparkline: [70.4, 70.1, 69.9, 69.8, 69.76, 69.4, 69.1, 68.94],
  },
  {
    symbol: 'GC1!',
    name: 'Gold Futures',
    exchange: 'COMEX',
    category: 'Futures',
    price: 2634.80,
    change: 18.40,
    changePercent: 0.70,
    unit: 'USD',
    decimals: 2,
    badgeText: 'AU',
    badgeColor: '#D97706',
    volume: '218K',
    high24h: 2642.10,
    low24h: 2610.50,
    prevClose: 2616.40,
    rating: 'Buy',
    seed: 402,
    sparkline: [2598, 2604, 2609, 2612, 2616.4, 2622, 2629, 2634.8],
  },
  {
    symbol: 'NG1!',
    name: 'Natural Gas',
    exchange: 'NYMEX',
    category: 'Futures',
    price: 3.384,
    change: 0.142,
    changePercent: 4.38,
    unit: 'USD',
    decimals: 3,
    badgeText: 'NG',
    badgeColor: '#0284C7',
    volume: '164K',
    high24h: 3.420,
    low24h: 3.210,
    prevClose: 3.242,
    rating: 'Strong Buy',
    seed: 403,
    sparkline: [3.18, 3.20, 3.22, 3.23, 3.242, 3.29, 3.34, 3.384],
  },
  {
    symbol: 'SI1!',
    name: 'Silver Futures',
    exchange: 'COMEX',
    category: 'Futures',
    price: 30.82,
    change: 0.34,
    changePercent: 1.12,
    unit: 'USD',
    decimals: 2,
    badgeText: 'AG',
    badgeColor: '#64748B',
    volume: '88K',
    high24h: 31.05,
    low24h: 30.32,
    prevClose: 30.48,
    rating: 'Buy',
    seed: 404,
    sparkline: [30.1, 30.2, 30.3, 30.4, 30.48, 30.6, 30.72, 30.82],
  },
  {
    symbol: 'HG1!',
    name: 'Copper Futures',
    exchange: 'COMEX',
    category: 'Futures',
    price: 4.118,
    change: -0.029,
    changePercent: -0.70,
    unit: 'USD',
    decimals: 3,
    badgeText: 'CU',
    badgeColor: '#B45309',
    volume: '71K',
    high24h: 4.165,
    low24h: 4.095,
    prevClose: 4.147,
    rating: 'Neutral',
    seed: 405,
    sparkline: [4.18, 4.17, 4.16, 4.15, 4.147, 4.135, 4.125, 4.118],
  },
  {
    symbol: 'ES1!',
    name: 'E-Mini S&P 500',
    exchange: 'CME',
    category: 'Futures',
    price: 6012.25,
    change: 34.50,
    changePercent: 0.58,
    unit: 'USD',
    decimals: 2,
    badgeText: 'ES',
    badgeColor: '#2962FF',
    volume: '1.62M',
    high24h: 6024.00,
    low24h: 5972.75,
    prevClose: 5977.75,
    rating: 'Strong Buy',
    seed: 406,
    sparkline: [5945, 5958, 5964, 5970, 5977.7, 5990, 6002, 6012.2],
  },

  // FOREX
  {
    symbol: 'DXY',
    name: 'US Dollar Index',
    exchange: 'TVC',
    category: 'Forex',
    price: 106.84,
    change: -0.38,
    changePercent: -0.35,
    unit: 'PTS',
    decimals: 2,
    badgeText: '$',
    badgeColor: '#059669',
    volume: '—',
    high24h: 107.35,
    low24h: 106.68,
    prevClose: 107.22,
    rating: 'Neutral',
    seed: 501,
    sparkline: [107.5, 107.4, 107.3, 107.25, 107.22, 107.08, 106.95, 106.84],
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / U.S. Dollar',
    exchange: 'FX',
    category: 'Forex',
    price: 1.0524,
    change: 0.0041,
    changePercent: 0.39,
    unit: 'USD',
    decimals: 4,
    badgeText: 'EU',
    badgeColor: '#1D4ED8',
    volume: '—',
    high24h: 1.0548,
    low24h: 1.0472,
    prevClose: 1.0483,
    rating: 'Neutral',
    seed: 502,
    sparkline: [1.045, 1.046, 1.047, 1.048, 1.0483, 1.0498, 1.0512, 1.0524],
  },
  {
    symbol: 'USDJPY',
    name: 'U.S. Dollar / Japanese Yen',
    exchange: 'FX',
    category: 'Forex',
    price: 153.62,
    change: -0.74,
    changePercent: -0.48,
    unit: 'JPY',
    decimals: 2,
    badgeText: 'JP',
    badgeColor: '#DC2626',
    volume: '—',
    high24h: 154.58,
    low24h: 153.30,
    prevClose: 154.36,
    rating: 'Sell',
    seed: 503,
    sparkline: [154.9, 154.7, 154.5, 154.4, 154.36, 154.05, 153.80, 153.62],
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / U.S. Dollar',
    exchange: 'FX',
    category: 'Forex',
    price: 1.2588,
    change: 0.0036,
    changePercent: 0.29,
    unit: 'USD',
    decimals: 4,
    badgeText: 'GB',
    badgeColor: '#4338CA',
    volume: '—',
    high24h: 1.2615,
    low24h: 1.2530,
    prevClose: 1.2552,
    rating: 'Neutral',
    seed: 504,
    sparkline: [1.251, 1.252, 1.253, 1.254, 1.2552, 1.2564, 1.2576, 1.2588],
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / USD',
    exchange: 'FX',
    category: 'Forex',
    price: 0.6514,
    change: 0.0028,
    changePercent: 0.43,
    unit: 'USD',
    decimals: 4,
    badgeText: 'AU',
    badgeColor: '#0D9488',
    volume: '—',
    high24h: 0.6530,
    low24h: 0.6478,
    prevClose: 0.6486,
    rating: 'Buy',
    seed: 505,
    sparkline: [0.646, 0.647, 0.6475, 0.648, 0.6486, 0.6496, 0.6505, 0.6514],
  },
  {
    symbol: 'USDCHF',
    name: 'U.S. Dollar / Swiss Franc',
    exchange: 'FX',
    category: 'Forex',
    price: 0.8862,
    change: -0.0029,
    changePercent: -0.33,
    unit: 'CHF',
    decimals: 4,
    badgeText: 'CH',
    badgeColor: '#B91C1C',
    volume: '—',
    high24h: 0.8904,
    low24h: 0.8848,
    prevClose: 0.8891,
    rating: 'Neutral',
    seed: 506,
    sparkline: [0.891, 0.8905, 0.890, 0.8895, 0.8891, 0.888, 0.887, 0.8862],
  },

  // BONDS
  {
    symbol: 'US10Y',
    name: 'US 10-Year Treasury Yield',
    exchange: 'TVC',
    category: 'Bonds',
    price: 4.286,
    change: -0.054,
    changePercent: -1.24,
    unit: '%',
    decimals: 3,
    badgeText: '10Y',
    badgeColor: '#334155',
    volume: '—',
    high24h: 4.358,
    low24h: 4.268,
    prevClose: 4.340,
    rating: 'Neutral',
    seed: 601,
    sparkline: [4.38, 4.37, 4.36, 4.35, 4.34, 4.32, 4.30, 4.286],
  },
  {
    symbol: 'US02Y',
    name: 'US 2-Year Treasury Yield',
    exchange: 'TVC',
    category: 'Bonds',
    price: 4.252,
    change: -0.041,
    changePercent: -0.96,
    unit: '%',
    decimals: 3,
    badgeText: '2Y',
    badgeColor: '#475569',
    volume: '—',
    high24h: 4.310,
    low24h: 4.240,
    prevClose: 4.293,
    rating: 'Neutral',
    seed: 602,
    sparkline: [4.33, 4.32, 4.31, 4.30, 4.293, 4.28, 4.265, 4.252],
  },
  {
    symbol: 'US30Y',
    name: 'US 30-Year Treasury Yield',
    exchange: 'TVC',
    category: 'Bonds',
    price: 4.468,
    change: -0.049,
    changePercent: -1.08,
    unit: '%',
    decimals: 3,
    badgeText: '30Y',
    badgeColor: '#1E293B',
    volume: '—',
    high24h: 4.530,
    low24h: 4.455,
    prevClose: 4.517,
    rating: 'Neutral',
    seed: 603,
    sparkline: [4.55, 4.54, 4.53, 4.52, 4.517, 4.50, 4.482, 4.468],
  },
  {
    symbol: 'DE10Y',
    name: 'Germany 10-Year Bund Yield',
    exchange: 'TVC',
    category: 'Bonds',
    price: 2.214,
    change: -0.032,
    changePercent: -1.42,
    unit: '%',
    decimals: 3,
    badgeText: 'DE',
    badgeColor: '#D97706',
    volume: '—',
    high24h: 2.256,
    low24h: 2.202,
    prevClose: 2.246,
    rating: 'Neutral',
    seed: 604,
    sparkline: [2.28, 2.27, 2.26, 2.25, 2.246, 2.235, 2.222, 2.214],
  },
  {
    symbol: 'JP10Y',
    name: 'Japan 10-Year JGB Yield',
    exchange: 'TVC',
    category: 'Bonds',
    price: 1.072,
    change: 0.014,
    changePercent: 1.32,
    unit: '%',
    decimals: 3,
    badgeText: 'JP',
    badgeColor: '#DC2626',
    volume: '—',
    high24h: 1.080,
    low24h: 1.055,
    prevClose: 1.058,
    rating: 'Buy',
    seed: 605,
    sparkline: [1.04, 1.045, 1.05, 1.054, 1.058, 1.064, 1.068, 1.072],
  },

  // ETFs
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'AMEX',
    category: 'ETFs',
    price: 597.42,
    change: 3.18,
    changePercent: 0.54,
    unit: 'USD',
    decimals: 2,
    badgeText: 'SP',
    badgeColor: '#059669',
    volume: '48.7M',
    marketCap: '618.4B',
    high24h: 598.60,
    low24h: 593.90,
    prevClose: 594.24,
    rating: 'Strong Buy',
    seed: 701,
    sparkline: [590.1, 591.4, 592.3, 593.5, 594.24, 595.4, 596.6, 597.42],
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    category: 'ETFs',
    price: 508.95,
    change: 4.12,
    changePercent: 0.82,
    unit: 'USD',
    decimals: 2,
    badgeText: 'QQ',
    badgeColor: '#2962FF',
    volume: '34.2M',
    marketCap: '309.2B',
    high24h: 510.10,
    low24h: 504.20,
    prevClose: 504.83,
    rating: 'Strong Buy',
    seed: 702,
    sparkline: [499.4, 501.2, 502.8, 503.9, 504.83, 506.4, 507.8, 508.95],
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    exchange: 'AMEX',
    category: 'ETFs',
    price: 241.30,
    change: 2.88,
    changePercent: 1.21,
    unit: 'USD',
    decimals: 2,
    badgeText: 'IW',
    badgeColor: '#0F172A',
    volume: '29.4M',
    marketCap: '78.6B',
    high24h: 242.15,
    low24h: 238.10,
    prevClose: 238.42,
    rating: 'Strong Buy',
    seed: 703,
    sparkline: [235.2, 236.1, 237.0, 237.8, 238.42, 239.5, 240.4, 241.30],
  },
  {
    symbol: 'GLD',
    name: 'SPDR Gold Shares',
    exchange: 'AMEX',
    category: 'ETFs',
    price: 243.18,
    change: 1.64,
    changePercent: 0.68,
    unit: 'USD',
    decimals: 2,
    badgeText: 'GL',
    badgeColor: '#D97706',
    volume: '8.1M',
    marketCap: '74.2B',
    high24h: 243.90,
    low24h: 241.10,
    prevClose: 241.54,
    rating: 'Buy',
    seed: 704,
    sparkline: [239.8, 240.2, 240.8, 241.1, 241.54, 242.1, 242.7, 243.18],
  },
  {
    symbol: 'TLT',
    name: 'iShares 20+ Year Treasury Bond',
    exchange: 'NASDAQ',
    category: 'ETFs',
    price: 92.64,
    change: 0.94,
    changePercent: 1.02,
    unit: 'USD',
    decimals: 2,
    badgeText: 'TL',
    badgeColor: '#475569',
    volume: '33.6M',
    marketCap: '61.5B',
    high24h: 92.95,
    low24h: 91.55,
    prevClose: 91.70,
    rating: 'Buy',
    seed: 705,
    sparkline: [90.8, 91.0, 91.3, 91.5, 91.70, 92.0, 92.35, 92.64],
  },
];

export const COMMUNITY_IDEAS: CommunityIdea[] = [
  {
    id: 'idea-1',
    title: 'SPX Ascending Channel Continuation Above 5,950 Support',
    symbol: 'SPX',
    timeframe: '4H',
    direction: 'Long',
    author: 'QuantMacroLab',
    publishedAt: '2 hours ago',
    summary:
      'Price reclaimed the 20-EMA with expanding breadth across industrials and financials, eyeing 6,050 liquidity pocket.',
    fullAnalysis: [
      'The S&P 500 continues to respect the multi-week ascending channel established in early October. After testing the lower trendline near 5,890, buyers stepped in decisively on above-average NYSE tick readings.',
      'Market breadth has broadened notably: equal-weight RSP is outperforming mega-cap tech on 3-day rolling basis, reducing concentration risk heading into month-end rebalancing.',
      'Invalidation sits below 5,915 on a daily closing basis, while the upper channel median projects toward 6,055–6,080.',
    ],
    likes: 418,
    comments: 54,
    category: 'Indices',
    chartPattern: 'channel',
    targetPrice: '6,065.00',
    stopLoss: '5,915.00',
  },
  {
    id: 'idea-2',
    title: 'BTCUSD Bull Flag Compression — Watch 95,500 Breakout Trigger',
    symbol: 'BTCUSD',
    timeframe: '1D',
    direction: 'Long',
    author: 'AtlasOrderflow',
    publishedAt: '4 hours ago',
    summary:
      'Spot ETF inflows remain net positive while perpetual funding cools back toward neutral, forming a textbook continuation flag.',
    fullAnalysis: [
      'Bitcoin is consolidating tightly beneath the psychological 95,500–96,000 resistance band following its impulsive November leg higher.',
      'Derivatives open interest flushed excessive leverage during yesterday’s dip to 91,850, leaving spot bids anchored on Coinbase and CME futures holding a healthy annualized basis.',
      'A decisive 4H candle close above 95,500 opens the path toward price discovery at 100,000–102,400.',
    ],
    likes: 792,
    comments: 118,
    category: 'Crypto',
    chartPattern: 'breakout',
    targetPrice: '101,800.00',
    stopLoss: '91,200.00',
  },
  {
    id: 'idea-3',
    title: 'NVDA Post-Earnings Equilibrium & VWAP Reclaim Setup',
    symbol: 'NVDA',
    timeframe: '1H',
    direction: 'Long',
    author: 'SiliconTape',
    publishedAt: '6 hours ago',
    summary:
      'After digesting post-earnings volatility, NVDA held anchored VWAP from the gap day and rotated back above 145.',
    fullAnalysis: [
      'NVIDIA spent three sessions building an equilibrium value area between 140.50 and 144.80 as implied volatility crushed post-earnings.',
      'Today’s session opened with an immediate drive through the upper value area high (144.80) on strong institutional block volume.',
      'As long as 142.50 holds as support, momentum favors a retest of the 152.00 prior swing high.',
    ],
    likes: 329,
    comments: 41,
    category: 'Stocks',
    chartPattern: 'wedge',
    targetPrice: '152.80',
    stopLoss: '141.40',
  },
  {
    id: 'idea-4',
    title: 'USDJPY Bearish Divergence at 154.60 Macro Supply Zone',
    symbol: 'USDJPY',
    timeframe: '4H',
    direction: 'Short',
    author: 'FXDeskLondon',
    publishedAt: '9 hours ago',
    summary:
      'Softening US 10Y yields paired with hawkish BoJ commentary weigh on USD/JPY below key 154.50 resistance.',
    fullAnalysis: [
      'USD/JPY printed a clear RSI bearish divergence into the 154.60–155.00 supply zone while US Treasury yields rolled over below 4.30%.',
      'Break below the 153.80 intraday neckline confirms short-term momentum shift toward the 200-period moving average near 151.90.',
    ],
    likes: 214,
    comments: 29,
    category: 'Forex',
    chartPattern: 'reversal',
    targetPrice: '151.85',
    stopLoss: '154.85',
  },
];

export const HEATMAP_TILES: HeatmapTile[] = [
  // Technology
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', marketCapWeight: 18, marketCapLabel: '3.59T', price: 146.67, changePercent: 3.47 },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', marketCapWeight: 17, marketCapLabel: '3.52T', price: 232.87, changePercent: 0.93 },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology', marketCapWeight: 16, marketCapLabel: '3.15T', price: 423.46, changePercent: 0.92 },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Technology', marketCapWeight: 6, marketCapLabel: '764B', price: 163.40, changePercent: 2.18 },
  { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', marketCapWeight: 5, marketCapLabel: '518B', price: 187.12, changePercent: 1.44 },
  { symbol: 'AMD', name: 'AMD', sector: 'Technology', marketCapWeight: 4, marketCapLabel: '224B', price: 138.42, changePercent: -2.31 },
  { symbol: 'PLTR', name: 'Palantir', sector: 'Technology', marketCapWeight: 3.5, marketCapLabel: '147B', price: 64.92, changePercent: 6.34 },

  // Communication & Consumer
  { symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer Cyclical', marketCapWeight: 13, marketCapLabel: '2.18T', price: 207.86, changePercent: 2.05 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', marketCapWeight: 8, marketCapLabel: '1.09T', price: 342.03, changePercent: -3.23 },
  { symbol: 'HD', name: 'Home Depot', sector: 'Consumer Cyclical', marketCapWeight: 4, marketCapLabel: '412B', price: 416.20, changePercent: 0.64 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication', marketCapWeight: 10, marketCapLabel: '1.44T', price: 572.44, changePercent: 1.53 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication', marketCapWeight: 12, marketCapLabel: '2.06T', price: 169.40, changePercent: -0.48 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', marketCapWeight: 4, marketCapLabel: '378B', price: 882.50, changePercent: 1.82 },

  // Financial & Healthcare
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financial', marketCapWeight: 7, marketCapLabel: '698B', price: 247.80, changePercent: 1.12 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial', marketCapWeight: 6, marketCapLabel: '612B', price: 311.45, changePercent: 0.41 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financial', marketCapWeight: 8, marketCapLabel: '1.02T', price: 474.10, changePercent: 0.28 },
  { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', marketCapWeight: 7, marketCapLabel: '746B', price: 786.15, changePercent: -2.04 },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare', marketCapWeight: 6, marketCapLabel: '548B', price: 594.30, changePercent: -0.62 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', marketCapWeight: 5, marketCapLabel: '524B', price: 118.92, changePercent: -1.14 },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', marketCapWeight: 4, marketCapLabel: '286B', price: 161.45, changePercent: -0.88 },
];

export const US_SECTORS: SectorPerf[] = [
  { name: 'Electronic Technology', stocksCount: 284, marketCap: '14.82T', change1D: 1.64, change1W: 3.12, change1M: 6.84, peRatio: '33.4' },
  { name: 'Technology Services', stocksCount: 412, marketCap: '11.24T', change1D: 1.18, change1W: 2.45, change1M: 5.12, peRatio: '36.1' },
  { name: 'Finance', stocksCount: 745, marketCap: '9.64T', change1D: 0.72, change1W: 1.94, change1M: 7.45, peRatio: '16.8' },
  { name: 'Retail Trade', stocksCount: 218, marketCap: '5.92T', change1D: 0.94, change1W: 2.10, change1M: 4.38, peRatio: '28.5' },
  { name: 'Health Technology', stocksCount: 590, marketCap: '5.41T', change1D: -1.12, change1W: -0.84, change1M: -2.16, peRatio: '22.9' },
  { name: 'Energy Minerals', stocksCount: 164, marketCap: '2.78T', change1D: -0.96, change1W: -1.42, change1M: 1.85, peRatio: '13.2' },
  { name: 'Producer Manufacturing', stocksCount: 310, marketCap: '3.45T', change1D: 0.54, change1W: 1.38, change1M: 3.92, peRatio: '24.1' },
];

export const YIELD_CURVE_DATA: YieldCurvePoint[] = [
  { maturity: '1M', current: 4.58, oneMonthAgo: 4.74, oneYearAgo: 5.38 },
  { maturity: '3M', current: 4.51, oneMonthAgo: 4.63, oneYearAgo: 5.41 },
  { maturity: '6M', current: 4.42, oneMonthAgo: 4.46, oneYearAgo: 5.36 },
  { maturity: '1Y', current: 4.33, oneMonthAgo: 4.29, oneYearAgo: 5.18 },
  { maturity: '2Y', current: 4.25, oneMonthAgo: 4.11, oneYearAgo: 4.88 },
  { maturity: '5Y', current: 4.19, oneMonthAgo: 4.04, oneYearAgo: 4.49 },
  { maturity: '10Y', current: 4.29, oneMonthAgo: 4.19, oneYearAgo: 4.47 },
  { maturity: '20Y', current: 4.55, oneMonthAgo: 4.52, oneYearAgo: 4.81 },
  { maturity: '30Y', current: 4.47, oneMonthAgo: 4.46, oneYearAgo: 4.62 },
];

export const TOP_STORIES: NewsStory[] = [
  {
    id: 'news-1',
    headline: 'S&P 500 and Nasdaq Push Higher as Treasury Yields Ease Ahead of Fed Minutes',
    source: 'Reuters',
    timeAgo: '14 minutes ago',
    category: 'US Markets',
    relatedSymbols: ['SPX', 'NDX', 'US10Y'],
    excerpt:
      'Wall Street benchmarks advanced in afternoon trading as a pullback in the 10-year Treasury yield lifted semiconductor and cloud software leaders.',
    body: [
      'US equity benchmarks climbed steadily on Monday afternoon, led by gains across semiconductor equipment makers and mega-cap software names after the benchmark 10-year Treasury yield slipped 5 basis points to 4.286%.',
      'Traders are positioning ahead of Wednesday’s Federal Open Market Committee minutes and the latest core PCE inflation release, looking for clarity on the pace of rate adjustments heading into early next year.',
      'Market breadth remained constructive with advancing issues outnumbering decliners nearly 2-to-1 on the New York Stock Exchange.',
    ],
  },
  {
    id: 'news-2',
    headline: 'Bitcoin Holds Near $94,800 While Institutional Spot ETF Demand Absorbs Profit-Taking',
    source: 'CoinDesk',
    timeAgo: '38 minutes ago',
    category: 'Crypto',
    relatedSymbols: ['BTCUSD', 'ETHUSD', 'COIN'],
    excerpt:
      'Digital asset funds recorded another week of multi-billion-dollar net inflows as corporate treasury adoption accelerates.',
    body: [
      'Bitcoin traded firmly near $94,820 on Monday, shrugging off overnight volatility as US-listed spot ETF products continued to attract strong institutional allocations.',
      'Ethereum outperformed on the session, rising 3.4% toward $3,430 alongside renewed staking inflows and Layer-2 settlement activity.',
    ],
  },
  {
    id: 'news-3',
    headline: 'Crude Oil Slides Below $69 as Traders Weigh Supply Outlook and Dollar Moves',
    source: 'Dow Jones Newswires',
    timeAgo: '1 hour ago',
    category: 'Commodities',
    relatedSymbols: ['CL1!', 'DXY', 'XOM'],
    excerpt:
      'WTI crude futures fell more than 1% even as natural gas jumped over 4% on colder US weather forecasts.',
    body: [
      'West Texas Intermediate crude futures retreated 1.18% to $68.94 per barrel as market participants assessed non-OPEC supply growth and muted refining margins in Asia.',
      'Conversely, US natural gas futures surged 4.38% to $3.384/MMBtu following updated December heating degree-day projections across the Midwest and Northeast.',
    ],
  },
  {
    id: 'news-4',
    headline: 'Gold Rebounds Above $2,630 as 10-Year Real Yields Soften',
    source: 'MarketWatch',
    timeAgo: '2 hours ago',
    category: 'Metals',
    relatedSymbols: ['GC1!', 'SI1!', 'GLD'],
    excerpt:
      'Bullion regained upward momentum after buyers defended the $2,600 psychological floor.',
    body: [
      'Gold futures climbed $18.40 to settle near $2,634.80 per troy ounce as a softer US Dollar Index (DXY) and declining Treasury yields renewed demand for non-yielding safe-haven assets.',
    ],
  },
  {
    id: 'news-5',
    headline: 'European Equities Close Higher With DAX Outperforming on Industrial Strength',
    source: 'Bloomberg',
    timeAgo: '3 hours ago',
    category: 'Europe',
    relatedSymbols: ['DAX', 'UKX', 'EURUSD'],
    excerpt:
      'Frankfurt’s DAX rose 0.71% supported by industrial automation and defense names.',
    body: [
      'European benchmarks ended solidly in positive territory, led by Germany’s DAX (+0.71%) and London’s FTSE 100 (+0.35%) as EUR/USD stabilized above 1.0520.',
    ],
  },
];

export const ECONOMIC_CALENDAR: EconomicEvent[] = [
  { id: 'ec-1', time: '08:30', country: 'US', currency: 'USD', title: 'Chicago Fed National Activity Index', impact: 'Medium', actual: '-0.40', forecast: '-0.22', prior: '-0.27' },
  { id: 'ec-2', time: '10:30', country: 'US', currency: 'USD', title: 'Dallas Fed Manufacturing Index', impact: 'Medium', actual: '-2.7', forecast: '-2.4', prior: '-3.0' },
  { id: 'ec-3', time: '13:00', country: 'US', currency: 'USD', title: '2-Year Note Auction', impact: 'High', actual: '4.274%', forecast: '—', prior: '4.130%' },
  { id: 'ec-4', time: '04:00', country: 'DE', currency: 'EUR', title: 'Ifo Business Climate Index', impact: 'High', actual: '85.7', forecast: '86.0', prior: '86.5' },
  { id: 'ec-5', time: '09:00', country: 'US', currency: 'USD', title: 'S&P/Case-Shiller Home Price YoY', impact: 'Medium', actual: '—', forecast: '4.7%', prior: '5.2%' },
  { id: 'ec-6', time: '10:00', country: 'US', currency: 'USD', title: 'CB Consumer Confidence', impact: 'High', actual: '—', forecast: '111.8', prior: '108.7' },
  { id: 'ec-7', time: '14:00', country: 'US', currency: 'USD', title: 'FOMC Meeting Minutes', impact: 'High', actual: '—', forecast: '—', prior: '—' },
];

export const EARNINGS_CALENDAR: EarningsEvent[] = [
  { symbol: 'ZM', company: 'Zoom Video Communications', date: 'Today', timing: 'After close', epsEstimate: '1.31', epsReported: '1.38', surprisePercent: 5.34, marketCap: '26.4B' },
  { symbol: 'A', company: 'Agilent Technologies', date: 'Today', timing: 'After close', epsEstimate: '1.41', epsReported: '1.46', surprisePercent: 3.55, marketCap: '38.9B' },
  { symbol: 'BBY', company: 'Best Buy Co., Inc.', date: 'Tomorrow', timing: 'Before open', epsEstimate: '1.29', epsReported: '—', surprisePercent: null, marketCap: '19.8B' },
  { symbol: 'DELL', company: 'Dell Technologies Inc.', date: 'Tomorrow', timing: 'After close', epsEstimate: '2.06', epsReported: '—', surprisePercent: null, marketCap: '101.4B' },
  { symbol: 'CRWD', company: 'CrowdStrike Holdings', date: 'Tomorrow', timing: 'After close', epsEstimate: '0.81', epsReported: '—', surprisePercent: null, marketCap: '89.2B' },
  { symbol: 'WDAY', company: 'Workday, Inc.', date: 'Tomorrow', timing: 'After close', epsEstimate: '1.76', epsReported: '—', surprisePercent: null, marketCap: '71.5B' },
];
