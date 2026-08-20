import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { FiLock, FiUser } from "react-icons/fi";
import { HiOutlineServerStack } from "react-icons/hi2";
import { useAuth } from "../../auth/AuthContext";
import "./Login.scss";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.mustChangePassword ? "/change-password" : "/dashboard"} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await login(username.trim(), password); }
    catch (e: any) { setError(e.message || "Unable to sign in"); }
    finally { setBusy(false); }
  };

  return <div className="login-page">
    <div className="login-card">
      <div className="login-brand"><div className="login-brand__mark">S</div><div><strong>Simple Syslog</strong><span>Server</span></div></div>
      <div className="login-icon"><HiOutlineServerStack /></div>
      <h1>Welcome back</h1><p>Sign in to access your syslog workspace.</p>
      <form onSubmit={submit}>
        <label>Username<div className="login-input"><FiUser/><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" autoFocus /></div></label>
        <label>Password<div className="login-input"><FiLock/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></div></label>
        {error && <div className="login-error">{error}</div>}
        <button disabled={busy || !username || !password}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="login-footer">Secure session • Syslog monitoring console</div>
    </div>
  </div>;
};
export default Login;
