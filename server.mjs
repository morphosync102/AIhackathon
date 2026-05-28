import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const envSources = {};
loadEnvFile(".env");
loadEnvFile(".env.local");

const port = Number(process.env.PORT || 8787);
const distDir = resolve("dist");
const logDir = resolve("logs");
const logFile = join(logDir, "app.log");
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";
let geminiCooldownUntil = 0;
let lastGeminiError = null;

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
      envSources[key] = path;
    }
  }
}

function redact(value) {
  return String(value || "").replace(
    /(GEMINI_API_KEY|GOOGLE_API_KEY|x-goog-api-key)["':=\s]+[^"',\s}]+/gi,
    "$1=[redacted]",
  );
}

async function logEvent(level, message, meta = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = `${JSON.stringify(entry, (_key, value) =>
    typeof value === "string" ? redact(value) : value,
  )}\n`;

  try {
    await mkdir(logDir, { recursive: true });
    await appendFile(logFile, line, "utf8");
  } catch {
    // Logging must never break the demo.
  }

  const consoleLine = `[${entry.level}] ${entry.message}`;
  if (level === "error") console.error(consoleLine);
  else console.log(consoleLine);
}

function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request, maxLength = 12000) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > maxLength) {
      throw new Error("Request body is too large");
    }
  }
  return JSON.parse(raw || "{}");
}

function buildPrompt(text) {
  return `
あなたは短時間ハッカソンの審査員向けデモを支援するAIです。
入力された課題メモを、3分デモで見せやすい構造化JSONにしてください。

必ず次のJSONだけを返してください。
{
  "theme": "20文字以内の推定テーマ",
  "summary": "1文の要約",
  "insight": "AIが見つけた洞察を1文",
  "actions": ["次に取る具体策1", "具体策2", "具体策3"],
  "risks": ["注意点1", "注意点2"],
  "score": 0から100の整数,
  "reasoning": "スコアの理由を短く"
}

課題メモ:
${text}
`.trim();
}

function parseGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("").trim();
}

function safeParseJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function validateAnalysis(payload) {
  return {
    theme: String(payload.theme || "課題整理"),
    summary: String(payload.summary || ""),
    insight: String(payload.insight || payload.reasoning || ""),
    actions: Array.isArray(payload.actions)
      ? payload.actions.map(String).slice(0, 4)
      : [],
    risks: Array.isArray(payload.risks) ? payload.risks.map(String).slice(0, 3) : [],
    score: Math.max(0, Math.min(100, Number.parseInt(payload.score, 10) || 50)),
    reasoning: String(payload.reasoning || ""),
    provider: "gemini",
  };
}

function getKeyDiagnostics() {
  if (!apiKey) {
    return {
      hasApiKey: false,
      apiKeySource: null,
      keyLength: 0,
      keyFingerprint: null,
      looksLikeAiStudioKey: false,
    };
  }

  return {
    hasApiKey: true,
    apiKeySource: process.env.GEMINI_API_KEY
      ? envSources.GEMINI_API_KEY || "process:GEMINI_API_KEY"
      : envSources.GOOGLE_API_KEY || "process:GOOGLE_API_KEY",
    keyLength: apiKey.length,
    keyFingerprint: createHash("sha256").update(apiKey).digest("hex").slice(0, 10),
    looksLikeAiStudioKey: apiKey.startsWith("AIza"),
  };
}

function createGeminiError(status, detail) {
  let publicMessage = "Gemini API request failed";
  let quota = null;

  try {
    const payload = JSON.parse(detail);
    const reason = payload?.error?.status || payload?.error?.message || "";
    quota = payload?.error?.details?.find((detailItem) =>
      detailItem?.["@type"]?.includes("google.rpc.ErrorInfo"),
    )?.metadata;
    if (status === 429 || reason.includes("RESOURCE_EXHAUSTED")) {
      publicMessage =
        "Gemini API is returning a project quota block";
    } else if (status === 400) {
      publicMessage = "Gemini API rejected the request";
    } else if (status === 403) {
      publicMessage = "Gemini API key does not have access";
    }
  } catch {
    if (status === 429) {
      publicMessage =
        "Gemini API generation is not available for this key or project";
    }
  }

  const error = new Error(publicMessage);
  error.status = status === 429 ? 429 : 502;
  error.detail = detail;
  error.quota = quota;
  return error;
}

async function analyzeWithGemini(text) {
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  if (Date.now() < geminiCooldownUntil) {
    const error = new Error("Gemini API is temporarily paused after a quota response");
    error.status = 429;
    error.quota = lastGeminiError?.quota;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    await logEvent("info", "Calling Gemini API", {
      model,
      inputLength: text.length,
      ...getKeyDiagnostics(),
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(text) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      const error = createGeminiError(response.status, detail);
      if (error.status === 429) {
        geminiCooldownUntil = Date.now() + 60_000;
        lastGeminiError = {
          time: new Date().toISOString(),
          message: error.message,
          quota: error.quota,
        };
      }
      throw error;
    }

    const data = await response.json();
    const textResponse = parseGeminiText(data);
    const analysis = validateAnalysis(safeParseJson(textResponse));
    await logEvent("info", "Gemini API analysis completed", {
      model,
      score: analysis.score,
    });
    return analysis;
  } finally {
    clearTimeout(timeout);
  }
}

function buildAgePrompt() {
  return `
あなたは顔画像を使った年齢当てゲームの審判です。
画像内の人物の見た目年齢を、本人確認や個人特定はせず、娯楽用の推定として返してください。

必ず次のJSONだけを返してください。
{
  "estimatedAge": 0から100の整数、顔が不明な場合はnull,
  "ageRange": "例: 24-30",
  "confidence": "low" | "medium" | "high",
  "observations": ["年齢推定に使った見た目の手がかりを短く", "手がかり2"],
  "tip": "ゲームとして一言コメント",
  "noFace": trueまたはfalse
}

注意:
- 実年齢ではなく見た目年齢の推定です。
- 個人名、身元、属性の断定はしないでください。
- 顔がはっきり見えない場合は noFace を true にしてください。
`.trim();
}

function validateAgeGuess(payload) {
  const estimatedAge =
    payload.estimatedAge === null || payload.noFace
      ? null
      : Math.max(0, Math.min(100, Number.parseInt(payload.estimatedAge, 10) || 0));

  return {
    estimatedAge,
    ageRange: String(payload.ageRange || ""),
    confidence: ["low", "medium", "high"].includes(payload.confidence)
      ? payload.confidence
      : "medium",
    observations: Array.isArray(payload.observations)
      ? payload.observations.map(String).slice(0, 3)
      : [],
    tip: String(payload.tip || ""),
    noFace: Boolean(payload.noFace || estimatedAge === null),
    provider: "gemini",
  };
}

async function analyzeAgeImage({ mimeType, imageData }) {
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  if (Date.now() < geminiCooldownUntil) {
    const error = new Error("Gemini API is temporarily paused after a quota response");
    error.status = 429;
    error.quota = lastGeminiError?.quota;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    await logEvent("info", "Calling Gemini age guess API", {
      model,
      mimeType,
      imageBytesApprox: Math.round((imageData.length * 3) / 4),
      ...getKeyDiagnostics(),
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: buildAgePrompt() },
                { inlineData: { mimeType, data: imageData } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      const error = createGeminiError(response.status, detail);
      if (error.status === 429) {
        geminiCooldownUntil = Date.now() + 60_000;
        lastGeminiError = {
          time: new Date().toISOString(),
          message: error.message,
          quota: error.quota,
        };
      }
      throw error;
    }

    const data = await response.json();
    const textResponse = parseGeminiText(data);
    const ageGuess = validateAgeGuess(safeParseJson(textResponse));
    await logEvent("info", "Gemini age guess completed", {
      model,
      estimatedAge: ageGuess.estimatedAge,
      confidence: ageGuess.confidence,
      noFace: ageGuess.noFace,
    });
    return ageGuess;
  } finally {
    clearTimeout(timeout);
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(distDir, pathname);
  const target = existsSync(filePath) ? filePath : join(distDir, "index.html");
  const contentType =
    {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
    }[extname(target)] || "application/octet-stream";

  try {
    const file = await readFile(target);
    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found. Run npm.cmd run build before npm.cmd start.");
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, jsonHeaders);
    response.end();
    return;
  }

  if (request.url === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      provider: "gemini",
      model,
      ...getKeyDiagnostics(),
      cooldownSeconds: Math.max(0, Math.ceil((geminiCooldownUntil - Date.now()) / 1000)),
      lastGeminiError,
      logFile,
    });
    return;
  }

  if (request.url === "/api/analyze" && request.method === "POST") {
    try {
      const body = await readJsonBody(request);
      const text = String(body.text || "").trim();

      if (text.length < 20) {
        sendJson(response, 400, { error: "Text must be at least 20 characters" });
        return;
      }

      sendJson(response, 200, await analyzeWithGemini(text));
    } catch (error) {
      await logEvent("error", "Analyze request failed", {
        status: error.status || 500,
        error: error.message,
        quota: error.quota,
        detail: error.detail,
      });
      sendJson(response, error.status || 500, {
        error: error.message,
        quota: error.quota,
      });
    }
    return;
  }

  if (request.url === "/api/age-guess" && request.method === "POST") {
    try {
      const body = await readJsonBody(request, 8_000_000);
      const mimeType = String(body.mimeType || "");
      const imageData = String(body.imageData || "");

      if (!/^image\/(png|jpeg|webp)$/.test(mimeType)) {
        sendJson(response, 400, { error: "Use a PNG, JPEG, or WebP image" });
        return;
      }

      if (!imageData || imageData.length > 7_500_000) {
        sendJson(response, 400, { error: "Image is missing or too large" });
        return;
      }

      sendJson(response, 200, await analyzeAgeImage({ mimeType, imageData }));
    } catch (error) {
      await logEvent("error", "Age guess request failed", {
        status: error.status || 500,
        error: error.message,
        quota: error.quota,
        detail: error.detail,
      });
      sendJson(response, error.status || 500, {
        error: error.message,
        quota: error.quota,
      });
    }
    return;
  }

  if (request.url === "/api/client-log" && request.method === "POST") {
    try {
      const body = await readJsonBody(request, 20000);
      await logEvent("info", "Client event", {
        event: String(body.event || "unknown"),
        detail: body.detail && typeof body.detail === "object" ? body.detail : {},
      });
      sendJson(response, 200, { ok: true });
    } catch (error) {
      await logEvent("error", "Client log failed", {
        error: error.message,
      });
      sendJson(response, 500, { error: "Client log failed" });
    }
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, "127.0.0.1", async () => {
  await logEvent("info", "API server started", {
    url: `http://127.0.0.1:${port}`,
    model,
    ...getKeyDiagnostics(),
    logFile,
  });
  console.log(`API server running at http://127.0.0.1:${port}`);
  console.log(`Gemini model: ${model}`);
  console.log(`Log file: ${logFile}`);
});
