import "../styles.css";

const TYPE_THEMES = {
  "発想": {
    name: "idea",
    accent: "#ffd166",
    accentDeep: "#f59e0b",
    glow: "rgba(255, 209, 102, 0.46)",
  },
  "感情": {
    name: "emotion",
    accent: "#fb7185",
    accentDeep: "#e11d48",
    glow: "rgba(251, 113, 133, 0.44)",
  },
  "行動": {
    name: "action",
    accent: "#34d399",
    accentDeep: "#059669",
    glow: "rgba(52, 211, 153, 0.42)",
  },
  "混沌": {
    name: "chaos",
    accent: "#a78bfa",
    accentDeep: "#7c3aed",
    glow: "rgba(167, 139, 250, 0.46)",
  },
  "静寂": {
    name: "quiet",
    accent: "#93c5fd",
    accentDeep: "#2563eb",
    glow: "rgba(147, 197, 253, 0.34)",
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Turbine({
  level = 1,
  energy = 0,
  type = "静寂",
  boosting = false,
}) {
  const safeLevel = clamp(Number(level) || 1, 1, 5);
  const safeEnergy = Math.max(0, Number(energy) || 0);
  const theme = TYPE_THEMES[type] ?? TYPE_THEMES["静寂"];
  const bladeCount = safeLevel >= 4 ? 10 : 8;
  const rpm = Math.round(18 + safeLevel * 16 + Math.min(safeEnergy, 120) * 0.28);
  const spinDuration = `${clamp(5.6 - safeLevel * 0.72 - safeEnergy / 170, 1.05, 5.4)}s`;
  const size = `${clamp(188 + safeLevel * 22 + safeEnergy * 0.18, 210, 342)}px`;

  const style = {
    "--turbine-size-desktop": size,
    "--spin-duration": spinDuration,
    "--type-accent": theme.accent,
    "--type-accent-deep": theme.accentDeep,
    "--type-glow": theme.glow,
  };

  return (
    <section
      className={`turbine-stage level-${safeLevel} ${boosting ? "is-boosting" : ""}`}
      data-type={theme.name}
      aria-label={`レベル${safeLevel}の${type}タービン`}
      style={style}
    >
      <div className="wind-streams" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="turbine-orbit" aria-hidden="true" />
      <div className="turbine-assembly">
        <div className="turbine-rotor">
          {Array.from({ length: bladeCount }).map((_, index) => (
            <span
              className="turbine-blade"
              key={index}
              style={{ "--blade-angle": `${(360 / bladeCount) * index}deg` }}
            />
          ))}
          <span className="turbine-hub" />
        </div>
        <div className="turbine-core" />
      </div>

      <div className="turbine-readout">
        <span>LEVEL {safeLevel}</span>
        <strong>{rpm} RPM</strong>
      </div>
    </section>
  );
}
