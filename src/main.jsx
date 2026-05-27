import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import "./styles.css";

const samples = [
  {
    title: "地域イベントの改善",
    text: "商店街の週末イベントに若い来場者が少ない。SNS告知はしているが、当日の回遊と購買につながっていない。",
  },
  {
    title: "学習計画の整理",
    text: "資格試験まで残り4週間。教材は揃っているが、仕事後に何から手を付ければよいか迷って進捗が止まっている。",
  },
  {
    title: "社内問い合わせ削減",
    text: "総務への同じ質問が毎日届く。FAQはあるが読まれず、担当者の対応時間が増えて本来業務を圧迫している。",
  },
];

function createFallbackAnalysis(text) {
  const trimmed = text.trim();
  const lengthScore = Math.min(32, Math.floor(trimmed.length / 4));
  const urgency =
    /残り|毎日|少ない|止ま|圧迫|困|不安|急/.test(trimmed) ? 28 : 18;
  const actionability =
    /何|どう|改善|削減|計画|購買|進捗/.test(trimmed) ? 30 : 20;
  const score = Math.min(96, 28 + lengthScore + urgency + actionability);

  const theme = trimmed.includes("イベント")
    ? "来場者の行動を小さく変える体験設計"
    : trimmed.includes("試験") || trimmed.includes("学習")
      ? "迷いを減らす短期集中プラン"
      : trimmed.includes("問い合わせ") || trimmed.includes("FAQ")
        ? "繰り返し対応を減らす自己解決導線"
        : "課題を行動に変える意思決定支援";

  return {
    score,
    theme,
    summary: "Gemini API が使えない場合のデモ用フォールバック結果です。",
    insight:
      "課題は情報不足よりも、次の一歩が見えにくいことにあります。AIは状況を分解し、判断理由つきで優先順位を提示できます。",
    actions: [
      "入力内容を目的・制約・利用者の3要素に分けて整理する",
      "最初の24時間で試せる小さな施策を1つ選ぶ",
      "結果を見て、継続・修正・中止の判断基準を決める",
    ],
    risks: [
      "利用者の前提が違うと提案の精度が下がる",
      "効果測定の指標がないと改善判断が曖昧になる",
    ],
    provider: "fallback",
  };
}

function normalizeResult(payload, fallback) {
  return {
    score: Number.isFinite(payload?.score) ? payload.score : fallback.score,
    theme: payload?.theme || fallback.theme,
    summary: payload?.summary || fallback.summary,
    insight: payload?.insight || payload?.reasoning || fallback.insight,
    actions: Array.isArray(payload?.actions) && payload.actions.length
      ? payload.actions.slice(0, 4)
      : fallback.actions,
    risks: Array.isArray(payload?.risks) && payload.risks.length
      ? payload.risks.slice(0, 3)
      : fallback.risks,
    provider: payload?.provider || "gemini",
  };
}

async function requestAnalysis(text) {
  const fallback = createFallbackAnalysis(text);

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const message = await response.text();
    let errorMessage = message || "AI analysis failed";
    try {
      const payload = JSON.parse(message);
      errorMessage = payload.error || errorMessage;
    } catch {
      // Keep the plain response text when the server did not return JSON.
    }
    throw new Error(errorMessage);
  }

  const payload = await response.json();
  return normalizeResult(payload, fallback);
}

function App() {
  const [input, setInput] = useState(samples[0].text);
  const [result, setResult] = useState(() =>
    createFallbackAnalysis(samples[0].text),
  );
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const canAnalyze = input.trim().length >= 20 && status !== "loading";
  const charCount = useMemo(() => input.trim().length, [input]);

  async function runDemo() {
    if (!canAnalyze) {
      setStatus("error");
      setErrorMessage("20文字以上の課題メモを入力してください。");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const nextResult = await requestAnalysis(input);
      setResult(nextResult);
      setStatus("ready");
    } catch (error) {
      setResult(createFallbackAnalysis(input));
      setErrorMessage(
        error.message.includes("GEMINI_API_KEY")
          ? "GEMINI_API_KEY が未設定のため、デモ用結果を表示しています。"
          : error.message.includes("quota")
            ? "Gemini API の利用上限に達しているため、デモ用結果を表示しています。"
          : "Gemini API に接続できないため、デモ用結果を表示しています。",
      );
      setStatus("degraded");
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <aside className="side-panel" aria-label="Demo controls">
          <div className="brand">
            <span className="brand-mark">
              <BrainCircuit size={22} />
            </span>
            <div>
              <p>AI Hackathon</p>
              <h1>Insight Sprint</h1>
            </div>
          </div>

          <div className="sample-list">
            <p className="label">Sample</p>
            {samples.map((sample) => (
              <button
                className="sample-button"
                key={sample.title}
                type="button"
                onClick={() => {
                  setInput(sample.text);
                  setResult(createFallbackAnalysis(sample.text));
                  setErrorMessage("");
                  setStatus("ready");
                }}
              >
                <ClipboardList size={17} />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="input-panel">
          <div className="panel-heading">
            <div>
              <p className="label">Input</p>
              <h2>課題メモを Gemini に渡す</h2>
            </div>
            <span className="counter">{charCount} chars</span>
          </div>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="課題、対象ユーザー、困っている状況を入力してください。"
          />

          {(status === "error" || status === "degraded") && (
            <div className={`notice ${status === "error" ? "error" : "warn"}`}>
              <AlertTriangle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button className="primary-action" onClick={runDemo} type="button">
            {status === "loading" ? (
              <Loader2 className="spin" size={19} />
            ) : (
              <WandSparkles size={19} />
            )}
            <span>{status === "loading" ? "分析中" : "Geminiで分析"}</span>
            <ArrowRight size={18} />
          </button>
        </section>

        <section className="result-panel" aria-live="polite">
          <div className="panel-heading">
            <div>
              <p className="label">AI Output</p>
              <h2>3分デモ用の構造化結果</h2>
            </div>
            <div className="score">
              <Sparkles size={18} />
              <strong>{result.score}</strong>
            </div>
          </div>

          <div className={status === "loading" ? "result loading" : "result"}>
            <div className="theme-row">
              <CheckCircle2 size={20} />
              <div>
                <p>{result.provider === "gemini" ? "Gemini 推定テーマ" : "デモ推定テーマ"}</p>
                <h3>{result.theme}</h3>
              </div>
            </div>

            <div className="insight-box">
              <p>{result.insight}</p>
            </div>

            <div className="columns">
              <div>
                <h4>次のアクション</h4>
                <ol>
                  {result.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h4>リスク</h4>
                <ul>
                  {result.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
