import "dotenv/config";
import express from "express";
import {
  analyzeWordWithGemini,
  createFallbackResponse,
  safeErrorMessage,
  toInteger,
} from "./src/server/geminiAnalysis.js";

const app = express();
const port = Number.parseInt(process.env.PORT || "3001", 10);

app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/analyze-word", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const currentLevel = toInteger(req.body?.currentLevel, 1);
  const currentEnergy = toInteger(req.body?.currentEnergy, 0);

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
    res.json(analysis);
  } catch (error) {
    console.warn("Gemini analysis failed; returning fallback.", safeErrorMessage(error));
    res.json(createFallbackResponse(text));
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "リクエストの形式を確認してください",
      },
    });
    return;
  }

  console.warn("Unhandled server error.", safeErrorMessage(error));
  res.status(500).json({
    error: {
      code: "SERVER_ERROR",
      message: "サーバーで問題が発生しました",
    },
  });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
