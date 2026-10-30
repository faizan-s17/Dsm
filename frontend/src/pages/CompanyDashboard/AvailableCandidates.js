import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, User, Briefcase, MapPin, Award, FileText, Send, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import "./AvailableCandidates.css";
import BadgeChip from '../../components/BadgeChip';

export default function AvailableCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingEmails, setSendingEmails] = useState({});
  const [emailSuccess, setEmailSuccess] = useState({});
  const [emailError, setEmailError] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:5000/api/user/get-all-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data.users)) {
        setCandidates(response.data.users);
      } else {
        setCandidates([]);
        setError("No candidates found or invalid data format.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(err.response?.data?.message || "Failed to load candidates. Please try again.");
      setLoading(false);
    }
  };

  const handleOfferJob = async (candidateEmail, candidateId) => {
    // Check if already sending or already successful for this candidate
    if (sendingEmails[candidateId] || emailSuccess[candidateId]) {
      return;
    }
    
    // Set sending state for this specific candidate only
    setSendingEmails(prev => ({ ...prev, [candidateId]: true }));
    
    // Clear any previous errors for this candidate
    setEmailError(prev => ({ ...prev, [candidateId]: null }));
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setEmailError(prev => ({ ...prev, [candidateId]: "Authentication required" }));
        setSendingEmails(prev => ({ ...prev, [candidateId]: false }));
        return;
      }

      // Add a small delay to simulate network request (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call API endpoint to send email
      const response = await axios.post("http://localhost:5000/api/send-job-offer", 
        { email: candidateEmail },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Set success state for this specific candidate only
      setEmailSuccess(prev => ({ ...prev, [candidateId]: true }));
      
      // Clear sending state for this specific candidate
      setSendingEmails(prev => ({ ...prev, [candidateId]: false }));
      
      // Show success notification
      setNotification({
        show: true,
        message: "Job offer email sent successfully!",
        type: "success"
      });
    } catch (err) {
      console.error("Error sending job offer email:", err);
      
      // Set error state for this specific candidate only
      setEmailError(prev => ({ 
        ...prev, 
        [candidateId]: err.response?.data?.message || "Failed to send email. Please try again." 
      }));
      
      // Clear sending state for this specific candidate
      setSendingEmails(prev => ({ ...prev, [candidateId]: false }));
      
      // Show error notification
      setNotification({
        show: true,
        message: "Failed to send job offer email",
        type: "error"
      });
    }
  };

  // Filter candidates based on search term
  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return candidates;
    
    return candidates.filter(candidate => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = candidate.name?.toLowerCase().includes(searchLower);
      const emailMatch = candidate.email?.toLowerCase().includes(searchLower);
      const skillsMatch = candidate.skills?.some(skill => 
        skill.toLowerCase().includes(searchLower)
      );
      
      return nameMatch || emailMatch || skillsMatch;
    });
  }, [candidates, searchTerm]);

  if (loading) {
    return (
      <div className="candidates-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading candidates...</p>
          <span>Please wait while we fetch the available candidates</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candidates-page">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Error Loading Candidates</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => {
              setError("");
              setLoading(true);
              fetchCandidates();
            }}
          >
            <RefreshCw size={16} />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="candidates-page">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="hero-section">
        <div className="hero-content">
          <h1>Available Candidates</h1>
          <p>Browse and connect with potential candidates for your job openings</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search candidates by name or skills..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="no-results">
          <FileText size={48} />
          <h3>No Candidates Found</h3>
          <p>We couldn't find any candidates matching your search criteria.</p>
          {searchTerm && (
            <button 
              className="retry-button"
              onClick={() => setSearchTerm("")}
            >
              <RefreshCw size={16} />
              <span>Clear Search</span>
            </button>
          )}
        </div>
      ) : (
        <div className="candidates-grid">
          {filteredCandidates.map((candidate) => (
            <div key={candidate._id} className="candidate-card">
              <div className="candidate-header">
                <div className="candidate-avatar">
                  <User size={28} />
                </div>
                <h3>{candidate.name || 'Unnamed Candidate'}</h3>
                <span className="candidate-email">{candidate.email}</span>
                <div className="candidate-badge">
                  <BadgeChip 
                    badgeName={candidate.badge?.name || "Beginner"} 
                    badgeIcon={candidate.badge?.icon || "bi bi-star"} 
                    avgScore={candidate.avgSkillScore || 0} 
                  />
                </div>
              </div>
              
              <div className="candidate-details">
                {candidate.skills && candidate.skills.length > 0 ? (
                  <div className="skills-section">
                    <h4>Skills</h4>
                    <div className="skills-list">
                      {candidate.skills.map((skill, index) => {
                        // Find the corresponding skill score
                        const skillScore = candidate.skillScores 
                          ? candidate.skillScores.find(s => s.skill === skill) 
                          : null;
                        
                        return (
                          <div key={index} className="skill-item">
                            <span className="skill-tag">{skill}</span>
                            {skillScore && (
                              <span className={`skill-score ${skillScore.score >= 70 ? 'high' : skillScore.score >= 40 ? 'medium' : 'low'}`}>
                                {skillScore.score}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="skills-section">
                    <h4>Skills</h4>
                    <p>No skills listed</p>
                  </div>
                )}
                

                
                {candidate.experience && candidate.experience.length > 0 && (
                  <div className="detail-item">
                    <Briefcase size={18} />
                    <div className="experience-list">
                      {candidate.experience.map((exp, index) => (
                        <span key={index} className="experience-item">
                          {exp.position} at {exp.company} ({exp.startDate ? new Date(exp.startDate).getFullYear() : 'N/A'} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {candidate.location && (
                  <div className="detail-item">
                    <MapPin size={18} />
                    <span>Location: {candidate.location}</span>
                  </div>
                )}
                
                {candidate.education && candidate.education.length > 0 && (
                  <div className="detail-item">
                    <Award size={18} />
                    <div className="education-list">
                      {candidate.education.map((edu, index) => (
                        <span key={index} className="education-item">
                          {edu.degree} in {edu.field} from {edu.institution} ({edu.graduationYear || 'N/A'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!candidate.experience && !candidate.location && !candidate.education && (
                  <div className="detail-item">
                    <AlertCircle size={18} />
                    <span>No additional details available</span>
                  </div>
                )}
              </div>
              
              <div className="candidate-actions">
                {emailSuccess[candidate._id] ? (
                  <button 
                    className="offer-job-button success"
                    disabled={true}
                  >
                    <CheckCircle size={18} />
                    <span>Email Sent</span>
                  </button>
                ) : (
                  <button 
                    className={`offer-job-button ${sendingEmails[candidate._id] ? 'sending' : ''}`}
                    onClick={() => handleOfferJob(candidate.email, candidate._id)}
                    disabled={sendingEmails[candidate._id]}
                  >
                    {sendingEmails[candidate._id] ? (
                      <>
                        <span>Sending...</span>
                        <div className="button-spinner"></div>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Offer Job</span>
                      </>
                    )}
                  </button>
                )}
                
                {emailError[candidate._id] && (
                  <div className="email-error-message">
                    <AlertCircle size={16} />
                    <span>{emailError[candidate._id]}</span>
                  </div>
                )}

                {candidate.latestReportPublicId && (
                  <div className="candidate-report-link">
                    <button
                      className="view-report-button"
                      onClick={() => window.open(`/verify/${candidate.latestReportPublicId}`, '_blank')}
                    >
                      View Verified Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
