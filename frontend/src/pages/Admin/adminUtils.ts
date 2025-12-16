export const API_PORT = "8081";

export function apiUrl(path: string): string {
    const loc = (globalThis as unknown as { location?: Location }).location;
    const protocol = loc?.protocol ?? "http:";
    const hostname = loc?.hostname ?? "localhost";
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

export function getJwt(): string | null {
    try {
        const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
        return ls?.getItem?.("jwt") ?? null;
    } catch (e) {
        void e;
        return null;
    }
}

/**
 * handleAuthError centraliza remoção de jwt e navegação em 401/403.
 * Retorna true se foi tratada (ex.: fez logout e redirecionou).
 */
export function handleAuthError(
    status?: number,
    statusText?: string,
    navigate?: (path: string) => void,
    setError?: (s: string | null) => void
): boolean {
    if (status === 401 || status === 403) {
        try {
            globalThis.localStorage.removeItem("jwt");
            globalThis.localStorage.removeItem("user");
        } catch (e) {
            void e;
        }
        if (setError) setError("Sessão expirada. Por favor faça login novamente.");
        if (navigate) {
            // pequeno atraso para mostrar mensagem
            setTimeout(() => navigate("/loginPage"), 900);
        }
        return true;
    }
    if (statusText && setError) {
        setError(statusText);
    }
    return false;
}
