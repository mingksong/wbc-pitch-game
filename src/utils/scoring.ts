export interface GameScore {
  correct: number;
  total: number;
  percentage: number;
  grade: string;
  gradeEmoji: string;
  message: string;
}

export function calculateScore(correct: number, total: number): GameScore {
  const percentage = Math.round((correct / total) * 100);

  let grade: string;
  let gradeEmoji: string;
  let message: string;

  if (percentage === 100) {
    grade = 'PERFECT';
    gradeEmoji = '\u{1F3C6}';
    message = '퍼펙트! MLB 심판 수준';
  } else if (percentage >= 80) {
    grade = 'PRO';
    gradeEmoji = '\u2B50';
    message = '프로급 눈썰미';
  } else if (percentage >= 60) {
    grade = 'GOOD';
    gradeEmoji = '\u{1F44D}';
    message = '괜찮은 편';
  } else if (percentage >= 40) {
    grade = 'AMATEUR';
    gradeEmoji = '\u{1F605}';
    message = '아직 연습이 필요해요';
  } else {
    grade = 'ROOKIE';
    gradeEmoji = '\u{1F602}';
    message = '그래서 이게 쉬워보여?';
  }

  return { correct, total, percentage, grade, gradeEmoji, message };
}

export function buildShareText(score: GameScore, url: string): string {
  return [
    '\u{1F1F0}\u{1F1F7} You Think This Is Easy?',
    'WBC 2026 타자 챌린지',
    `내 점수: ${score.correct}/${score.total} (${score.percentage}점) ${score.gradeEmoji}`,
    '',
    `나도 도전하기 \u2192 ${url}`,
  ].join('\n');
}
