import {
  analyzeWordWithGemini,
  createFallbackResponse,
  safeErrorMessage,
  toInteger,
} from "../src/server/geminiAnalysis.js";

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "POST で送信してください",
      },
    });
    return;
  }

  const body = parseBody(req.body);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const currentLevel = toInteger(body?.currentLevel, 1);
  const currentEnergy = toInteger(body?.currentEnergy, 0);

  if (!text) {
    res.status(400).json({
      error: {
        code: "EMPTY_TEXT",
        message: "言葉を入れるとタービンが回ります",
      },
    });
    return;
  }

  try {
    const analysis = await analyzeWordWithGemini({ text, currentLevel, currentEnergy });
    res.status(200).json(analysis);
  } catch (error) {
    console.warn("Gemini analysis failed; returning fallback.", safeErrorMessage(error));
    res.status(200).json(createFallbackResponse(text));
  }
}

function parseBody(body) {
  if (typeof body !== "string") {
    return body ?? {};
  }

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
