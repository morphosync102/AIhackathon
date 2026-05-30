const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function EnergyPanel({
  level = 1,
  currentRpm = 0,
  totalEnergy = 0,
  energyToNextLevel = 0,
  progress = 0,
}) {
  const safeProgress = clamp(Number(progress) || 0, 0, 100);

  return (
    <aside className="energy-panel" aria-label="タービン状態">
      <div className="energy-panel__stats">
        <div className="energy-stat">
          <span>LEVEL</span>
          <strong>{level}</strong>
        </div>
        <div className="energy-stat">
          <span>RPM</span>
          <strong>{Math.round(currentRpm)}</strong>
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
    </aside>
  );
}
