import React, { useEffect } from 'react';
import { MessageSquare, ThumbsUp, X } from 'lucide-react';
import { CommunityIdea, NewsStory } from '../data/marketsData';
import { IdeaPreviewSvg } from './IdeaPreviewSvg';

interface IdeaModalProps {
  idea: CommunityIdea | null;
  story: NewsStory | null;
  onClose: () => void;
  onOpenSymbol: (symbolCode: string) => void;
}

export const ReaderModal: React.FC<IdeaModalProps> = ({
  idea,
  story,
  onClose,
  onOpenSymbol,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (idea || story) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idea, story, onClose]);

  if (!idea && !story) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#131722] border border-[#E0E3EB] dark:border-[#2A2E39] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E0E3EB] dark:border-[#2A2E39]">
          <div className="text-xs font-medium text-[#6A6D78] dark:text-[#868993]">
            {idea ? `Community Idea · ${idea.symbol} · ${idea.timeframe}` : `${story?.source} · ${story?.timeAgo}`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6A6D78] hover:text-[#131722] dark:hover:text-white hover:bg-[#F0F3FA] dark:hover:bg-[#1E222D] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {idea && (
          <div className="p-5 space-y-4">
            <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-snug">
              {idea.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6A6D78] dark:text-[#868993]">
              <span className="font-medium text-[#131722] dark:text-[#D1D4DC]">by {idea.author}</span>
              <span aria-hidden="true">·</span>
              <span>{idea.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-semibold ${
                  idea.direction === 'Long' ? 'text-[#089981]' : 'text-[#F23645]'
                }`}
              >
                {idea.direction} Bias
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#E0E3EB] dark:border-[#2A2E39]">
              <IdeaPreviewSvg pattern={idea.chartPattern} direction={idea.direction} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8F9FD] dark:bg-[#1E222D] border border-[#E0E3EB] dark:border-[#2A2E39] text-xs font-mono-num">
              <div>
                <div className="text-[#6A6D78] dark:text-[#868993]">Target zone</div>
                <div className="text-sm font-semibold text-[#089981] mt-0.5">{idea.targetPrice}</div>
              </div>
              <div>
                <div className="text-[#6A6D78] dark:text-[#868993]">Invalidation level</div>
                <div className="text-sm font-semibold text-[#F23645] mt-0.5">{idea.stopLoss}</div>
              </div>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-[#131722] dark:text-[#D1D4DC]">
              {idea.fullAnalysis.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E0E3EB] dark:border-[#2A2E39]">
              <div className="flex items-center gap-4 text-xs text-[#6A6D78] dark:text-[#868993]">
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> {idea.likes}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {idea.comments}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSymbol(idea.symbol);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2962FF] hover:bg-[#1E53E5] rounded-lg transition-colors cursor-pointer"
              >
                Open {idea.symbol} live chart
              </button>
            </div>
          </div>
        )}

        {story && (
          <div className="p-5 space-y-4">
            <h3 className="text-xl font-bold text-[#131722] dark:text-white leading-snug">
              {story.headline}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6A6D78] dark:text-[#868993]">
              <span>{story.category}</span>
              <span aria-hidden="true">·</span>
              <span>{story.source}</span>
              <span aria-hidden="true">·</span>
              <span>{story.timeAgo}</span>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-[#131722] dark:text-[#D1D4DC]">
              {story.body.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
            <div className="pt-3 border-t border-[#E0E3EB] dark:border-[#2A2E39] flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#6A6D78] dark:text-[#868993]">Related tickers:</span>
              {story.relatedSymbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSymbol(sym);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold font-mono-num rounded-md bg-[#F0F3FA] dark:bg-[#1E222D] text-[#2962FF] hover:bg-[#2962FF]/15 transition-colors cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
