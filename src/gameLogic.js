export const WORD_TYPES = ["発想", "感情", "行動", "混沌", "静寂"];
export const EMOTION_KEYS = ["motivation", "anger", "joy", "sadness", "love", "anxiety"];

const DEFAULT_EMOTION_SCORES = {
  motivation: 20,
  anger: 5,
  joy: 20,
  sadness: 8,
  love: 15,
  anxiety: 12,
};

export const MAX_LEVEL = 10;

export const LEVEL_THRESHOLDS = [
  { level: 1, energy: 0 },
  { level: 2, energy: 40 },
  { level: 3, energy: 90 },
  { level: 4, energy: 150 },
  { level: 5, energy: 230 },
  { level: 6, energy: 330 },
  { level: 7, energy: 450 },
  { level: 8, energy: 590 },
  { level: 9, energy: 750 },
  { level: 10, energy: 930 },
];

export const INITIAL_GAME_STATE = {
  level: 1,
  totalEnergy: 0,
  lastAnalysis: null,
  history: [],
};

export function clampEnergy(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(50, Math.max(1, Math.round(number)));
}

export function normalizeAnalysis(response) {
  const type = WORD_TYPES.includes(response?.type) ? response.type : "混沌";

  return {
    summary: String(response?.summary || "言葉の流れを受け取りました"),
    energy: clampEnergy(response?.energy),
    type,
    reason: String(response?.reason || "言葉に含まれる動きから判定しました"),
    comment: String(response?.comment || "風がタービンに届きました"),
    emotionScores: normalizeEmotionScores(response?.emotionScores),
  };
}

function normalizeEmotionScores(scores) {
  return EMOTION_KEYS.reduce((normalized, key) => {
    const value = Number(scores?.[key]);
    normalized[key] = Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round(value)))
      : DEFAULT_EMOTION_SCORES[key];
    return normalized;
  }, {});
}

export function getLevelForEnergy(totalEnergy) {
  const safeEnergy = Math.max(0, Number(totalEnergy) || 0);
  const reached = LEVEL_THRESHOLDS.filter(({ energy }) => safeEnergy >= energy);

  return reached.at(-1)?.level || 1;
}

export function getNextLevelProgress(totalEnergy) {
  const level = getLevelForEnergy(totalEnergy);

  if (level >= MAX_LEVEL) {
    return {
      level,
      currentFloor: LEVEL_THRESHOLDS.at(-1).energy,
      nextThreshold: null,
      remaining: 0,
      progress: 100,
    };
  }

  const currentFloor = LEVEL_THRESHOLDS[level - 1].energy;
  const nextThreshold = LEVEL_THRESHOLDS[level].energy;
  const progress =
    ((Math.max(0, totalEnergy - currentFloor) /
      (nextThreshold - currentFloor)) *
      100) ||
    0;

  return {
    level,
    currentFloor,
    nextThreshold,
    remaining: Math.max(0, nextThreshold - totalEnergy),
    progress: Math.min(100, Math.max(0, Math.round(progress))),
  };
}

export function applyWordAnalysis(state, text, response) {
  const analysis = normalizeAnalysis(response);
  const totalEnergy = state.totalEnergy + analysis.energy;
  const level = getLevelForEnergy(totalEnergy);

  return {
    ...state,
    level,
    totalEnergy,
    lastAnalysis: analysis,
    history: [
      {
        id: `${Date.now()}-${state.history.length}`,
        text,
        ...analysis,
      },
      ...state.history,
    ].slice(0, 5),
  };
}
