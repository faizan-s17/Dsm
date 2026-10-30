import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Search, AlertCircle, FileText, Clock, Tag, CheckCircle, Plus, MapPin, Users, Award, Eye } from 'lucide-react';
import "./PostedJobs.css";

const Base_Url = 'http://localhost:5000';

export default function PostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Stats for the dashboard
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    expiredJobs: 0,
    totalApplicants: 0
  });

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError("Authentication required. Please log in again.");
          setLoading(false);
          return;
        }

        // First, get company profile to ensure we have the company ID
        const profileResponse = await axios.get(`${Base_Url}/api/company/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Then fetch jobs for this company
        const jobsResponse = await axios.get(`${Base_Url}/api/company/get-jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (jobsResponse.data && Array.isArray(jobsResponse.data.jobs)) {
          setJobs(jobsResponse.data.jobs);
          
          // Calculate stats
          const now = new Date();
          const activeJobs = jobsResponse.data.jobs.filter(job => new Date(job.expiryDate) > now && job.status !== 'filled');
          const expiredJobs = jobsResponse.data.jobs.filter(job => new Date(job.expiryDate) <= now || job.status === 'filled');
          const totalApplicants = jobsResponse.data.jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);
          
          setStats({
            totalJobs: jobsResponse.data.jobs.length,
            activeJobs: activeJobs.length,
            expiredJobs: expiredJobs.length,
            totalApplicants
          });
        } else {
          console.error("Invalid jobs data format:", jobsResponse.data);
          setJobs([]);
          setError("Error retrieving jobs data. Please try again later.");
        }
      } catch (err) {
        console.error("Error fetching company jobs:", err);
        setError(err.response?.data?.message || "Error fetching jobs. Please try again.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyJobs();
  }, []);

  const handlePostJob = () => {
    navigate('/company-dashboard?tab=postJob');
  };

  const filteredJobs = jobs.filter(job =>
    job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Determine job status based on expiry date
  const getJobStatus = (expiryDate, status) => {
    if (status !== 'active') return status;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return today > expiry ? 'expired' : 'active';
  };

  if (loading) {
    return (
      <div className="jobs-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your job postings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jobs-page">
        <div className="error-container">
          <AlertCircle size={20} />
          <div>
            <h3>Error loading jobs</h3>
            <p>{error}</p>
          </div>
        </div>
        <button 
          className="post-job-button" 
          onClick={handlePostJob}
        >
          <Plus size={18} />
          Post a New Job
        </button>
      </div>
    );
  }

  return (
    <div className="jobs-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Manage Your Job Postings</h1>
          <p>Create, edit, and track all your job postings in one place. Monitor applications and find the perfect candidates for your team.</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-icon">
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalJobs}</h3>
            <p>Total Jobs</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.expiredJobs}</h3>
            <p>Expired/Filled</p>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalApplicants}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search jobs by title, location, or job type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-container">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="no-results">
          <Briefcase size={48} />
          <h2>No Jobs Posted Yet</h2>
          <p>You haven't posted any jobs yet. Create your first job posting to start receiving applications.</p>
          <button 
            className="post-job-button" 
            onClick={handlePostJob}
          >
            <Plus size={18} />
            Post Your First Job
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="no-results">
          <Search size={48} />
          <h2>No Matching Jobs</h2>
          <p>No jobs match your search criteria. Try adjusting your search or post a new job.</p>
          <button 
            className="post-job-button" 
            onClick={handlePostJob}
          >
            <Plus size={18} />
            Post a New Job
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => {
            const currentStatus = getJobStatus(job.expiryDate, job.status);
            return (
              <div key={job._id} className={`job-card ${currentStatus}`}>
                <div className="job-card-header">
                  <div className="job-icon">
                    <Briefcase size={24} />
                  </div>
                  <div className={`job-status ${currentStatus}`}>
                    {currentStatus === 'active' && <CheckCircle size={14} />}
                    {currentStatus === 'expired' && <Clock size={14} />}
                    {currentStatus === 'filled' && <Users size={14} />}
                    {currentStatus === 'draft' && <FileText size={14} />}
                    {currentStatus}
                  </div>
                </div>
                
                <div className="job-card-content">
                  <h3 className="job-title">{job.jobTitle}</h3>
                  
                  <div className="company-info">
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{job.companyName}</span>
                    </div>
                    <div className="info-item">
                      <Mail size={16} />
                      <span>{job.companyEmail}</span>
                    </div>
                  </div>

                  <div className="job-verification">
                    {job.verified ? (
                      <div className="verified">
                        <Award size={16} />
                        <span>Verified by Admin</span>
                      </div>
                    ) : (
                      <div className="not-verified">
                        <AlertCircle size={16} />
                        <span>Pending Verification</span>
                      </div>
                    )}
                  </div>

                  <div className="job-expiry">
                    <Clock size={16} />
                    <span>
                      {new Date(job.expiryDate) > new Date() 
                        ? `Expires on ${formatDate(job.expiryDate)}` 
                        : `Expired on ${formatDate(job.expiryDate)}`}
                    </span>
                  </div>

                  <div className="job-skills">
                    <div className="info-item">
                      <Tag size={16} />
                      Skills Required:
                    </div>
                    <div className="skills-list">
                      {job.skills && job.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                      {job.skills && job.skills.length > 5 && (
                        <span className="skill-tag">+{job.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <div className="job-description">
                    <div className="description-header">
                      <FileText size={16} />
                      <h4>Description</h4>
                    </div>
                    <p>{job.jobDescription}</p>
                  </div>
                  
                  <div className="job-applicants">
                    <div className="applicants-count">
                      <span>
                        <Users size={16} />
                        {job.applicants ? job.applicants.length : 0} Applicants
                      </span>
                      <span>
                        <Eye size={16} />
                        {job.views || 0} Views
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <button 
            className="post-job-button" 
            onClick={handlePostJob}
          >
            <Plus size={18} />
            Post a New Job
          </button>
        </div>
      )}
    </div>
  );
}