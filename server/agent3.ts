let started = false;
let lastRun: number | null = null;

function start() {
  if (started) return; // don't start twice
  started = true;
  console.log("[Agent3] starting…");

  // Simple heartbeat so you can SEE it's alive
  setInterval(() => {
    lastRun = Date.now();
    console.log("[Agent3] heartbeat", new Date(lastRun).toISOString());
  }, 60_000); // every 60 seconds
}

function health() {
  return { started, lastRun };
}

export default { start, health };
