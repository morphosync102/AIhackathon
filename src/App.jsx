import { useMemo, useState } from "react";
import { analyzeWord } from "./api.js";
import Turbine from "./components/Turbine.jsx";
import EnergyPanel from "./components/EnergyPanel.jsx";
import {
  INITIAL_GAME_STATE,
  applyWordAnalysis,
  getNextLevelProgress,
} from "./gameLogic.js";
import { getRandomSampleInputs } from "./sampleInputs.js";

const TREE_STAGE_MAX_ENERGY = 930;
const TREE_STAGE_COUNT = 15;

function getTreeGrowthStage(totalEnergy) {
  const safeEnergy = Math.max(0, Number(totalEnergy) || 0);
  return Math.min(
    TREE_STAGE_COUNT,
    Math.max(1, Math.floor((safeEnergy / TREE_STAGE_MAX_ENERGY) * TREE_STAGE_COUNT) + 1),
  );
}

function getTreeArtStage(treeGrowthStage) {
  return Math.min(5, Math.max(1, Math.ceil(treeGrowthStage / 3)));
}

export default function App() {
  const [text, setText] = useState("");
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [error, setError] = useState("");
  const [sampleInputs, setSampleInputs] = useState(() => getRandomSampleInputs());
  const progress = useMemo(
    () => getNextLevelProgress(gameState.totalEnergy),
    [gameState.totalEnergy],
  );

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

      setGameState((current) => applyWordAnalysis(current, trimmedText, analysis));
      setText("");
      setSampleInputs(getRandomSampleInputs());
    } catch {
      setError("風が乱れました。もう一度流してください");
    } finally {
      setIsLoading(false);
      window.setTimeout(() => setBoosting(false), 620);
    }
  }

  const lastType = gameState.lastAnalysis?.type || "静寂";
  const treeGrowthStage = getTreeGrowthStage(gameState.totalEnergy);
  const treeArtStage = getTreeArtStage(treeGrowthStage);

  return (
    <main
      className="app-shell"
      data-type={lastType}
      data-level={gameState.level}
      data-tree-stage={treeGrowthStage}
      data-tree-art-stage={treeArtStage}
      aria-label="タービン・ワードクリッカー"
    >
      <div className="landscape" aria-hidden="true">
        <div className="landscape__sky" />
        <div className="landscape__rainbow" />
        <div className="landscape__hills" />
        <div className="landscape__field" />
        <div className="landscape__growth" />
        <div className="landscape__trees">
          <span className="landscape-tree landscape-tree--left" />
          <span className="landscape-tree landscape-tree--right" />
          <span className="landscape-tree landscape-tree--far" />
        </div>
      </div>
      <section className="word-console" aria-label="言葉の入力">
        <div>
          <h1>言葉を流して、タービンを育てる</h1>
        </div>

        <form className="word-form" onSubmit={handleSubmit}>
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
        </form>

        <div className="sample-row" aria-label="サンプル入力">
          {sampleInputs.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setText(sample);
                setError("");
              }}
              disabled={isLoading}
            >
              {sample}
            </button>
          ))}
          <button
            className="sample-row__refresh"
            type="button"
            onClick={() => {
              setSampleInputs(getRandomSampleInputs());
              setError("");
            }}
            disabled={isLoading}
          >
            候補を更新
          </button>
        </div>

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
          type={lastType}
          boosting={boosting}
        />

        <EnergyPanel
          level={gameState.level}
          totalEnergy={gameState.totalEnergy}
          energyToNextLevel={progress.remaining}
          progress={progress.progress}
          lastResult={gameState.lastAnalysis}
        />
      </section>
    </main>
  );
}
