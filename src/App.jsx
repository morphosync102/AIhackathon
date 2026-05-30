import { useEffect, useMemo, useState } from "react";
import { analyzeWord } from "./api.js";
import Turbine from "./components/Turbine.jsx";
import EnergyPanel from "./components/EnergyPanel.jsx";
import ShopPanel from "./components/ShopPanel.jsx";
import {
  INITIAL_GAME_STATE,
  applyAutoRpmTick,
  applyWordAnalysis,
  buyShopItem,
  getNextLevelProgress,
  getRpmPerSecond,
  getShopItems,
} from "./gameLogic.js";
import { sampleInputs } from "./sampleInputs.js";

const POP_POSITIONS = [
  { x: 52, y: 22 },
  { x: 66, y: 36 },
  { x: 36, y: 38 },
  { x: 56, y: 64 },
];

export default function App() {
  const [text, setText] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [floatingEvents, setFloatingEvents] = useState([]);
  const [error, setError] = useState("");
  const progress = useMemo(
    () => getNextLevelProgress(gameState.totalEnergy),
    [gameState.totalEnergy],
  );
  const shopItems = useMemo(() => getShopItems(gameState), [gameState]);
  const rpmPerSecond = useMemo(() => getRpmPerSecond(gameState), [gameState]);

  useEffect(() => {
    if (rpmPerSecond <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setGameState((current) => applyAutoRpmTick(current));
      spawnRpmPop(rpmPerSecond);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [rpmPerSecond]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedText = text.trim();

    if (!trimmedText) {
      setError("言葉を入れるとタービンが回ります");
      return;
    }

    setIsLoading(true);
    setBoosting(true);
    setError("");

    try {
      const analysis = await analyzeWord({
        text: trimmedText,
        currentLevel: gameState.level,
        currentEnergy: gameState.totalEnergy,
      });

      setGameState((current) => {
        const next = applyWordAnalysis(current, trimmedText, analysis);

        if (next.level > current.level) {
          setLevelUpVisible(true);
          window.setTimeout(() => setLevelUpVisible(false), 1200);
        }

        return next;
      });
      setText("");
      rotateRecommendedText();
    } catch {
      setError("風が乱れました。もう一度流してください");
    } finally {
      setIsLoading(false);
      window.setTimeout(() => setBoosting(false), 620);
    }
  }

  const lastType = gameState.lastAnalysis?.type || "静寂";
  const recommendedText = sampleInputs[sampleIndex % sampleInputs.length];

  function rotateRecommendedText() {
    setSampleIndex((current) => (current + 1) % sampleInputs.length);
  }

  function handleBuyItem(itemId) {
    setGameState((current) => buyShopItem(current, itemId));
    setBoosting(true);
    window.setTimeout(() => setBoosting(false), 360);
  }

  function spawnRpmPop(amount) {
    const position = POP_POSITIONS[Math.floor(Date.now() / 1000) % POP_POSITIONS.length];
    const id = `${Date.now()}-${amount}`;

    setFloatingEvents((current) =>
      [
        ...current,
        {
          id,
          amount,
          ...position,
        },
      ].slice(-6),
    );

    window.setTimeout(() => {
      setFloatingEvents((current) => current.filter((event) => event.id !== id));
    }, 1300);
  }

  return (
    <main className="app-shell" data-type={lastType} aria-label="タービン・ワードクリッカー">
      <section className="word-console" aria-label="言葉の入力">
        <div className="app-logo" aria-label="Turbine">
          TURBINE
        </div>

        <form className="word-form" onSubmit={handleSubmit}>
          <label htmlFor="word-input">言葉を入力してください</label>
          <div className="word-form__row">
            <textarea
              id="word-input"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                if (error) setError("");
              }}
              placeholder="例: 今日の失敗を明日の改善につなげたい"
              rows={3}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "変換中" : "言葉を流す"}
            </button>
          </div>

          <div className="sample-row" aria-label="サンプル入力">
            <button
              type="button"
              onClick={() => {
                setText(recommendedText);
                setError("");
                rotateRecommendedText();
              }}
              disabled={isLoading}
            >
              AI推奨：「{recommendedText}」
            </button>
          </div>
        </form>

        <div className="message-row" aria-live="polite">
          {error ? <p className="message message--error">{error}</p> : null}
          {isLoading ? (
            <p className="message message--loading">言葉を風に変換中</p>
          ) : null}
        </div>
      </section>

      <section className="turbine-layout" aria-label="タービンとエネルギー状態">
        <Turbine
          level={gameState.level}
          energy={gameState.totalEnergy}
          rpm={gameState.currentRpm}
          type={lastType}
          boosting={boosting}
          floatingEvents={floatingEvents}
          showReadout={false}
        />

        {levelUpVisible ? (
          <div className="level-up-banner" role="status" aria-live="polite">
            LEVEL UP !
          </div>
        ) : null}

        <div className="side-panels">
          <ShopPanel items={shopItems} onBuy={handleBuyItem} />
        </div>
      </section>

      <EnergyPanel
        level={gameState.level}
        currentRpm={gameState.currentRpm}
        totalEnergy={gameState.totalEnergy}
        energyToNextLevel={progress.remaining}
        progress={progress.progress}
      />
    </main>
  );
}
