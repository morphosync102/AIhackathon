import "../styles.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const EMOTION_AXES = [
  { key: "motivation", label: "やる気" },
  { key: "anger", label: "怒り" },
  { key: "joy", label: "喜び" },
  { key: "sadness", label: "悲しみ" },
  { key: "love", label: "愛" },
  { key: "anxiety", label: "不安" },
];

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
  const radarPoints = getRadarPoints(lastResult?.emotionScores);

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
            <div className="emotion-radar" aria-label="感情レーダーチャート">
              <svg className="emotion-radar__chart" viewBox="0 0 140 140" role="img">
                <title>感情レーダーチャート</title>
                <polygon className="emotion-radar__grid" points={getGridPoints(100)} />
                <polygon className="emotion-radar__grid emotion-radar__grid--inner" points={getGridPoints(66)} />
                <polygon className="emotion-radar__grid emotion-radar__grid--inner" points={getGridPoints(33)} />
                <line x1="70" y1="70" x2="70" y2="10" />
                <line x1="70" y1="70" x2="122" y2="40" />
                <line x1="70" y1="70" x2="122" y2="100" />
                <line x1="70" y1="70" x2="70" y2="130" />
                <line x1="70" y1="70" x2="18" y2="100" />
                <line x1="70" y1="70" x2="18" y2="40" />
                <polygon className="emotion-radar__shape" points={radarPoints} />
              </svg>
              <div className="emotion-radar__labels">
                {EMOTION_AXES.map(({ key, label }) => (
                  <div className="emotion-radar__row" key={key}>
                    <span>{label}</span>
                    <strong>{lastResult.emotionScores?.[key] ?? 0}</strong>
                  </div>
                ))}
              </div>
            </div>
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

function getGridPoints(percent) {
  const radius = 60 * (percent / 100);
  return EMOTION_AXES.map((_, index) => getPoint(index, radius)).join(" ");
}

function getRadarPoints(scores = {}) {
  return EMOTION_AXES.map(({ key }, index) => {
    const score = clamp(Number(scores[key]) || 0, 0, 100);
    return getPoint(index, 60 * (score / 100));
  }).join(" ");
}

function getPoint(index, radius) {
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / EMOTION_AXES.length);
  const x = 70 + Math.cos(angle) * radius;
  const y = 70 + Math.sin(angle) * radius;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}
