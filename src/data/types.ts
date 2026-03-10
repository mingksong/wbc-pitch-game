export interface StrikeoutPitch {
  pitcher: string;
  pitcherHand: 'L' | 'R';
  batter: string;
  batSide: 'L' | 'R';
  pitchCode: string;
  pitchName: string;
  game: string;
  vX0: number; vY0: number; vZ0: number;
  aX: number; aY: number; aZ: number;
  x0: number; y0: number; z0: number;
  pX: number; pZ: number;
  szTop: number; szBot: number;
  startSpeed: number;
  endSpeed: number;
  plateTime: number;
  spinRate: number;
  callDesc: string;
  isStrike: boolean;
}

export type GameMode = 'wbc' | 'skubal' | 'skenes';
