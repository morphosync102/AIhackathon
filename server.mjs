import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const port = Number(process.env.PORT || 8787);
const distDir = resolve("dist");
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sendJson(response, status, payload) {
  response.writeHead(status, jsonHeaders);
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 12000) {
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

async function analyzeWithGemini(text) {
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY is not configured");
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
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
      const error = new Error(`Gemini API error: ${response.status} ${detail}`);
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const textResponse = parseGeminiText(data);
    return validateAnalysis(safeParseJson(textResponse));
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
    sendJson(response, 200, { ok: true, provider: "gemini", model });
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
      console.error(error.message);
      sendJson(response, error.status || 500, { error: error.message });
    }
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`API server running at http://127.0.0.1:${port}`);
  console.log(`Gemini model: ${model}`);
});
