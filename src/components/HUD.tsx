interface HUDProps {
  current: number;
  total: number;
  score: number;
}

export default function HUD({ current, total, score }: HUDProps) {
  return (
    <div className="absolute top-4 left-0 right-0 z-10 flex justify-between items-center px-4 sm:px-8">
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2">
        <span className="text-slate-400 text-sm">투구 </span>
        <span className="text-white font-bold text-lg">{current}/{total}</span>
      </div>
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-4 py-2">
        <span className="text-slate-400 text-sm">점수 </span>
        <span className="text-yellow-400 font-bold text-lg">{score}</span>
      </div>
    </div>
  );
}
