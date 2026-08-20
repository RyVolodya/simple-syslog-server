import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiRefreshCw, FiLogOut, FiKey, FiMoon, FiSun } from "react-icons/fi";
import { HiOutlineSignal } from "react-icons/hi2";
import "./Header.scss";
import AppName from "../AppName/AppName";
import { useAuth } from "../../../auth/AuthContext";

type HeaderProps={onOpenMobile:()=>void;theme:"light"|"dark";onToggleTheme:()=>void;timeZoneInfo:{timeZone:string|null;offsetMinutes:number}};
const pageMeta:Record<string,{title:string;eyebrow:string}>={"/dashboard":{title:"Dashboard",eyebrow:"Overview"},"/message":{title:"Messages",eyebrow:"Syslog explorer"},"/setting":{title:"Settings",eyebrow:"Configuration"},"/change-password":{title:"Password",eyebrow:"Account security"}};

const Header:React.FC<HeaderProps>=({onOpenMobile,theme,onToggleTheme,timeZoneInfo})=>{
  const location=useLocation();const navigate=useNavigate();const {user,logout}=useAuth();const meta=pageMeta[location.pathname]||pageMeta["/dashboard"];
  const date=new Intl.DateTimeFormat("en",{timeZone:timeZoneInfo.timeZone || "UTC",weekday:"short",month:"short",day:"numeric"}).format(timeZoneInfo.timeZone ? new Date() : new Date(Date.now()+timeZoneInfo.offsetMinutes*60000));
  return <header className="header"><div className="header__left"><button className="header__mobile-menu" onClick={onOpenMobile} aria-label="Open navigation"><FiMenu size={21}/></button><div className="header__mobile-brand"><AppName/></div><div className="header__page-meta"><span className="header__eyebrow">{meta.eyebrow}</span><h1 className="header__title">{meta.title}</h1></div></div>
  <div className="header__right"><div className="header__date">{date}</div><div className="header__status"><span className="header__status-dot"/><HiOutlineSignal size={17}/><span>Realtime</span></div><div className="header__user"><div className="header__user-avatar">{user?.login.slice(0,2).toUpperCase()}</div><div className="header__user-copy"><strong>{user?.login}</strong><span>{user?.role === "administrator" ? "Administrator" : "Operator"}</span></div></div><button className="header__action" onClick={onToggleTheme} title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"} aria-label="Toggle color theme">{theme === "light" ? <FiMoon size={18}/> : <FiSun size={18}/>}</button><button className="header__action" onClick={()=>navigate('/change-password')} title="Change password"><FiKey size={17}/></button><button className="header__action" onClick={()=>window.location.reload()} title="Refresh"><FiRefreshCw size={18}/></button><button className="header__action" onClick={()=>logout()} title="Sign out"><FiLogOut size={18}/></button></div></header>;
};
export default Header;
