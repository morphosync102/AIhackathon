import { spawn } from "node:child_process";

const processes = [
  spawn("node", ["server.mjs"], {
    env: { ...process.env, PORT: process.env.PORT || "8787" },
    shell: true,
    stdio: "inherit",
  }),
  spawn("vite", ["--host", "127.0.0.1", "--port", "5174"], {
    shell: true,
    stdio: "inherit",
  }),
];

function stopAll(code = 0) {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) stopAll(code);
  });
}
