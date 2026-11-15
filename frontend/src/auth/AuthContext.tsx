import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "administrator" | "operator";
export type AuthUser = { id: number; login: string; role: UserRole; mustChangePassword: boolean };

export type ReleaseNotice = { version: string; url: string };

const CURRENT_VERSION = "1.6.41";
const RELEASE_URL = "https://api.github.com/repos/RyVolodya/simple-syslog-server/releases/latest";

function isNewerVersion(remote: string, current: string): boolean {
  const parse = (v: string) => {
    const match = v.replace(/^v\.?/i, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
    return match ? match.slice(1).map(Number) : null;
  };
  const a = parse(remote);
  const b = parse(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] > b[i]; }
  return false;
}

type AuthContextValue = {
  releaseNotice: ReleaseNotice | null;
  dismissReleaseNotice: () => void;
  user: AuthUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [releaseNotice, setReleaseNotice] = useState<ReleaseNotice | null>(null);
  const dismissReleaseNotice = useCallback(() => setReleaseNotice(null), []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) { setUser(null); return; }
      setUser(await readJson(res));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  const login = useCallback(async (loginName: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginName, password }),
    });
    const authenticatedUser = await readJson(res);
    setUser(authenticatedUser);
    setReleaseNotice(null);
    // Exactly one public GitHub check after a successful interactive login.
    // No polling, no timer, no check during ordinary page refresh/session restore.
    if (!authenticatedUser.mustChangePassword) {
      void fetch(RELEASE_URL, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" })
        .then(async response => response.ok ? response.json() : null)
        .then(release => {
          if (release && !release.draft && !release.prerelease &&
              typeof release.tag_name === "string" &&
              isNewerVersion(release.tag_name, CURRENT_VERSION)) {
            setReleaseNotice({
              version: release.tag_name,
              url: typeof release.html_url === "string" &&
                release.html_url.startsWith("https://github.com/RyVolodya/simple-syslog-server/releases/")
                ? release.html_url
                : "https://github.com/RyVolodya/simple-syslog-server/releases",
            });
          }
        }).catch(() => undefined); // Offline or GitHub unavailable: login still succeeds.
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => undefined);
    setUser(null);
    setReleaseNotice(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser, releaseNotice, dismissReleaseNotice }), [user, loading, login, logout, refreshUser, releaseNotice, dismissReleaseNotice]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
