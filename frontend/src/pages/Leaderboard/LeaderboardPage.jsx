import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './LeaderboardPage.css';

export default function LeaderboardPage(){
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [skills, setSkills] = useState([]);
  const [period, setPeriod] = useState('weekly');
  const [skill, setSkill] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(()=>{ fetchSkills(); }, []);

  useEffect(()=>{ if(skill) fetchLeaderboard(); }, [skill, period]);

  const fetchSkills = async ()=>{
    try{
      const res = await axios.get(`${base}/api/leaderboard/skills`);
      setSkills(res.data.skills || []);
      if((res.data.skills||[]).length>0) setSkill(res.data.skills[0]);
    }catch(e){ console.error(e); }
  };

  const fetchLeaderboard = async ()=>{
    setLoading(true); setError('');
    try{
      const res = await axios.get(`${base}/api/leaderboard/${period}/${skill}`);
      setEntries(res.data.entries || []);
    }catch(e){
      console.error(e); setError('Failed to load leaderboard');
    }finally{ setLoading(false); }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <h2>Top Learners Leaderboard</h2>
        <div className="controls">
          <div className="period-toggle">
            <button className={period==='weekly'? 'active':''} onClick={()=>setPeriod('weekly')}>Weekly</button>
            <button className={period==='monthly'? 'active':''} onClick={()=>setPeriod('monthly')}>Monthly</button>
          </div>
          <div className="skill-select">
            <select value={skill} onChange={e=>setSkill(e.target.value)}>
              {skills.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <div>
            {error && <div className="error">{error}</div>}
            {entries.length===0 ? <div className="empty">No entries for this period</div> : (
              <table className="leaderboard-table">
                <thead><tr><th>Rank</th><th>Name</th><th>Badge</th><th>Score</th><th>Last Assessed</th></tr></thead>
                <tbody>
                  {entries.map((e, idx)=> (
                    <tr key={String(e.userId)} className={idx<3? 'top':''}>
                      <td>{idx+1}</td>
                      <td className="name-cell">
                        <img src={e.profilePicture || '/assets/images/default-avatar.png'} alt="avatar" className="avatar" />
                        <div>{e.displayName}</div>
                      </td>
                      <td>{e.badge?.name ? (<span><i className={e.badge?.icon} style={{marginRight:8}}></i>{e.badge.name}</span>) : '—'}</td>
                      <td>{e.score}</td>
                      <td>{e.lastAssessedAt? new Date(e.lastAssessedAt).toLocaleDateString() : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
