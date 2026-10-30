import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './VerifyReportPage.css';

export default function VerifyReportPage(){
  const { publicId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${base}/api/verify/${publicId}`);
        setReport(res.data.report);
      } catch (err) {
        console.error('Error fetching report', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [publicId, base]);

  if (loading) return <div className="verify-loading">Loading report...</div>;
  if (!report) return <div className="verify-error">Report not found</div>;

  const timelineData = (report.timeline || []).map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    avgScore: item.avgScore
  }));

  return (
    <div className="verify-page">
      <div className="verify-card">
        <h2>Verified Report</h2>
        <div className="verified-meta">
          <div className="badge-block">
            <div className="badge-icon">{report.badge?.icon}</div>
            <div className="badge-name">{report.badge?.name}</div>
          </div>
          <div className="score-block">
            <div className="avg-score">Average Score: {report.avgSkillScore || 0}%</div>
            <div className="generated">Generated: {new Date(report.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="top-skills">
          <h4>Top Skills</h4>
          <ul>
            {(report.topSkills || []).map((s, i) => (
              <li key={i}>{s.skill} — {s.score}%</li>
            ))}
          </ul>
        </div>

        <div className="timeline-graph">
          <h4>Improvement Over Time</h4>
          {timelineData.length === 0 ? (
            <p>No timeline data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#8884d8" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="skill-snapshot">
          <h4>Assessment Dates & Scores</h4>
          <ul>
            {(report.skillScoresSnapshot || []).map((s, i) => (
              <li key={i}>{s.skill}: {s.score}% — {s.assessedAt ? new Date(s.assessedAt).toLocaleDateString() : 'N/A'}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
