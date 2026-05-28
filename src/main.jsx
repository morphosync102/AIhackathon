import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  Loader2,
  Sparkles,
  Trophy,
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

async function readError(response) {
  const message = await response.text();
  let errorMessage = message || "Request failed";
  try {
    const payload = JSON.parse(message);
    errorMessage = payload.error || errorMessage;
  } catch {
    // Keep plain text errors.
  }
  return errorMessage;
}

async function requestAnalysis(text) {
  const fallback = createFallbackAnalysis(text);
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload = await response.json();
  return normalizeResult(payload, fallback);
}

function fileToImagePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const [, imageData = ""] = dataUrl.split(",");
      resolve({ dataUrl, imageData, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

async function requestAgeGuess(image) {
  const response = await fetch("/api/age-guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType: image.mimeType,
      imageData: image.imageData,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

function logClientEvent(event, detail = {}) {
  fetch("/api/client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, detail }),
  }).catch(() => {
    // Client-side logging must not interrupt the game.
  });
}

function waitForVideoElement(videoRef) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (videoRef.current) {
        resolve(videoRef.current);
        return;
      }

      if (Date.now() - startedAt > 2000) {
        resolve(null);
        return;
      }

      window.requestAnimationFrame(tick);
    };
    tick();
  });
}

function waitForVideoReady(video) {
  return new Promise((resolve) => {
    if (video.videoWidth && video.videoHeight) {
      resolve(true);
      return;
    }

    const timeout = window.setTimeout(() => resolve(false), 5000);
    const done = () => {
      window.clearTimeout(timeout);
      resolve(Boolean(video.videoWidth && video.videoHeight));
    };

    video.addEventListener("loadedmetadata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
  });
}

function App() {
  const [mode, setMode] = useState("insight");
  const [input, setInput] = useState(samples[0].text);
  const [result, setResult] = useState(() =>
    createFallbackAnalysis(samples[0].text),
  );
  const [status, setStatus] = useState("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const [image, setImage] = useState(null);
  const [userAge, setUserAge] = useState("");
  const [ageStatus, setAgeStatus] = useState("idle");
  const [ageError, setAgeError] = useState("");
  const [ageResult, setAgeResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const canAnalyze = input.trim().length >= 20 && status !== "loading";
  const charCount = useMemo(() => input.trim().length, [input]);
  const ageDiff =
    ageResult?.estimatedAge != null && userAge
      ? Math.abs(Number(userAge) - ageResult.estimatedAge)
      : null;

  function stopCamera() {
    if (streamRef.current) {
      logClientEvent("camera.stop");
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setCameraStatus("idle");
    setCameraReady(false);
  }

  useEffect(() => {
    if (mode !== "age") stopCamera();
    return () => stopCamera();
  }, [mode]);

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
          : error.message.includes("quota") ||
              error.message.includes("temporarily paused")
            ? "Google側がこのプロジェクトの生成APIをquota 0として返しているため、デモ用結果を表示しています。"
            : "Gemini API に接続できないため、デモ用結果を表示しています。",
      );
      setStatus("degraded");
    }
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAgeError("PNG、JPEG、WebP の画像を選んでください。");
      return;
    }

    if (file.size > 5_000_000) {
      setAgeError("画像は5MB以下にしてください。");
      return;
    }

    try {
      setAgeError("");
      setAgeResult(null);
      stopCamera();
      setImage(await fileToImagePayload(file));
    } catch (error) {
      setAgeError(error.message);
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setAgeError("このブラウザではカメラを使用できません。");
      return;
    }

    try {
      setAgeError("");
      setAgeResult(null);
      setCameraStatus("starting");
      setCameraReady(false);
      setCameraActive(true);
      logClientEvent("camera.start.request");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      const video = await waitForVideoElement(videoRef);
      logClientEvent("camera.start.success", {
        tracks: stream.getVideoTracks().map((track) => ({
          label: track.label,
          readyState: track.readyState,
        })),
        hasVideoElement: Boolean(video),
      });

      if (!video) {
        throw new Error("Video element was not ready");
      }

      video.srcObject = stream;
      await video.play();
      const ready = await waitForVideoReady(video);
      if (!ready) {
        throw new Error("Camera video metadata timed out");
      }

      setCameraReady(true);
      setCameraActive(true);
      setCameraStatus("ready");
      logClientEvent("camera.video.ready", {
        ready: true,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
    } catch {
      stopCamera();
      logClientEvent("camera.start.error");
      setAgeError("カメラを開始できませんでした。ブラウザの許可を確認してください。");
    }
  }

  function captureCamera() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      logClientEvent("camera.capture.not_ready", {
        hasVideo: Boolean(video),
        videoWidth: video?.videoWidth || 0,
        videoHeight: video?.videoHeight || 0,
        cameraReady,
        cameraStatus,
      });
      setAgeError("カメラ映像の準備がまだできていません。");
      return;
    }

    logClientEvent("camera.capture.success", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const [, imageData = ""] = dataUrl.split(",");
    setImage({ dataUrl, imageData, mimeType: "image/jpeg" });
    setAgeResult(null);
    setAgeError("");
    stopCamera();
  }

  async function runAgeGame() {
    if (!image) {
      setAgeError("顔が写っている画像を選んでください。");
      return;
    }

    if (!userAge || Number(userAge) < 0 || Number(userAge) > 100) {
      setAgeError("あなたの予想年齢を0から100で入力してください。");
      return;
    }

    setAgeStatus("loading");
    setAgeError("");

    try {
      setAgeResult(await requestAgeGuess(image));
      setAgeStatus("ready");
    } catch (error) {
      setAgeError(
        error.message.includes("GEMINI_API_KEY")
          ? "GEMINI_API_KEY が未設定です。"
          : error.message.includes("quota") ||
              error.message.includes("temporarily paused")
            ? "Google側の生成API制限により、年齢判定を実行できません。"
            : "画像の年齢判定に失敗しました。",
      );
      setAgeStatus("error");
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
              <h1>{mode === "insight" ? "Insight Sprint" : "Age Guess"}</h1>
            </div>
          </div>

          <div className="sample-list">
            <p className="label">Mode</p>
            <button
              className={`sample-button ${mode === "insight" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("insight")}
            >
              <ClipboardList size={17} />
              <span>課題分析</span>
            </button>
            <button
              className={`sample-button ${mode === "age" ? "active" : ""}`}
              type="button"
              onClick={() => setMode("age")}
            >
              <ImagePlus size={17} />
              <span>顔年齢ゲーム</span>
            </button>
          </div>

          {mode === "insight" && (
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
          )}
        </aside>

        {mode === "insight" ? (
          <>
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
                    <p>
                      {result.provider === "gemini"
                        ? "Gemini 推定テーマ"
                        : "デモ推定テーマ"}
                    </p>
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
          </>
        ) : (
          <>
            <section className="input-panel age-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Image Game</p>
                  <h2>顔画像の見た目年齢を当てる</h2>
                </div>
              </div>

              <label className="upload-zone">
                <input
                  accept="image/png,image/jpeg,image/webp"
                  type="file"
                  onChange={handleImageChange}
                />
                {image ? (
                  <img alt="選択した顔画像" src={image.dataUrl} />
                ) : (
                  <span>
                    <ImagePlus size={28} />
                    画像を選択
                  </span>
                )}
              </label>

              <div className="camera-actions">
                <button
                  className="secondary-action"
                  onClick={cameraActive ? stopCamera : startCamera}
                  type="button"
                >
                  {cameraStatus === "starting" ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <ImagePlus size={18} />
                  )}
                  <span>{cameraActive ? "カメラ停止" : "カメラ起動"}</span>
                </button>
                <button
                  className="secondary-action"
                  disabled={!cameraActive || !cameraReady}
                  onClick={captureCamera}
                  type="button"
                >
                  <Sparkles size={18} />
                  <span>撮影する</span>
                </button>
              </div>

              {cameraActive && (
                <div className="camera-preview">
                  <video
                    muted
                    onCanPlay={() => setCameraReady(true)}
                    onLoadedMetadata={() => setCameraReady(true)}
                    playsInline
                    ref={videoRef}
                  />
                  {!cameraReady && (
                    <div className="camera-overlay">
                      <Loader2 className="spin" size={18} />
                      <span>カメラ準備中</span>
                    </div>
                  )}
                </div>
              )}

              <div className="guess-row">
                <label>
                  <span>あなたの予想</span>
                  <input
                    min="0"
                    max="100"
                    type="number"
                    value={userAge}
                    onChange={(event) => setUserAge(event.target.value)}
                    placeholder="例: 28"
                  />
                </label>
              </div>

              {ageError && (
                <div className="notice error">
                  <AlertTriangle size={18} />
                  <span>{ageError}</span>
                </div>
              )}

              <button className="primary-action" onClick={runAgeGame} type="button">
                {ageStatus === "loading" ? (
                  <Loader2 className="spin" size={19} />
                ) : (
                  <WandSparkles size={19} />
                )}
                <span>{ageStatus === "loading" ? "判定中" : "Geminiで判定"}</span>
                <ArrowRight size={18} />
              </button>
            </section>

            <section className="result-panel" aria-live="polite">
              <div className="panel-heading">
                <div>
                  <p className="label">Game Result</p>
                  <h2>Gemini の見た目年齢判定</h2>
                </div>
                <div className="score">
                  <Trophy size={18} />
                  <strong>{ageDiff == null ? "--" : `${ageDiff}歳差`}</strong>
                </div>
              </div>

              {ageResult ? (
                <div className={ageStatus === "loading" ? "result loading" : "result"}>
                  <div className="theme-row">
                    <CheckCircle2 size={20} />
                    <div>
                      <p>Gemini 判定</p>
                      <h3>
                        {ageResult.noFace
                          ? "顔をはっきり検出できませんでした"
                          : `${ageResult.estimatedAge}歳くらい`}
                      </h3>
                    </div>
                  </div>

                  {!ageResult.noFace && (
                    <div className="age-stats">
                      <div>
                        <span>あなた</span>
                        <strong>{userAge}歳</strong>
                      </div>
                      <div>
                        <span>Gemini</span>
                        <strong>{ageResult.estimatedAge}歳</strong>
                      </div>
                      <div>
                        <span>差</span>
                        <strong>{ageDiff}歳</strong>
                      </div>
                    </div>
                  )}

                  <div className="insight-box">
                    <p>
                      {ageResult.tip ||
                        "見た目年齢の推定なので、ゲーム用の参考値として楽しんでください。"}
                    </p>
                  </div>

                  <div className="columns">
                    <div>
                      <h4>判定レンジ</h4>
                      <p className="big-value">{ageResult.ageRange || "--"}</p>
                    </div>
                    <div>
                      <h4>手がかり</h4>
                      <ul>
                        {(ageResult.observations || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Sparkles size={28} />
                  <p>画像と予想年齢を入れると、Gemini が見た目年齢を判定します。</p>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
