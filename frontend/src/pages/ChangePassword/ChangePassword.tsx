import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiKey } from "react-icons/fi";
import { useAuth } from "../../auth/AuthContext";
import "../Login/Login.scss";

const ChangePassword: React.FC = () => {
  const { user, refreshUser, logout } = useAuth(); const nav=useNavigate();
  const [currentPassword,setCurrent]=useState(""); const [next,setNext]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  if(!user) return <Navigate to="/login" replace/>;
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError("");if(next.length<8)return setError("New password must be at least 8 characters.");if(next!==confirm)return setError("Passwords do not match.");setBusy(true);try{const r=await fetch("/api/auth/change-password",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword,newPassword:next})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Unable to change password");await refreshUser();nav("/dashboard",{replace:true});}catch(e:any){setError(e.message)}finally{setBusy(false)}};
  return <div className="login-page"><div className="login-card"><div className="login-icon"><FiKey/></div><h1>Change your password</h1><p>{user.mustChangePassword ? "You must replace the temporary password before continuing." : "Update your account password."}</p><form onSubmit={submit}><label>Current password<div className="login-input"><input type="password" value={currentPassword} onChange={e=>setCurrent(e.target.value)} autoFocus/></div></label><label>New password<div className="login-input"><input type="password" value={next} onChange={e=>setNext(e.target.value)}/></div></label><label>Confirm new password<div className="login-input"><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></label>{error&&<div className="login-error">{error}</div>}<button disabled={busy}>{busy?"Saving...":"Change password"}</button>{!user.mustChangePassword&&<button type="button" style={{background:'#e2e8f0',color:'#334155'}} onClick={()=>nav(-1)}>Cancel</button>}<button type="button" style={{background:'transparent',color:'#64748b'}} onClick={()=>logout()}>Sign out</button></form></div></div>;
};
export default ChangePassword;
