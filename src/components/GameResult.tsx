import { useCallback } from 'react';
import type { GameScore } from '../utils/scoring';
import { buildShareText } from '../utils/scoring';
import type { StrikeoutPitch } from '../data/types';
import type { GameMode } from '../data/types';

interface GameResultProps {
  score: GameScore;
  pitches: StrikeoutPitch[];
  callHistory: Array<{pitch: StrikeoutPitch, userCall: 'strike' | 'ball', correct: boolean}>;
  gameMode: GameMode;
  onRestart: () => void;
}

const SHARE_URL = 'https://wbc-pitch-game.vercel.app';

const MODE_FOOTER: Record<GameMode, string> = {
  wbc: 'WBC 2026 한국 대표팀 실제 Statcast 데이터 기반',
  skubal: 'Tarik Skubal 2024 시즌 Statcast 보더라인 피치 기반',
  skenes: 'Paul Skenes 2024-25 시즌 Statcast 보더라인 피치 기반',
};

export default function GameResult({ score, pitches: _pitches, callHistory, gameMode, onRestart }: GameResultProps) {
  const shareText = buildShareText(score, SHARE_URL, gameMode);

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

  const handleThreads = useCallback(() => {
    const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  }, [shareText]);

  const handleFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  }, [shareText]);

  return (
    <div className="min-h-full overflow-y-auto px-4 py-8 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-6xl mb-4">{score.gradeEmoji}</div>
        <h2 className="text-3xl font-bold text-white mb-2">{score.message}</h2>

        <div className="bg-slate-800/60 rounded-2xl p-6 my-6">
          <div className="text-6xl font-bold text-white mb-1">
            {score.correct}<span className="text-2xl text-slate-400">/{score.total}</span>
          </div>
          <div className="text-lg text-yellow-400 font-bold">{score.percentage}점</div>
          <div className="text-sm text-slate-400 mt-1">{score.grade}</div>
          {gameMode !== 'wbc' && (
            <div className="text-xs text-amber-400/80 mt-2">보더라인 극한모드</div>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleTwitter}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {'\uD835\uDD4F'} Twitter
            </button>
            <button
              onClick={handleThreads}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Threads
            </button>
            <button
              onClick={handleFacebook}
              className="py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl transition-colors text-sm"
            >
              Facebook
            </button>
            <button
              onClick={handleShare}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {'\uD83D\uDCCB'} 복사
            </button>
          </div>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
          >
            다시 도전!
          </button>
        </div>

        {/* 투구 상세 */}
        <div className="mt-6 bg-slate-800/60 rounded-xl p-4 text-left">
          <h3 className="text-sm font-bold text-slate-300 mb-3">투구 상세</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs whitespace-nowrap">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="py-1 pr-2 text-left">#</th>
                  <th className="py-1 pr-2 text-left">{gameMode === 'wbc' ? '경기' : '시즌'}</th>
                  <th className="py-1 pr-2 text-left">투수</th>
                  <th className="py-1 pr-2 text-left">타자</th>
                  <th className="py-1 pr-2 text-left">구종</th>
                  <th className="py-1 pr-2 text-right">km/h</th>
                  <th className="py-1 pr-1 text-center">콜</th>
                  <th className="py-1 text-center">O/X</th>
                </tr>
              </thead>
              <tbody>
                {callHistory.map((entry, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
                    <td className="py-1.5 pr-2 text-slate-300">{entry.pitch.game}</td>
                    <td className="py-1.5 pr-2 text-slate-300">{entry.pitch.pitcher}</td>
                    <td className="py-1.5 pr-2 text-slate-300">{entry.pitch.batter}</td>
                    <td className="py-1.5 pr-2 text-slate-300">{entry.pitch.pitchName}</td>
                    <td className="py-1.5 pr-2 text-right text-slate-300">{(entry.pitch.startSpeed * 1.60934).toFixed(0)}</td>
                    <td className="py-1.5 pr-1 text-center">
                      <span className={entry.userCall === 'strike' ? 'text-red-400' : 'text-blue-400'}>
                        {entry.userCall === 'strike' ? 'S' : 'B'}
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      {entry.correct ? '\u2705' : '\u274C'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          {MODE_FOOTER[gameMode]}
        </p>
      </div>
    </div>
  );
}
