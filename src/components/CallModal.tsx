interface CallModalProps {
  onCall: (call: 'strike' | 'ball') => void;
}

export default function CallModal({ onCall }: CallModalProps) {
  return (
    <div className="absolute inset-0 flex items-end justify-center z-20 pb-16 sm:pb-24">
      <div className="flex gap-6">
        <button
          onClick={() => onCall('strike')}
          className="px-8 py-5 bg-red-600 hover:bg-red-500 text-white text-2xl font-bold rounded-2xl transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/40 min-w-[140px]"
        >
          Strike!
        </button>
        <button
          onClick={() => onCall('ball')}
          className="px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold rounded-2xl transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/40 min-w-[140px]"
        >
          Ball!
        </button>
      </div>
    </div>
  );
}
