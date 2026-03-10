import type { StrikeoutPitch } from '../data/types';
import { getPitchColor, getPitchNameKo } from '../utils/pitchColors';

interface PitchResultProps {
  pitch: StrikeoutPitch;
  userCall: 'strike' | 'ball';
  isCorrect: boolean;
  onNext: () => void;
}

export default function PitchResult({ pitch, userCall, isCorrect, onNext }: PitchResultProps) {
  const pitchColor = getPitchColor(pitch.pitchCode);
  const answer = pitch.isStrike ? 'Strike' : 'Ball';

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6 max-w-sm w-full mx-4 border border-slate-700">
        {/* Correct/Wrong */}
        <div className="text-center mb-4">
          <div className={`text-5xl mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '\u2705' : '\u274C'}
          </div>
          <p className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '정답!' : '오답!'}
          </p>
        </div>

        {/* Answer info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">정답</span>
            <span className={`font-bold ${pitch.isStrike ? 'text-red-400' : 'text-blue-400'}`}>
              {answer}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">내 판정</span>
            <span className={`font-bold ${userCall === 'strike' ? 'text-red-400' : 'text-blue-400'}`}>
              {userCall === 'strike' ? 'Strike' : 'Ball'}
            </span>
          </div>
          <hr className="border-slate-700" />
          <div className="flex justify-between">
            <span className="text-slate-400">구종</span>
            <span className="font-medium" style={{ color: pitchColor }}>
              {getPitchNameKo(pitch.pitchCode)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">구속</span>
            <span className="font-medium">{pitch.startSpeed} mph</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">투수</span>
            <span className="font-medium">{pitch.pitcher}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">타자</span>
            <span className="font-medium">{pitch.batter}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">경기</span>
            <span className="font-medium text-slate-300">{pitch.game}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full mt-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
        >
          다음 투구
        </button>
      </div>
    </div>
  );
}
