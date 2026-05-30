import { normalizeAnalysis, WORD_TYPES } from "./gameLogic.js";

const API_PATH = "/api/analyze-word";

export async function analyzeWord({ text, currentLevel, currentEnergy }) {
  const payload = {
    text,
    currentLevel,
    currentEnergy,
  };

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
    return normalizeAnalysis(data);
  } catch (error) {
    return createMockAnalysis(payload, error);
  }
}

function createMockAnalysis({ text, currentLevel, currentEnergy }, error) {
  const normalizedText = text.trim();
  const lowerText = normalizedText.toLowerCase();
  const lengthScore = Math.min(18, Math.floor(normalizedText.length / 3));
  const actionScore = /する|やる|始め|改善|計画|作る|試す|つなげ|届け|決め|進め|build|make|try/.test(
    lowerText,
  )
    ? 14
    : 0;
  const ideaScore = /案|発想|考え|企画|アイデア|新しい|サービス|idea|concept/.test(lowerText) ? 10 : 0;
  const emotionScore = /不安|怒|嬉|楽しい|迷|困|失敗|怖|焦|悩|悲しい/.test(lowerText) ? 8 : 0;
  const quietPenalty = normalizedText.length < 8 ? -10 : 0;
  const levelBonus = Math.min(6, Math.max(0, Number(currentLevel) - 1));
  const energy = Math.min(
    50,
    Math.max(1, 10 + lengthScore + actionScore + ideaScore + emotionScore + quietPenalty + levelBonus),
  );
  const type = pickType(normalizedText);
  const fallbackReason = error
    ? "API 応答がないため、ローカル判定で風量を見積もりました"
    : "言葉の長さと含まれる動きから風量を見積もりました";

  return normalizeAnalysis({
    summary:
      normalizedText.length > 34
        ? `${normalizedText.slice(0, 34)}...`
        : normalizedText || "短い言葉",
    energy,
    type,
    reason:
      normalizedText.length < 8
        ? "短い言葉なので、静かな風として扱いました"
        : fallbackReason,
    comment: `${type}の風がタービンを押しました`,
    currentEnergy,
  });
}

function pickType(text) {
  if (text.length < 8) {
    return "静寂";
  }

  if (/不安|怒|嬉|楽しい|迷|困|失敗|怖|焦|悩|悲しい/.test(text)) {
    return "感情";
  }

  if (/案|発想|考え|企画|アイデア|新しい|サービス/.test(text)) {
    return "発想";
  }

  if (/する|やる|始め|改善|計画|作る|試す|つなげ|決め|進め/.test(text)) {
    return "行動";
  }

  if (text.length > 40 || /[,、].*[,、]/.test(text)) {
    return "混沌";
  }

  return WORD_TYPES.includes("混沌") ? "混沌" : "混沌";
}
