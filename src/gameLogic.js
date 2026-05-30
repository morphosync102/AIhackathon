export const WORD_TYPES = ["発想", "感情", "行動", "混沌", "静寂"];

export const MAX_LEVEL = 20;

export const LEVEL_THRESHOLDS = Array.from({ length: MAX_LEVEL }, (_, index) => {
  const level = index + 1;

  if (level === 1) {
    return { level, energy: 0 };
  }

  return {
    level,
    energy: Math.round(42 * (level - 1) + 18 * (level - 1) ** 1.72),
  };
});

export const SHOP_CATALOG = [
  {
    id: "small-generator",
    name: "小型発電機",
    description: "回転を安定させる",
    baseCost: 40,
    rpmBoost: 12,
  },
  {
    id: "relay-coil",
    name: "中継コイル",
    description: "風の勢いを保つ",
    baseCost: 120,
    rpmBoost: 36,
  },
  {
    id: "power-tower",
    name: "送電塔",
    description: "広い範囲へ電気を送る",
    baseCost: 320,
    rpmBoost: 95,
  },
];

export const INITIAL_GAME_STATE = {
  level: 1,
  totalEnergy: 0,
  currentRpm: 0,
  shopItems: {},
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
  };
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

export function calculateRpmGain(analysis) {
  return clampEnergy(analysis?.energy) * 2;
}

export function getShopItemCost(item, owned = 0) {
  return Math.ceil(item.baseCost * 1.35 ** owned);
}

export function getShopItems(state) {
  const ownedItems = state?.shopItems || {};

  return SHOP_CATALOG.map((item) => {
    const owned = Math.max(0, Number(ownedItems[item.id]) || 0);
    const cost = getShopItemCost(item, owned);

    return {
      ...item,
      owned,
      cost,
      canBuy: (Number(state?.currentRpm) || 0) >= cost,
    };
  });
}

export function buyShopItem(state, itemId) {
  const item = SHOP_CATALOG.find((candidate) => candidate.id === itemId);

  if (!item) {
    return state;
  }

  const owned = Math.max(0, Number(state.shopItems?.[itemId]) || 0);
  const cost = getShopItemCost(item, owned);
  const currentRpm = Number(state.currentRpm) || 0;

  if (currentRpm < cost) {
    return state;
  }

  return {
    ...state,
    currentRpm: currentRpm - cost + item.rpmBoost,
    shopItems: {
      ...state.shopItems,
      [itemId]: owned + 1,
    },
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
    currentRpm: (Number(state.currentRpm) || 0) + calculateRpmGain(analysis),
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
