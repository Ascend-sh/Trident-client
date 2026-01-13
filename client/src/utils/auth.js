const API_BASE = "/api/v1/client";

let accountCache = null;
let accountPromise = null;

function clearAccountCache() {
    accountCache = null;
    accountPromise = null;
}

async function request(path, { method = "GET", body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
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

export function login({ email, password }) {
    clearAccountCache();
    return request("/login", { method: "POST", body: { email, password } });
}

export function register({ username, email, password }) {
    clearAccountCache();
    return request("/register", { method: "POST", body: { username, email, password } });
}

export function account({ force = false } = {}) {
    if (force) clearAccountCache();
    if (accountCache) return Promise.resolve(accountCache);
    if (accountPromise) return accountPromise;

    accountPromise = request("/account")
        .then((data) => {
            accountCache = data;
            return data;
        })
        .catch((err) => {
            if (err?.status === 401) {
                clearAccountCache();
            }
            throw err;
        })
        .finally(() => {
            accountPromise = null;
        });

    return accountPromise;
}

export function logout() {
    clearAccountCache();
    return request("/logout", { method: "POST" });
}
