import { useCallback } from 'react';
import type { GameScore } from '../utils/scoring';
import { buildShareText } from '../utils/scoring';

interface GameResultProps {
  score: GameScore;
  onRestart: () => void;
}

const SHARE_URL = 'https://wbc-pitch-game.vercel.app';

export default function GameResult({ score, onRestart }: GameResultProps) {
  const shareText = buildShareText(score, SHARE_URL);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // User cancelled or not supported
      }
    }
    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      alert('클립보드에 복사되었습니다!');
    } catch {
      // Final fallback
      prompt('복사하세요:', shareText);
    }
  }, [shareText]);

  const handleTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  }, [shareText]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md w-full">
        <div className="text-6xl mb-4">{score.gradeEmoji}</div>
        <h2 className="text-3xl font-bold text-white mb-2">{score.message}</h2>

        <div className="bg-slate-800/60 rounded-2xl p-6 my-6">
          <div className="text-6xl font-bold text-white mb-1">
            {score.correct}<span className="text-2xl text-slate-400">/{score.total}</span>
          </div>
          <div className="text-lg text-yellow-400 font-bold">{score.percentage}점</div>
          <div className="text-sm text-slate-400 mt-1">{score.grade}</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
          >
            결과 공유하기
          </button>
          <button
            onClick={handleTwitter}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
          >
            X(Twitter) 공유
          </button>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
          >
            다시 도전!
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          WBC 2026 한국 대표팀 실제 Statcast 데이터 기반
        </p>
      </div>
    </div>
  );
}
