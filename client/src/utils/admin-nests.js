const API_BASE = "/api/v1/client";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.error || data?.message || "request_failed";
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function fetchPanelNests({ page = 1, perPage = 50 } = {}) {
  const qs = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  return request(`/admin/panel-nests?${qs}`);
}

export function fetchImportedNests() {
  return request('/admin/imported-nests');
}

export function addNest(nestId) {
  return request('/admin/add-nest', { method: 'POST', body: { id: nestId } });
}

export function deleteNest(nestId) {
  const qs = new URLSearchParams({ id: String(nestId) });
  return request(`/admin/delete-nest?${qs}`, { method: 'DELETE' });
}
