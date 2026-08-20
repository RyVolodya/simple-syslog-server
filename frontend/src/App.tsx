import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { AppNameContext } from "./common/components/AppNameContext/AppNameContext";
import { initDbSizeSocket } from "./ws/dbSizeSocket";
import Sidebar from "./common/components/Sidebar/Sidebar";
import Header from "./common/components/Header/Header";
import Dashboard from "./pages/Home/Home";
import Message from "./pages/Message/Message";
import Setting from "./pages/Setting/Setting";
import Login from "./pages/Login/Login";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import { useAuth } from "./auth/AuthContext";
import { ServerTimeZoneContext } from "./common/timezone/ServerTimeZoneContext";

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [appName, setAppName] = useState(() => localStorage.getItem("appName") || "Simple Syslog Server");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") === "dark" ? "dark" : "light")
  );
  const [serverTimeZone, setServerTimeZone] = useState({ timeZone: null as string | null, offsetMinutes: 0 });

  useEffect(() => { localStorage.setItem("appName", appName); document.title = appName; }, [appName]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#090d14" : "#ffffff");
  }, [theme]);
  useEffect(() => { if (user && !user.mustChangePassword) initDbSizeSocket(); }, [user?.id, user?.mustChangePassword]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadServerTimeZone = async () => {
      try {
        const response = await fetch("/api/timezone", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("timezone endpoint unavailable");
        const body = await response.json();
        if (!cancelled) {
          setServerTimeZone({
            timeZone: typeof body?.timeZone === "string" && body.timeZone ? body.timeZone : null,
            offsetMinutes: Number.isFinite(Number(body?.offsetMinutes)) ? Number(body.offsetMinutes) : 0,
          });
        }
      } catch {
        if (!cancelled) {
          // Retry after startup/network race rather than silently staying on UTC.
          window.setTimeout(loadServerTimeZone, 2000);
        }
      }
    };

    void loadServerTimeZone();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (loading) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"Inter,Arial",color:"#64748b"}}>Loading Simple Syslog Server...</div>;
  if (!user) return <Routes><Route path="*" element={<Login/>}/></Routes>;
  if (user.mustChangePassword) return <Routes><Route path="/change-password" element={<ChangePassword/>}/><Route path="*" element={<Navigate to="/change-password" replace/>}/></Routes>;

  return <div className={`syslog ${sidebarCollapsed ? "syslog--sidebar-collapsed" : ""}`}>
    <ServerTimeZoneContext.Provider value={serverTimeZone}>
    <AppNameContext.Provider value={{appName,setAppName}}>
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} onToggleCollapse={()=>setSidebarCollapsed(v=>!v)} onCloseMobile={()=>setMobileSidebarOpen(false)}/>
      <div className="syslog__workspace">
        <Header onOpenMobile={()=>setMobileSidebarOpen(true)} theme={theme} onToggleTheme={()=>setTheme(v=>v === "light" ? "dark" : "light")} timeZoneInfo={serverTimeZone}/>
        <main className="syslog__content">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/change-password" element={<ChangePassword/>}/>
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/message" element={<Message/>}/>
            <Route path="/setting" element={user.role === "administrator" ? <Setting/> : <Navigate to="/dashboard" replace/>}/>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </main>
      </div>
    </AppNameContext.Provider>
    </ServerTimeZoneContext.Provider>
  </div>;
};
