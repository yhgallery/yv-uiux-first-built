import React from 'react';

interface IdeaPreviewSvgProps {
  pattern: 'breakout' | 'channel' | 'reversal' | 'wedge';
  direction: 'Long' | 'Short' | 'Neutral';
}

export const IdeaPreviewSvg: React.FC<IdeaPreviewSvgProps> = ({ pattern, direction }) => {
  const isLong = direction !== 'Short';
  const accent = isLong ? '#089981' : '#F23645';

  return (
    <svg
      viewBox="0 0 360 180"
      className="w-full h-44 bg-[#F8F9FD] dark:bg-[#1E222D] border-b border-[#E0E3EB] dark:border-[#2A2E39]"
      aria-hidden="true"
    >
      {/* Subtle chart grid */}
      <g className="stroke-[#E0E3EB] dark:stroke-[#2A2E39]" strokeWidth="1">
        <line x1="0" y1="45" x2="360" y2="45" />
        <line x1="0" y1="90" x2="360" y2="90" />
        <line x1="0" y1="135" x2="360" y2="135" />
        <line x1="90" y1="0" x2="90" y2="180" />
        <line x1="180" y1="0" x2="180" y2="180" />
        <line x1="270" y1="0" x2="270" y2="180" />
      </g>

      {pattern === 'channel' && (
        <>
          <polygon points="30,130 290,55 290,95 30,170" fill="#2962FF" fillOpacity="0.08" />
          <line x1="30" y1="130" x2="310" y2="50" stroke="#2962FF" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="30" y1="170" x2="310" y2="90" stroke="#2962FF" strokeWidth="1.5" />
          <polyline
            points="35,148 70,132 95,142 135,112 165,122 205,94 235,102 275,72 315,58"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
          />
          <circle cx="275" cy="72" r="4" fill={accent} />
        </>
      )}

      {pattern === 'breakout' && (
        <>
          <rect x="230" y="34" width="100" height="44" fill="#089981" fillOpacity="0.12" />
          <line x1="40" y1="78" x2="330" y2="78" stroke="#2962FF" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="150" y1="90" x2="245" y2="78" stroke="#787B86" strokeWidth="1.3" />
          <line x1="150" y1="118" x2="245" y2="92" stroke="#787B86" strokeWidth="1.3" />
          <polyline
            points="35,145 75,120 110,95 145,84 175,108 205,86 235,96 260,64 310,44"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
          />
          <circle cx="260" cy="64" r="4" fill={accent} />
        </>
      )}

      {pattern === 'wedge' && (
        <>
          <line x1="55" y1="54" x2="260" y2="86" stroke="#2962FF" strokeWidth="1.5" />
          <line x1="55" y1="138" x2="260" y2="96" stroke="#2962FF" strokeWidth="1.5" />
          <polyline
            points="35,128 65,64 95,124 130,72 165,112 198,82 232,98 265,78 315,48"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
          />
          <rect x="260" y="36" width="75" height="34" fill="#089981" fillOpacity="0.12" />
        </>
      )}

      {pattern === 'reversal' && (
        <>
          <rect x="70" y="32" width="160" height="22" fill="#F23645" fillOpacity="0.12" />
          <line x1="40" y1="104" x2="320" y2="104" stroke="#787B86" strokeWidth="1.4" strokeDasharray="4 3" />
          <polyline
            points="35,120 78,48 118,78 158,44 198,94 235,106 275,134 315,148"
            fill="none"
            stroke={accent}
            strokeWidth="2.2"
          />
          <circle cx="235" cy="106" r="4" fill={accent} />
        </>
      )}
    </svg>
  );
};
