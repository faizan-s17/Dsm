import React, { useState, useEffect } from "react";
import axios from "axios";
import { Briefcase, Users, CheckCircle, Clock, Building2, Mail, MapPin, Globe, Phone, Calendar, AlertCircle } from "lucide-react";
import "./DashboardStats.css";

export default function DashboardStats({ companyInfo }) {
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    verifiedJobs: 0,
    totalApplicants: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    const fetchCompanyStats = async () => {
      try {
        // If companyInfo is not provided, show an error
        if (!companyInfo) {
          setError("Company information not available. Please try again later.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
          setError("Authentication required. Please log in again.");
          setLoading(false);
          return;
        }

        // Fetch company's jobs
        const response = await axios.get('http://localhost:5000/api/company/get-jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && Array.isArray(response.data.jobs)) {
          const jobs = response.data.jobs;
          
          // Calculate total applicants across all jobs
          const applicantsCount = jobs.reduce((total, job) => {
            return total + (job.applicants ? job.applicants.length : 0);
          }, 0);
          
          // Set stats
          setStats({
            totalJobs: jobs.length,
            activeJobs: jobs.filter(job => job.status === 'active').length,
            verifiedJobs: jobs.filter(job => job.verified === true).length,
            totalApplicants: applicantsCount
          });
          
          // Get 3 most recent jobs
          const sortedJobs = [...jobs].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentJobs(sortedJobs.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching company stats:", err);
        setError("Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyStats();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      <div className="logo-header">
        <img 
          src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
          alt="DSM Logo" 
          className="dashboard-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
          }}
        />
      </div>
      <div className="welcome-section">
        <h1>Welcome, {companyInfo?.name || companyInfo?.companyName || 'Company'}</h1>
        <p>Here's an overview of your job postings and applicants</p>
      </div>

      {/* Company Profile Card */}
      <div className="company-profile-card">
        <div className="profile-header">
          <h2>Company Profile</h2>
        </div>
        <div className="profile-content">
          <div className="profile-info">
            <div className="info-item">
              <Building2 size={18} />
              <span>Name: {companyInfo?.name || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <Mail size={18} />
              <span>Email: {companyInfo?.email || 'Not specified'}</span>
            </div>
            {companyInfo?.location && (
              <div className="info-item">
                <MapPin size={18} />
                <span>Address: {companyInfo.location}</span>
              </div>
            )}
            {companyInfo?.website && (
              <div className="info-item">
                <Globe size={18} />
                <span>Website: {companyInfo.website}</span>
              </div>
            )}
            {companyInfo?.phoneNumber && (
              <div className="info-item">
                <Phone size={18} />
                <span>Phone: {companyInfo.phoneNumber}</span>
              </div>
            )}
            {companyInfo?.createdAt && (
              <div className="info-item">
                <Calendar size={18} />
                <span>Member since: {formatDate(companyInfo.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <Briefcase size={24} />
          </div>
          <div className="stat-details">
            <h3>{stats.totalJobs}</h3>
            <p>Total Jobs Posted</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h3>{stats.verifiedJobs}</h3>
            <p>Verified Jobs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <h3>{stats.totalApplicants}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="recent-jobs-section">
        <h2>Recent Job Postings</h2>
        {recentJobs.length > 0 ? (
          <div className="recent-jobs-list">
            {recentJobs.map(job => (
              <div key={job._id} className="recent-job-card">
                <div className="job-title">
                  <Briefcase size={18} />
                  <h3>{job.jobTitle}</h3>
                </div>
                <div className="job-meta">
                  <div className="meta-item">
                    <Calendar size={16} />
                    <span>Posted: {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="verification-status">
                    {job.verified ? (
                      <div className="verified-badge">
                        <CheckCircle size={16} />
                        <span>Verified</span>
                      </div>
                    ) : (
                      <div className="unverified-badge">
                        <span>Pending Verification</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="applicants-count">
                  <Users size={16} />
                  <span>{job.applicants ? job.applicants.length : 0} Applicants</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-jobs-message">
            <p>You haven't posted any jobs yet.</p>
            <button 
              className="post-job-button"
              onClick={() => window.location.href = '/company-dashboard?tab=postJob'}
            >
              Post Your First Job
            </button>
          </div>
        )}
      </div>
    </div>
  );
}