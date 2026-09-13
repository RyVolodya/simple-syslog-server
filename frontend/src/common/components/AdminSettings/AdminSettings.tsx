import React,{useState} from "react";
import { FiShield } from "react-icons/fi";
import { useAuth } from "../../../auth/AuthContext";
import UserList from "../UserList/UserList";
import AddUserModal from "../AddUserModal/AddUserModal";
const AdminSettings:React.FC=()=>{const{user}=useAuth();const[modal,setModal]=useState(false);const administrator=user?.role==="administrator";return <section className="settings-card settings-card--wide"><div className="settings-card__header"><div className="settings-card__icon"><FiShield/></div><div><h2>User access</h2><p>{administrator?"Manage Administrator and Operator accounts.":"Manage your account password."}</p></div></div><div className="settings-card__body"><div className="settings-users settings-users--standalone"><div className="settings-users__topbar"><div><h3>User accounts</h3><p className="settings-users__description">{administrator?"Create users or use Edit to change username, password and access role.":"Operators can edit only their own password."}</p></div>{administrator&&<button className="settings-button" onClick={()=>setModal(true)}>Add user</button>}</div><AddUserModal open={modal} onClose={()=>setModal(false)}/><UserList/></div></div></section>};
export default AdminSettings;
