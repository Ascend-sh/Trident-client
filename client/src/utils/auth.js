const API_BASE = "/api/v1/client";

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
    return request("/login", { method: "POST", body: { email, password } });
}

export function register({ username, email, password }) {
    return request("/register", { method: "POST", body: { username, email, password } });
}

export function account() {
    return request("/account");
}

export function logout() {
    return request("/logout", { method: "POST" });
}
