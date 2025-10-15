export type LocationRow = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  alert?: boolean;
  threshold?: number;
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export async function listLocations(): Promise<LocationRow[]> {
  const r = await fetch(`${getBaseUrl()}/api/locations`);
  if (!r.ok) throw new Error("list failed");
  return r.json();
}

export async function createLocation(row: LocationRow) {
  const r = await fetch(`${getBaseUrl()}/api/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error("create failed");
}

export async function updateLocation(id: string, patch: Partial<LocationRow>) {
  const r = await fetch(`${getBaseUrl()}/api/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!r.ok) throw new Error("update failed");
}

export async function deleteLocation(id: string) {
  const r = await fetch(`${getBaseUrl()}/api/locations/${id}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error("delete failed");
}

export async function setAlert(id: string, alert: boolean, threshold?: number) {
  const body: any = { alert };
  if (Number.isFinite(threshold as number)) body.threshold = Number(threshold);
  const r = await fetch(`${getBaseUrl()}/api/alerts/toggle/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("toggle failed");
}

export async function getAlertsConfig() {
  const r = await fetch(`${getBaseUrl()}/api/alerts/config`);
  if (!r.ok) throw new Error("get config failed");
  return r.json();
}

export async function setAlertsConfig(config: { webhookUrl: string; defaultThreshold?: number }) {
  const r = await fetch(`${getBaseUrl()}/api/alerts/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!r.ok) throw new Error("set config failed");
}

export async function checkAlerts() {
  const r = await fetch(`${getBaseUrl()}/api/alerts/check`, {
    method: "POST",
  });
  if (!r.ok) throw new Error("check failed");
  return r.json();
}
