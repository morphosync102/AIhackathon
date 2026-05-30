import "../styles.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const TYPE_LABELS = {
  "発想": "発想の風",
  "感情": "感情の風",
  "行動": "行動の風",
  "混沌": "混沌の風",
  "静寂": "静寂の風",
};

export default function EnergyPanel({
  level = 1,
  totalEnergy = 0,
  energyToNextLevel = 0,
  progress = 0,
  lastResult = null,
}) {
  const safeProgress = clamp(Number(progress) || 0, 0, 100);
  const resultType = lastResult?.type ?? "静寂";

  return (
    <aside className="energy-panel" aria-label="タービン状態">
      <div className="energy-panel__stats">
        <div className="energy-stat">
          <span>タービンレベル</span>
          <strong>{level}</strong>
        </div>
        <div className="energy-stat">
          <span>累計エネルギー</span>
          <strong>{totalEnergy}</strong>
        </div>
        <div className="energy-stat">
          <span>次の成長まで</span>
          <strong>{energyToNextLevel}</strong>
        </div>
      </div>

      <div className="energy-gauge" aria-label={`次の成長まで ${Math.round(safeProgress)}%`}>
        <div className="energy-gauge__track">
          <span
            className="energy-gauge__fill"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <div className="energy-gauge__labels">
          <span>成長ゲージ</span>
          <strong>{Math.round(safeProgress)}%</strong>
        </div>
      </div>

      <div className="last-result" data-type={resultType}>
        {lastResult ? (
          <>
            <div className="last-result__header">
              <span>{TYPE_LABELS[resultType] ?? `${resultType}の風`}</span>
              <strong>+{lastResult.energy}</strong>
            </div>
            <p className="last-result__summary">{lastResult.summary}</p>
            <p className="last-result__reason">{lastResult.reason}</p>
            <p className="last-result__comment">{lastResult.comment}</p>
          </>
        ) : (
          <>
            <div className="last-result__header">
              <span>待機中</span>
              <strong>+0</strong>
            </div>
            <p className="last-result__summary">
              言葉を流すと、AI が風の種類とエネルギーを判定します。
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
