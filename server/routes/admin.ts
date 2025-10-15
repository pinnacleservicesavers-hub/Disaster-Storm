import express from "express";

export function mountAdmin(app: express.Application) {
  app.get("/admin", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Disaster Direct Admin</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:16px;background:#f9fafb}
  h1{margin:0 0 12px;color:#111827} h2{margin:24px 0 12px;color:#374151}
  .row{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap}
  input,button,textarea{padding:6px 8px;font:inherit;border:1px solid #d1d5db;border-radius:4px}
  button{background:#2563eb;color:#fff;cursor:pointer;border:none}
  button:hover{background:#1d4ed8}
  button.danger{background:#dc2626}
  button.danger:hover{background:#b91c1c}
  table{width:100%;border-collapse:collapse;margin-top:8px;background:#fff}
  th,td{border-bottom:1px solid #e5e7eb;text-align:left;padding:8px}
  th{background:#f3f4f6;font-weight:600}
  code{background:#f3f4f6;padding:2px 4px;border-radius:4px;font-size:0.9em}
  small{opacity:.7}
  .card{background:#fff;padding:16px;border-radius:8px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,0.1)}
</style>
</head>
<body>
  <h1>🌪️ Disaster Direct – Admin</h1>
  
  <div class="card">
    <div class="row">
      <label>API Base <input id="base" style="width:360px"/></label>
      <label>Admin Token <input id="bearer" type="password" style="width:260px"/></label>
      <button id="save">Save</button>
      <small>These are stored in your browser only.</small>
    </div>
  </div>

  <div class="card">
    <h2>📍 Locations</h2>
    <div class="row">
      <input id="id" placeholder="id"/>
      <input id="name" placeholder="name" style="width:220px"/>
      <input id="lat" type="number" step="0.01" placeholder="lat"/>
      <input id="lng" type="number" step="0.01" placeholder="lng"/>
      <label><input id="alert" type="checkbox"/> Alerts</label>
      <input id="thr" type="number" placeholder="threshold"/>
      <button id="add">Add Location</button>
      <button id="refresh">Refresh</button>
    </div>
    <div class="row">
      <a id="export" href="#" download="locations.csv"><button type="button">📥 Export CSV</button></a>
      <label><button type="button" id="importBtn">📤 Import CSV</button><input id="file" type="file" accept=".csv" style="display:none"/></label>
    </div>
    <table><thead><tr>
      <th>ID</th><th>Name</th><th>Lat,Lng</th><th>Alerts</th><th>Threshold</th><th>Actions</th>
    </tr></thead><tbody id="tbody"></tbody></table>
  </div>

  <div class="card">
    <h2>🔔 Alerts</h2>
    <div class="row">
      <input id="webhook" placeholder="Webhook URL" style="width:420px"/>
      <input id="defthr" type="number" placeholder="default threshold (e.g., 70)"/>
      <button id="saveAlerts">Save Alerts Config</button>
      <button id="checkNow">Run Check Now</button>
    </div>
  </div>

<script>
const $ = sel => document.querySelector(sel);
const state = {
  base: localStorage.getItem("dd.base") || location.origin,
  bearer: localStorage.getItem("dd.bearer") || ""
};
$("#base").value = state.base; $("#bearer").value = state.bearer;

$("#save").onclick = () => {
  state.base = $("#base").value.trim() || location.origin;
  state.bearer = $("#bearer").value.trim();
  localStorage.setItem("dd.base", state.base);
  localStorage.setItem("dd.bearer", state.bearer);
  alert("✓ Saved");
};

function hdr(writes=false){
  const h = { };
  if (writes && state.bearer) h["Authorization"] = "Bearer " + state.bearer;
  return { headers: h };
}

async function list(){
  try {
    const r = await fetch(state.base + "/api/locations");
    const rows = await r.json();
    const tb = $("#tbody"); tb.innerHTML = "";
    rows.forEach(x => {
      const tr = document.createElement("tr");
      tr.innerHTML = \`
        <td><code>\${x.id}</code></td>
        <td>\${x.name}</td>
        <td style="font-family:ui-monospace">\${x.lat.toFixed(3)},\${x.lng.toFixed(3)}</td>
        <td><input type="checkbox" \${x.alert ? "checked":""} data-id="\${x.id}" class="toggle"/></td>
        <td><input type="number" style="width:90px" value="\${x.threshold ?? ""}" data-id="\${x.id}" class="thr"/></td>
        <td>
          <button data-id="\${x.id}" class="del danger" style="font-size:0.85em">Remove</button>
        </td>\`;
      tb.appendChild(tr);
    });
    tb.querySelectorAll(".toggle").forEach(el => el.onchange = async e => {
      const id = e.target.getAttribute("data-id"); const v = e.target.checked;
      await fetch(state.base + "/api/alerts/toggle/" + id, { method:"PUT", ...hdr(true), headers:{...hdr(true).headers, "Content-Type":"application/json"}, body: JSON.stringify({ alert: v }) });
    });
    tb.querySelectorAll(".thr").forEach(el => el.onchange = async e => {
      const id = e.target.getAttribute("data-id"); const v = e.target.value === "" ? null : Number(e.target.value);
      await fetch(state.base + "/api/locations/" + id, { method:"PUT", ...hdr(true), headers:{...hdr(true).headers, "Content-Type":"application/json"}, body: JSON.stringify({ threshold: v }) });
    });
    tb.querySelectorAll(".del").forEach(el => el.onclick = async e => {
      const id = e.target.getAttribute("data-id");
      if (!confirm("Delete " + id + "?")) return;
      await fetch(state.base + "/api/locations/" + id, { method:"DELETE", ...hdr(true) });
      list();
    });
  } catch(e) {
    alert("Error loading locations: " + e.message);
  }
}

$("#refresh").onclick = list;

$("#add").onclick = async () => {
  const row = {
    id: $("#id").value.trim(),
    name: $("#name").value.trim(),
    lat: Number($("#lat").value),
    lng: Number($("#lng").value),
    alert: $("#alert").checked,
    threshold: $("#thr").value === "" ? undefined : Number($("#thr").value)
  };
  if (!row.id || !row.name || !Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return alert("Fill id, name, lat, lng");
  try {
    const resp = await fetch(state.base + "/api/locations", { method:"POST", ...hdr(true), headers:{...hdr(true).headers, "Content-Type":"application/json"}, body: JSON.stringify(row) });
    if (!resp.ok) throw new Error(await resp.text());
    ["#id","#name","#lat","#lng","#thr"].forEach(s=>$(s).value=""); $("#alert").checked=false;
    list();
  } catch(e) {
    alert("Error adding location: " + e.message);
  }
};

$("#export").onclick = async (e) => {
  e.preventDefault();
  const u = state.base + "/api/locations/export";
  const a = document.createElement("a"); a.href = u; a.download = "locations.csv"; a.click();
};

$("#importBtn").onclick = () => $("#file").click();

$("#file").onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  try {
    const resp = await fetch(state.base + "/api/locations/import", { 
      method:"POST", 
      headers: state.bearer ? {"Authorization": "Bearer " + state.bearer} : {},
      body: formData 
    });
    const result = await resp.json();
    if (!result.success) {
      alert("Import failed:\\n" + result.errors.join("\\n"));
    } else {
      alert(\`✓ Imported \${result.imported} locations\`);
    }
    e.target.value = ""; 
    list();
  } catch(e) {
    alert("Error importing: " + e.message);
  }
};

$("#saveAlerts").onclick = async () => {
  const body = {
    webhookUrl: $("#webhook").value.trim(),
    defaultThreshold: Number($("#defthr").value || "70")
  };
  if (!body.webhookUrl) return alert("Webhook URL required");
  try {
    await fetch(state.base + "/api/alerts/config", { method:"PUT", ...hdr(true), headers:{...hdr(true).headers, "Content-Type":"application/json"}, body: JSON.stringify(body) });
    alert("✓ Alerts saved");
  } catch(e) {
    alert("Error saving alerts: " + e.message);
  }
};

$("#checkNow").onclick = async () => {
  try {
    const resp = await fetch(state.base + "/api/alerts/check", { method:"POST", ...hdr(true) });
    const result = await resp.json();
    alert(\`✓ Check triggered. Checked \${result.checked} locations.\`);
  } catch(e) {
    alert("Error triggering check: " + e.message);
  }
};

// Load config on startup
(async () => {
  try {
    const r = await fetch(state.base + "/api/alerts/config");
    const cfg = await r.json();
    $("#webhook").value = cfg.webhookUrl || "";
    $("#defthr").value = cfg.defaultThreshold || 70;
  } catch(e) {
    console.error("Error loading alerts config:", e);
  }
})();

list();
</script>
</body></html>`);
  });
}
