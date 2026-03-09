interface GameIntroProps {
  onStart: () => void;
}

export default function GameIntro({ onStart }: GameIntroProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          You Think This Is Easy?
        </h1>
        <p className="text-lg text-slate-300 mb-8">WBC 2026 심판 챌린지</p>

        <div className="bg-slate-800/60 rounded-xl p-6 mb-8 text-left space-y-3">
          <p className="text-sm text-slate-300">
            <span className="text-yellow-400 font-bold">규칙</span>: 타자 시점에서 투구를 보고 Strike 또는 Ball을 판정하세요.
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-green-400 font-bold">데이터</span>: WBC 2026 한국 대표팀 실제 삼진 투구 Statcast 데이터 기반.
          </p>
          <p className="text-sm text-slate-300">
            <span className="text-blue-400 font-bold">판정 기준</span>: 공이 스트라이크존을 통과했는지 여부 (공 반지름 포함).
          </p>
          <p className="text-sm text-slate-400">
            총 10문제 | 100점 만점
          </p>
        </div>

        <button
          onClick={onStart}
          className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30"
        >
          도전 시작!
        </button>

        <p className="mt-6 text-xs text-slate-500">
          KOR vs CZE, JPN, TPE | 실제 Statcast 궤적 재현
        </p>
      </div>
    </div>
  );
}
