import React from "react";
import { useModules } from "../hooks/useModules";
import type { ModuleDef } from "../types/modules";

function move(mods: ModuleDef[], from: number, to: number) {
  const next = [...mods];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function Dashboard() {
  const { modules, setModules } = useModules();

  const phases = ["Awareness", "Operations", "Coordination", "Recovery"] as const;

  function bump(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= modules.length) return;
    setModules(move(modules, idx, to));
  }

  return (
    <div style={{ fontFamily: "system-ui, Arial", padding: 16 }}>
      <h1>Storm Ops Dashboard – Module Workflow</h1>
      <p>Use the arrows to rearrange. Click <strong>Save</strong> (top-right of your Replit) to persist the JSON if you want devs to lock it in.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {phases.map((phase) => (
          <section key={phase} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>{phase}</h2>
            {modules
              .map((m, i) => ({ m, i }))
              .filter(({ m }) => m.phase === phase)
              .map(({ m, i }) => (
                <article key={m.id} style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 10,
                  background: "#fafafa"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <strong>{m.name}</strong>
                      <div style={{ fontSize: 12, color: "#666" }}>{m.description}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>Publishes: {m.publishes.join(", ") || "–"}</div>
                      <div style={{ fontSize: 11, color: "#999" }}>Subscribes: {m.subscribes.join(", ") || "–"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => bump(i, -1)} aria-label="Move up">↑</button>
                      <button onClick={() => bump(i, 1)} aria-label="Move down">↓</button>
                    </div>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}