import "../styles.css";

const TYPE_THEMES = {
  "発想": {
    name: "idea",
    accent: "#ffd166",
    accentDeep: "#f59e0b",
    accentHot: "#f97316",
    bladeLight: "#fff7d6",
    bladeMid: "#ffe08a",
    metalLight: "#fffaf0",
    metalMid: "#d8c79a",
    metalDark: "#7c5f2a",
    glow: "rgba(255, 209, 102, 0.46)",
  },
  "感情": {
    name: "emotion",
    accent: "#fb7185",
    accentDeep: "#e11d48",
    accentHot: "#f472b6",
    bladeLight: "#fff1f5",
    bladeMid: "#fda4af",
    metalLight: "#fff5f7",
    metalMid: "#e2a4b1",
    metalDark: "#7f1d3b",
    glow: "rgba(251, 113, 133, 0.44)",
  },
  "行動": {
    name: "action",
    accent: "#34d399",
    accentDeep: "#059669",
    accentHot: "#a3e635",
    bladeLight: "#ecfdf5",
    bladeMid: "#86efac",
    metalLight: "#f0fdf4",
    metalMid: "#9fd6bd",
    metalDark: "#14532d",
    glow: "rgba(52, 211, 153, 0.42)",
  },
  "混沌": {
    name: "chaos",
    accent: "#a78bfa",
    accentDeep: "#7c3aed",
    accentHot: "#38bdf8",
    bladeLight: "#f5f3ff",
    bladeMid: "#c4b5fd",
    metalLight: "#f8f7ff",
    metalMid: "#b7a9df",
    metalDark: "#3b0764",
    glow: "rgba(167, 139, 250, 0.46)",
  },
  "静寂": {
    name: "quiet",
    accent: "#93c5fd",
    accentDeep: "#2563eb",
    accentHot: "#22d3ee",
    bladeLight: "#eff6ff",
    bladeMid: "#bfdbfe",
    metalLight: "#f8fafc",
    metalMid: "#aebaca",
    metalDark: "#334155",
    glow: "rgba(147, 197, 253, 0.34)",
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Turbine({
  level = 1,
  energy = 0,
  rpm = 0,
  type = "静寂",
  boosting = false,
  floatingEvents = [],
  showReadout = true,
}) {
  const safeLevel = clamp(Number(level) || 1, 1, 20);
  const safeEnergy = Math.max(0, Number(energy) || 0);
  const displayRpm = Math.max(0, Math.round(Number(rpm) || 0));
  const theme = TYPE_THEMES[type] ?? TYPE_THEMES["静寂"];
  const bladeCount = safeLevel >= 14 ? 14 : safeLevel >= 7 ? 12 : safeLevel >= 4 ? 10 : 8;
  const spinDuration = `${clamp(6 - displayRpm / 70 - safeLevel * 0.05, 0.68, 6)}s`;
  const size = `${clamp(190 + safeLevel * 7 + safeEnergy * 0.045, 210, 354)}px`;
  const tierClass =
    safeLevel >= 16 ? "is-overdrive" : safeLevel >= 10 ? "is-advanced" : safeLevel >= 4 ? "is-developed" : "";

  const style = {
    "--turbine-size-desktop": size,
    "--spin-duration": spinDuration,
    "--type-accent": theme.accent,
    "--type-accent-deep": theme.accentDeep,
    "--type-accent-hot": theme.accentHot,
    "--blade-light": theme.bladeLight,
    "--blade-mid": theme.bladeMid,
    "--metal-light": theme.metalLight,
    "--metal-mid": theme.metalMid,
    "--metal-dark": theme.metalDark,
    "--type-glow": theme.glow,
  };

  return (
    <section
      className={`turbine-stage ${tierClass} ${boosting ? "is-boosting" : ""}`}
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
      <div className="rpm-pop-layer" aria-hidden="true">
        {floatingEvents.map((event) => (
          <span
            className="rpm-pop"
            key={event.id}
            style={{
              "--pop-x": `${event.x}%`,
              "--pop-y": `${event.y}%`,
            }}
          >
            +{event.amount}
          </span>
        ))}
      </div>
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

      {showReadout ? (
        <div className="turbine-readout">
          <span>LEVEL {safeLevel}</span>
          <strong>{displayRpm} RPM</strong>
        </div>
      ) : null}
    </section>
  );
}
