import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import axios from "axios";
import "./userprofile_css/Profile.css";
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import BadgeChip from '../../components/BadgeChip';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [updatedUser, setUpdatedUser] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const base_url = "http://localhost:5000";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("No auth token found, redirecting to signup");
          navigate("/user-signup");
          return;
        }

        // Decode token to check if it's a user token
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        console.log('Profile page - Current user ID:', tokenData.userId);

        const response = await axios.get(`${base_url}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(response.data);
        setUpdatedUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
        setLoading(false);
        
        if (error.response?.status === 401) {
          console.log("Unauthorized access, redirecting to signup");
          localStorage.removeItem("authToken");
          navigate("/user-signup");
        }
      }
    };

    fetchUserProfile();
    fetchLatestReport();
  }, [navigate]);

  const fetchLatestReport = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const res = await axios.get(`${base_url}/api/user/report/latest`, { headers: { Authorization: `Bearer ${token}` } });
      setLatestReport(res.data.report || null);
    } catch (err) {
      // ignore
    }
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${base_url}/api/user/profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUser(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));
      
      setUpdatedUser(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setUpdatedUser(prev => ({
      ...prev,
      [name]: name === "skills" ? value.split(",").map(skill => skill.trim()) : value
    }));
  };

  const handleAddEducation = () => {
    setUpdatedUser(prev => ({
      ...prev,
      education: [...(prev.education || []), {
        institution: "",
        degree: "",
        field: "",
        graduationYear: ""
      }]
    }));
  };

  const handleAddExperience = () => {
    setUpdatedUser(prev => ({
      ...prev,
      experience: [...(prev.experience || []), {
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        description: ""
      }]
    }));
  };

  const handleAddCertification = () => {
    setUpdatedUser(prev => ({
      ...prev,
      certifications: [...(prev.certifications || []), {
        name: "",
        issuer: "",
        date: "",
        url: ""
      }]
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...updatedUser.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setUpdatedUser({ ...updatedUser, education: newEducation });
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...updatedUser.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setUpdatedUser({ ...updatedUser, experience: newExperience });
  };

  const handleCertificationChange = (index, field, value) => {
    const newCertifications = [...updatedUser.certifications];
    newCertifications[index] = { ...newCertifications[index], [field]: value };
    setUpdatedUser({ ...updatedUser, certifications: newCertifications });
  };

  const handleRemoveEducation = (index) => {
    const newEducation = updatedUser.education.filter((_, i) => i !== index);
    setUpdatedUser({ ...updatedUser, education: newEducation });
  };

  const handleRemoveExperience = (index) => {
    const newExperience = updatedUser.experience.filter((_, i) => i !== index);
    setUpdatedUser({ ...updatedUser, experience: newExperience });
  };

  const handleRemoveCertification = (index) => {
    const newCertifications = updatedUser.certifications.filter((_, i) => i !== index);
    setUpdatedUser({ ...updatedUser, certifications: newCertifications });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.put(
        `${base_url}/api/user/profile`,
        updatedUser,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data.user);
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return <div className="profile-error">No user data found</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture-section">
          <img 
            src={
              updatedUser.profilePicture
                ? `${base_url}${updatedUser.profilePicture}`
                : "/default-avatar.png"
            } 
            alt="Profile" 
            className="profile-picture" 
          />
          {editing && (
            <div className="profile-picture-upload">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleProfilePictureChange} 
                id="profile-picture-input"
                disabled={isUploadingPicture}
              />
              <label htmlFor="profile-picture-input">
                {isUploadingPicture ? "Uploading..." : "Change Picture"}
              </label>
            </div>
          )}
        </div>
        <div className="profile-title">
          <h1>{user.name}'s Profile</h1>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="edit-button">
              <Edit2 size={20} /> Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button onClick={handleSave} className="save-button">
                <Save size={20} /> Save
              </button>
              <button onClick={() => setEditing(false)} className="cancel-button">
                <X size={20} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-nav">
        <button 
          className={activeSection === 'personal' ? 'active' : ''} 
          onClick={() => setActiveSection('personal')}
        >
          Personal Info
        </button>
        <button 
          className={activeSection === 'education' ? 'active' : ''} 
          onClick={() => setActiveSection('education')}
        >
          Education
        </button>
        <button 
          className={activeSection === 'experience' ? 'active' : ''} 
          onClick={() => setActiveSection('experience')}
        >
          Experience
        </button>
        <button 
          className={activeSection === 'certifications' ? 'active' : ''} 
          onClick={() => setActiveSection('certifications')}
        >
          Certifications
        </button>
      </div>

      <div className="profile-content">
        {activeSection === 'personal' && (
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="form-group">
              <label>Name:</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={updatedUser.name}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <p>{user.name}</p>
              )}
            </div>

            <div className="form-group">
              <label>Email:</label>
              <p>{user.email}</p>
            </div>

            <div className="form-group">
              <label>Bio:</label>
              {editing ? (
                <textarea
                  name="bio"
                  value={updatedUser.bio}
                  onChange={handleChange}
                  className="form-textarea"
                />
              ) : (
                <p>{user.bio || "No bio added yet"}</p>
              )}
            </div>

            <div className="form-group">
              <label>Skills:</label>
              {editing ? (
                <input
                  type="text"
                  name="skills"
                  value={updatedUser.skills.join(", ")}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter skills separated by commas"
                />
              ) : (
                <div className="skills-list">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Add Badge Section */}
            <div className="form-group">
              <label>Skill Badge:</label>
              <div className="badge-display">
                <BadgeChip 
                  badgeName={user.badge?.name || "Beginner"} 
                  badgeIcon={user.badge?.icon || "bi bi-star"} 
                  avgScore={user.avgSkillScore || 0} 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Skill Transcript</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={async ()=>{
                  try{
                    setGenerating(true);
                    const token = localStorage.getItem('authToken');
                    const res = await axios.post(`${base_url}/api/user/report/generate`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    setLatestReport(res.data.report);
                    navigator.clipboard?.writeText(res.data.publicUrl || '');
                    alert('Verification link copied to clipboard');
                  }catch(e){
                    console.error(e);alert('Failed to generate report');
                  }finally{setGenerating(false);} 
                }} disabled={generating} className="generate-report-button">{generating ? 'Generating...' : 'Generate Skill Transcript'}</button>

                {latestReport && (
                  <div className="report-card">
                    <div>Latest: {new Date(latestReport.createdAt).toLocaleString()}</div>
                    <button onClick={() => {
                      const frontend = window.location.origin;
                      const url = `${frontend}/verify/${latestReport.publicId}`;
                      navigator.clipboard?.writeText(url);
                      alert('Verification link copied to clipboard');
                    }}>Copy verification link</button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add Skill Scores Section */}
            <div className="form-group">
              <label>Skill Scores:</label>
              {user.skillScores && user.skillScores.length > 0 ? (
                <div className="skill-scores-list">
                  {user.skillScores.map((skillScore, index) => (
                    <div key={index} className="skill-score-item">
                      <span className="skill-name">{skillScore.skill}:</span>
                      <span className={`skill-score-value ${skillScore.score >= 70 ? 'high' : skillScore.score >= 40 ? 'medium' : 'low'}`}>
                        {skillScore.score}%
                      </span>
                      <span className="skill-assessed-date">
                        (Assessed: {new Date(skillScore.assessedAt).toLocaleDateString()})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No skill assessments completed yet</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'education' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Education</h2>
              {editing && (
                <button onClick={handleAddEducation} className="add-button">
                  <Plus size={20} /> Add Education
                </button>
              )}
            </div>
            {updatedUser.education?.map((edu, index) => (
              <div key={index} className="education-item">
                {editing ? (
                  <>
                    <div className="form-row">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                        placeholder="Institution"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                        placeholder="Degree"
                        className="form-input"
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => handleEducationChange(index, "field", e.target.value)}
                        placeholder="Field of Study"
                        className="form-input"
                      />
                      <input
                        type="number"
                        value={edu.graduationYear}
                        onChange={(e) => handleEducationChange(index, "graduationYear", e.target.value)}
                        placeholder="Graduation Year"
                        className="form-input"
                      />
                      <button 
                        onClick={() => handleRemoveEducation(index)}
                        className="remove-button"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="education-display">
                    <h3>{edu.institution}</h3>
                    <p>{edu.degree} in {edu.field}</p>
                    <p>Graduated: {edu.graduationYear}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === 'experience' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Work Experience</h2>
              {editing && (
                <button onClick={handleAddExperience} className="add-button">
                  <Plus size={20} /> Add Experience
                </button>
              )}
            </div>
            {updatedUser.experience?.map((exp, index) => (
              <div key={index} className="experience-item">
                {editing ? (
                  <>
                    <div className="form-row">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                        placeholder="Company"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => handleExperienceChange(index, "position", e.target.value)}
                        placeholder="Position"
                        className="form-input"
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                        className="form-input"
                      />
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                      placeholder="Job Description"
                      className="form-textarea"
                    />
                    <button 
                      onClick={() => handleRemoveExperience(index)}
                      className="remove-button"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                ) : (
                  <div className="experience-display">
                    <h3>{exp.position} at {exp.company}</h3>
                    <p>{new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}</p>
                    <p>{exp.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeSection === 'certifications' && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Certifications</h2>
              {editing && (
                <button onClick={handleAddCertification} className="add-button">
                  <Plus size={20} /> Add Certification
                </button>
              )}
            </div>
            {updatedUser.certifications?.map((cert, index) => (
              <div key={index} className="certification-item">
                {editing ? (
                  <>
                    <div className="form-row">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => handleCertificationChange(index, "name", e.target.value)}
                        placeholder="Certification Name"
                        className="form-input"
                      />
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => handleCertificationChange(index, "issuer", e.target.value)}
                        placeholder="Issuing Organization"
                        className="form-input"
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="date"
                        value={cert.date}
                        onChange={(e) => handleCertificationChange(index, "date", e.target.value)}
                        className="form-input"
                      />
                      <input
                        type="url"
                        value={cert.url}
                        onChange={(e) => handleCertificationChange(index, "url", e.target.value)}
                        placeholder="Certificate URL"
                        className="form-input"
                      />
                      <button 
                        onClick={() => handleRemoveCertification(index)}
                        className="remove-button"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="certification-display">
                    <h3>{cert.name}</h3>
                    <p>Issued by {cert.issuer}</p>
                    <p>Date: {new Date(cert.date).toLocaleDateString()}</p>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="cert-link">
                        View Certificate
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
