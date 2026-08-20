import React,{useEffect,useState} from "react";
import { FiClock } from "react-icons/fi";
import { useGetIntervalQuery,useUpdateIntervalMutation } from "../../services/IntervalMessages/IntervalMessages";

const MessageSaveInterval:React.FC=()=>{
  const {data,isLoading}=useGetIntervalQuery();const [updateRetention,{isLoading:isSaving}]=useUpdateIntervalMutation();
  const [editing,setEditing]=useState(false);const [days,setDays]=useState(365);const [feedback,setFeedback]=useState<{type:"success"|"error";text:string}|null>(null);
  useEffect(()=>{if(data)setDays(data.days)},[data]);
  const save=async()=>{if(!Number.isInteger(days)||days<1){setFeedback({type:"error",text:"Retention must be at least 1 day."});return;}try{await updateRetention({days}).unwrap();setEditing(false);setFeedback({type:"success",text:`Messages will be kept for ${days} day${days===1?"":"s"}.`})}catch(e:any){setFeedback({type:"error",text:e?.data?.message||"Unable to update message retention."})}};
  return <section className="settings-card settings-card--wide"><div className="settings-card__header"><div className="settings-card__icon"><FiClock/></div><div><h2>Message retention</h2><p>Choose how many days syslog messages are kept in PostgreSQL.</p></div></div><div className="settings-card__body"><div className="settings-row"><div className="settings-field"><label htmlFor="retentionDays">Retention period (days)</label><div style={{display:'flex',alignItems:'center',gap:10}}><input id="retentionDays" className="settings-input" type="number" min={1} step={1} value={days} disabled={!editing||isSaving||isLoading} onChange={e=>setDays(Math.max(1,Number(e.target.value)||1))}/><span style={{color:'#64748b',fontWeight:700}}>days</span></div><small style={{color:'#94a3b8'}}>Default: 365 days. Minimum: 1 day. Cleanup runs daily.</small></div>{!editing?<button className="settings-button settings-button--secondary" onClick={()=>{setEditing(true);setFeedback(null)}} disabled={isLoading}>Edit</button>:<button className="settings-button" onClick={save} disabled={isSaving}>{isSaving?"Saving...":"Save"}</button>}</div>{feedback&&<div className={`settings-feedback settings-feedback--${feedback.type}`}>{feedback.text}</div>}</div></section>;
};
export default MessageSaveInterval;
