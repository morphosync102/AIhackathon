import { normalizeAnalysis, WORD_TYPES } from "./gameLogic.js";

const API_PATH = "/api/analyze-word";
const DEMO_AI_DELAY_MS = 920;
const USE_GEMINI_API = import.meta.env.VITE_USE_GEMINI_API !== "false";

export async function analyzeWord({ text, currentLevel, currentEnergy }) {
  const payload = {
    text,
    currentLevel,
    currentEnergy,
  };

  if (!USE_GEMINI_API) {
    console.info("Gemini API: 使ってない（VITE_USE_GEMINI_API=false）");
    await wait(DEMO_AI_DELAY_MS);
    return createDemoAiAnalysis(payload);
  }

  try {
    const response = await fetch(API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.source === "gemini") {
      console.info("Gemini API: 使ってる");
    } else {
      console.info("Gemini API: 使ってない（APIサーバーのフォールバック）", data.error || "");
    }
    return normalizeAnalysis(data);
  } catch (error) {
    console.info("Gemini API: 使ってない（デモAIで判定）", error?.message || "");
    await wait(DEMO_AI_DELAY_MS);
    return createDemoAiAnalysis(payload);
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createDemoAiAnalysis({ text, currentLevel, currentEnergy }) {
  const normalizedText = text.trim();
  const lowerText = normalizedText.toLowerCase();
  const type = pickType(normalizedText);
  const signals = collectSignals(lowerText, normalizedText);
  const lengthScore = Math.min(18, Math.floor(normalizedText.length / 3));
  const signalScore = signals.length * 6;
  const quietPenalty = normalizedText.length < 8 ? -10 : 0;
  const levelBonus = Math.min(8, Math.max(0, Number(currentLevel) - 1));
  const continuityBonus = Math.min(6, Math.floor((Number(currentEnergy) || 0) / 150));
  const energy = Math.min(
    50,
    Math.max(1, 9 + lengthScore + signalScore + quietPenalty + levelBonus + continuityBonus),
  );

  return normalizeAnalysis({
    summary: createSummary(normalizedText, type),
    energy,
    type,
    reason: createReason(type, signals, normalizedText),
    comment: createComment(type, energy),
    emotionScores: createEmotionScores(lowerText, normalizedText, type, energy),
  });
}

function collectSignals(lowerText, text) {
  const signals = [];

  if (/する|やる|始め|改善|計画|作る|試す|つなげ|届け|決め|進め|build|make|try/.test(lowerText)) {
    signals.push("行動");
  }

  if (/案|発想|考え|企画|アイデア|サービス|新しい|idea|concept/.test(lowerText)) {
    signals.push("発想");
  }

  if (/不安|怒|嬉|楽しい|迷|困|失敗|怖|焦|悩|好き|嫌/.test(lowerText)) {
    signals.push("感情");
  }

  if (text.length > 42 || /[,、].*[,、]/.test(text)) {
    signals.push("混沌");
  }

  return signals;
}

function pickType(text) {
  if (text.length < 8) {
    return "静寂";
  }

  if (/する|やる|始め|改善|計画|作る|試す|つなげ|届け|決め|進め/.test(text)) {
    return "行動";
  }

  if (/案|発想|考え|企画|アイデア|サービス|新しい/.test(text)) {
    return "発想";
  }

  if (/不安|怒|嬉|楽しい|迷|困|失敗|怖|焦|悩|好き|嫌/.test(text)) {
    return "感情";
  }

  return WORD_TYPES.includes("混沌") ? "混沌" : "混沌";
}

function createSummary(text, type) {
  if (!text) {
    return "静かな入力";
  }

  const trimmed = text.length > 30 ? `${text.slice(0, 30)}...` : text;
  return `${type}として強く反応: ${trimmed}`;
}

function createReason(type, signals, text) {
  if (text.length < 8) {
    return "短い入力なので、AIは静かな風として低めに判定しました";
  }

  const signalText = signals.length ? signals.join("・") : "言葉の流れ";
  return `デモAIが「${signalText}」の手がかりを検出し、${type}の風として分類しました`;
}

function createComment(type, energy) {
  if (energy >= 40) {
    return `${type}の風が強く吹き、タービンの成長を大きく進めました`;
  }

  if (energy >= 24) {
    return `${type}の風が安定して届き、タービンをしっかり回しました`;
  }

  return `${type}の小さな風が、タービンに少しずつ力を渡しました`;
}

function createEmotionScores(lowerText, text, type, energy) {
  const scores = {
    motivation: 18 + Math.floor(energy * 0.8),
    anger: 8,
    joy: type === "発想" ? 42 : 24,
    sadness: 10,
    love: 18,
    anxiety: type === "混沌" ? 36 : 14,
  };

  if (/やる|する|始め|進め|決め|挑戦|改善|作る|試す|届け/.test(lowerText)) {
    scores.motivation += 28;
  }

  if (/怒|嫌|むか|許せ/.test(lowerText)) {
    scores.anger += 48;
  }

  if (/嬉|楽しい|好き|よかった|成功|面白/.test(lowerText)) {
    scores.joy += 42;
  }

  if (/悲|失敗|つら|苦し|泣|落ち込/.test(lowerText)) {
    scores.sadness += 44;
  }

  if (/愛|大事|守|仲間|チーム|家族|好き|届け/.test(lowerText)) {
    scores.love += 42;
  }

  if (/不安|怖|焦|迷|困|悩|分からない|できない/.test(lowerText)) {
    scores.anxiety += 46;
  }

  if (text.length < 8) {
    scores.motivation = 12;
    scores.joy = 12;
    scores.anxiety = 18;
  }

  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [key, Math.min(100, Math.max(0, value))]),
  );
}
