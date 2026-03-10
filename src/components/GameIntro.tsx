import { useState } from 'react';
import type { GameMode } from '../data/types';

interface GameIntroProps {
  onStart: (batSide: 'L' | 'R', mode: GameMode, fastballOnly: boolean) => void;
}

const MODE_CARDS: Array<{
  mode: GameMode;
  flag: string;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  borderColor: string;
  glowColor: string;
}> = [
  {
    mode: 'wbc',
    flag: '\u{1F1F0}\u{1F1F7}',
    title: 'WBC 클래식',
    subtitle: 'WBC 2026 실전',
    desc: '삼진 + 보더라인 416구',
    color: 'from-red-600 to-blue-600',
    borderColor: 'border-red-500/40',
    glowColor: 'shadow-red-500/20',
  },
  {
    mode: 'skubal',
    flag: '\u{1F3C6}',
    title: 'SKUBAL',
    subtitle: 'AL 사이영 수상자',
    desc: '보더라인 극한 난이도',
    color: 'from-orange-500 to-yellow-600',
    borderColor: 'border-orange-500/40',
    glowColor: 'shadow-orange-500/20',
  },
  {
    mode: 'skenes',
    flag: '\u{1F525}',
    title: 'SKENES',
    subtitle: '100mph 괴물 신인',
    desc: '보더라인 극한 난이도',
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/40',
    glowColor: 'shadow-purple-500/20',
  },
];

export default function GameIntro({ onStart }: GameIntroProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('wbc');
  const [fastballOnly, setFastballOnly] = useState(false);

  const isBorderlineMode = selectedMode !== 'wbc';

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1 bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          You Think This Is Easy?
        </h1>
        <p className="text-base sm:text-lg text-slate-300 mb-5">WBC 2026 타자 챌린지</p>

        {/* Mode selection cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {MODE_CARDS.map((card) => (
            <button
              key={card.mode}
              onClick={() => setSelectedMode(card.mode)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left
                ${selectedMode === card.mode
                  ? `${card.borderColor} bg-slate-800/80 shadow-lg ${card.glowColor} scale-[1.02]`
                  : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'
                }`}
            >
              {selectedMode === card.mode && (
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{'\u2713'}</span>
                </div>
              )}
              <div className="text-xl mb-1">{card.flag}</div>
              <div className="text-xs font-bold text-white leading-tight">{card.title}</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{card.subtitle}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{card.desc}</div>
            </button>
          ))}
        </div>

        {/* Rules box */}
        <div className="bg-slate-800/60 rounded-xl p-4 mb-5 text-left space-y-2">
          <p className="text-sm text-slate-300">
            <span className="text-yellow-400 font-bold">규칙</span>: 타자 시점에서 투구를 보고 Strike 또는 Ball을 판정하세요.
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-green-400 font-bold">데이터</span>: {
              selectedMode === 'wbc'
                ? 'WBC 2026 한국 대표팀 실제 Statcast 데이터.'
                : selectedMode === 'skubal'
                ? 'Tarik Skubal 2024 시즌 Statcast 보더라인 피치.'
                : 'Paul Skenes 2024-25 시즌 Statcast 보더라인 피치.'
            }
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-blue-400 font-bold">판정 기준</span>: 공이 스트라이크존을 통과했는지 여부 (공 반지름 포함).
          </p>
          {isBorderlineMode && (
            <p className="text-sm text-amber-400/90 font-medium">
              {'\u26A0'} 보더라인 피치만 선별 — 극한 난이도!
            </p>
          )}
          <p className="text-sm text-slate-400">
            총 10문제 | 100점 만점
          </p>
        </div>

        {/* Fastball toggle - WBC mode only */}
        {!isBorderlineMode && (
          <label className="flex items-center justify-center gap-2 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={fastballOnly}
              onChange={(e) => setFastballOnly(e.target.checked)}
              className="w-4 h-4 accent-orange-500 rounded"
            />
            <span className="text-sm font-bold text-orange-400">강속구 모드</span>
            <span className="text-xs text-slate-500">(93mph+ 만)</span>
          </label>
        )}

        <p className="text-sm text-slate-400 mb-3">어느 타석에서 볼까요?</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onStart('L', selectedMode, !isBorderlineMode && fastballOnly)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/30"
          >
            좌타 시점
          </button>
          <button
            onClick={() => onStart('R', selectedMode, !isBorderlineMode && fastballOnly)}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
          >
            우타 시점
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          {selectedMode === 'wbc'
            ? 'KOR vs CZE, JPN, TPE | 실제 Statcast 궤적 재현'
            : selectedMode === 'skubal'
            ? 'Tarik Skubal | 2024 AL Cy Young | Statcast 궤적 재현'
            : 'Paul Skenes | 2024 NL ROY | Statcast 궤적 재현'}
        </p>
      </div>
    </div>
  );
}
