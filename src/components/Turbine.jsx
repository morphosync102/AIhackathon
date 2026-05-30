import { useEffect, useRef } from "react";
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

const EMOTION_THEMES = {
  motivation: {
    name: "motivation",
    accent: "#f59e0b",
    accentDeep: "#b45309",
    accentWarm: "#fde68a",
    glow: "rgba(245, 158, 11, 0.46)",
  },
  anger: {
    name: "anger",
    accent: "#ef4444",
    accentDeep: "#b91c1c",
    accentWarm: "#fb7185",
    glow: "rgba(239, 68, 68, 0.46)",
  },
  joy: {
    name: "joy",
    accent: "#facc15",
    accentDeep: "#ca8a04",
    accentWarm: "#34d399",
    glow: "rgba(250, 204, 21, 0.48)",
  },
  sadness: {
    name: "sadness",
    accent: "#60a5fa",
    accentDeep: "#2563eb",
    accentWarm: "#a5b4fc",
    glow: "rgba(96, 165, 250, 0.42)",
  },
  love: {
    name: "love",
    accent: "#fb7185",
    accentDeep: "#be123c",
    accentWarm: "#f9a8d4",
    glow: "rgba(251, 113, 133, 0.48)",
  },
  anxiety: {
    name: "anxiety",
    accent: "#a78bfa",
    accentDeep: "#6d28d9",
    accentWarm: "#38bdf8",
    glow: "rgba(167, 139, 250, 0.46)",
  },
  quiet: {
    name: "quiet",
    accent: "#93c5fd",
    accentDeep: "#2563eb",
    accentWarm: "#34d399",
    glow: "rgba(147, 197, 253, 0.34)",
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Turbine({
  level = 1,
  energy = 0,
  type = "静寂",
  emotion = "quiet",
  boosting = false,
}) {
  const rotorRef = useRef(null);
  const angleRef = useRef(0);
  const speedRef = useRef(0);
  const safeLevel = clamp(Number(level) || 1, 1, 10);
  const safeEnergy = Math.max(0, Number(energy) || 0);
  const theme = EMOTION_THEMES[emotion] ?? TYPE_THEMES[type] ?? TYPE_THEMES["静寂"];
  const bladeCount = safeLevel >= 8 ? 12 : safeLevel >= 4 ? 10 : 8;
  const rpm = Math.round(14 + safeLevel * 11 + Math.min(safeEnergy, 220) * 0.22);
  const spinDurationSeconds = clamp(5.8 - safeLevel * 0.38 - safeEnergy / 260, 0.72, 5.4);
  const spinDuration = `${spinDurationSeconds}s`;
  const size = `${clamp(138 + safeLevel * 9 + safeEnergy * 0.07, 154, 250)}px`;

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();
    const normalSpeed = 1 / spinDurationSeconds;
    const boostSpeed = Math.max(normalSpeed * 4.2, 2.2);
    const settleTime = boosting ? 0.08 : 0.72;

    if (!speedRef.current) {
      speedRef.current = normalSpeed;
    }

    function tick(now) {
      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;

      const targetSpeed = boosting ? boostSpeed : normalSpeed;
      const smoothing = 1 - Math.exp(-deltaSeconds / settleTime);
      speedRef.current += (targetSpeed - speedRef.current) * smoothing;
      angleRef.current = (angleRef.current + speedRef.current * 360 * deltaSeconds) % 360;

      if (rotorRef.current) {
        rotorRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [boosting, spinDurationSeconds]);

  const style = {
    "--turbine-size-desktop": size,
    "--spin-duration": spinDuration,
    "--type-accent": theme.accent,
    "--type-accent-deep": theme.accentDeep,
    "--type-accent-warm": theme.accentWarm ?? theme.accent,
    "--type-glow": theme.glow,
  };

  return (
    <section
      className={`turbine-stage level-${safeLevel} ${boosting ? "is-boosting" : ""}`}
      data-type={theme.name}
      data-emotion={theme.name}
      aria-label={`レベル${safeLevel}の${type}タービン`}
      style={style}
    >
      <div className="wind-streams" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="turbine-installation">
        <div className="turbine-orbit" aria-hidden="true" />
        <div className="turbine-ground-shadow" />
        <div className="turbine-tower" />
        <div className="turbine-base" />
        <div className="turbine-assembly">
          <div className="turbine-nacelle" />
          <div className="turbine-rotor" ref={rotorRef}>
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
      </div>

      <div className="turbine-readout">
        <span>LEVEL {safeLevel}</span>
        <strong>{rpm} RPM</strong>
      </div>
    </section>
  );
}
