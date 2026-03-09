/** Baseball Savant pitch type colors */
const PITCH_COLORS: Record<string, string> = {
  FF: '#FF0000',  // 4-Seam Fastball
  SI: '#F57C00',  // Sinker
  FC: '#E91E63',  // Cutter
  SL: '#FFC107',  // Slider
  ST: '#FFD600',  // Sweeper
  CU: '#2196F3',  // Curveball
  KC: '#42A5F5',  // Knuckle Curve
  CH: '#4CAF50',  // Changeup
  FS: '#66BB6A',  // Splitter
  KN: '#9C27B0',  // Knuckleball
  EP: '#7B1FA2',  // Eephus
  SC: '#FF5722',  // Screwball
  SV: '#FFD600',  // Slurve
  UN: '#9E9E9E',  // Unknown
};

export function getPitchColor(code: string): string {
  return PITCH_COLORS[code] || PITCH_COLORS.UN;
}

/** Korean pitch type names */
const PITCH_NAMES_KO: Record<string, string> = {
  FF: '포심 패스트볼',
  SI: '싱커',
  FC: '커터',
  SL: '슬라이더',
  ST: '스위퍼',
  CU: '커브',
  KC: '너클커브',
  CH: '체인지업',
  FS: '스플리터',
  KN: '너클볼',
  EP: '이퍼스',
  SC: '스크루볼',
  SV: '슬러브',
  UN: '알 수 없음',
};

export function getPitchNameKo(code: string): string {
  return PITCH_NAMES_KO[code] || code;
}
