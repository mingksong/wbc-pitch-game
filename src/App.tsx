import { useState, useCallback, useMemo } from 'react';
import { pitchData } from './data/korStrikeoutPitches';
import type { StrikeoutPitch } from './data/korStrikeoutPitches';
import { calculateScore } from './utils/scoring';
import GameIntro from './components/GameIntro';
import PitchScene from './components/PitchScene';
import Countdown from './components/Countdown';
import CallModal from './components/CallModal';
import PitchResult from './components/PitchResult';
import HUD from './components/HUD';
import GameResult from './components/GameResult';

type GamePhase = 'intro' | 'countdown' | 'pitching' | 'calling' | 'result' | 'final';

const TOTAL_PITCHES = 10;

function selectRandomPitches(data: StrikeoutPitch[], count: number): StrikeoutPitch[] {
  // Prefer variety: mix strikeouts and borderline, mix games, mix strike/ball
  const shuffled = [...data].sort(() => Math.random() - 0.5);

  // Ensure roughly half strikes, half balls
  const strikes = shuffled.filter(p => p.isStrike);
  const balls = shuffled.filter(p => !p.isStrike);

  const halfCount = Math.floor(count / 2);
  const selected: StrikeoutPitch[] = [
    ...strikes.slice(0, halfCount),
    ...balls.slice(0, count - halfCount),
  ];

  // If not enough of either, fill from the other
  while (selected.length < count && shuffled.length > 0) {
    const next = shuffled.find(p => !selected.includes(p));
    if (next) selected.push(next);
    else break;
  }

  // Shuffle final selection
  return selected.sort(() => Math.random() - 0.5);
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [pitches, setPitches] = useState<StrikeoutPitch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastCall, setLastCall] = useState<'strike' | 'ball' | null>(null);
  const [lastCorrect, setLastCorrect] = useState(false);

  const currentPitch = pitches[currentIndex] ?? null;

  const startGame = useCallback(() => {
    const selected = selectRandomPitches(pitchData, TOTAL_PITCHES);
    setPitches(selected);
    setCurrentIndex(0);
    setCorrectCount(0);
    setLastCall(null);
    setPhase('countdown');
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setPhase('pitching');
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setPhase('calling');
  }, []);

  const handleCall = useCallback((call: 'strike' | 'ball') => {
    if (!currentPitch) return;
    const correct = (call === 'strike') === currentPitch.isStrike;
    setLastCall(call);
    setLastCorrect(correct);
    if (correct) setCorrectCount(prev => prev + 1);
    setPhase('result');
  }, [currentPitch]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= TOTAL_PITCHES) {
      setPhase('final');
    } else {
      setCurrentIndex(prev => prev + 1);
      setLastCall(null);
      setPhase('countdown');
    }
  }, [currentIndex]);

  const finalScore = useMemo(
    () => calculateScore(correctCount, TOTAL_PITCHES),
    [correctCount]
  );

  if (phase === 'intro') {
    return <GameIntro onStart={startGame} />;
  }

  if (phase === 'final') {
    return <GameResult score={finalScore} onRestart={startGame} />;
  }

  if (!currentPitch) return null;

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* 3D Scene - always rendered during gameplay */}
      <PitchScene
        pitch={currentPitch}
        isAnimating={phase === 'pitching'}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* HUD overlay */}
      <HUD
        current={currentIndex + 1}
        total={TOTAL_PITCHES}
        score={correctCount * 10}
      />

      {/* Phase overlays */}
      {phase === 'countdown' && (
        <Countdown onComplete={handleCountdownComplete} />
      )}

      {phase === 'calling' && (
        <CallModal onCall={handleCall} />
      )}

      {phase === 'result' && lastCall && (
        <PitchResult
          pitch={currentPitch}
          userCall={lastCall}
          isCorrect={lastCorrect}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
