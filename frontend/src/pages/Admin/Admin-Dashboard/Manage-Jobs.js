import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, 
  Trash2, 
  Briefcase, 
  Building2, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Filter, 
  CheckCircle, 
  Edit, 
  AlertTriangle, 
  Tag, 
  Mail, 
  Users, 
  Globe, 
  Phone, 
  MapPin, 
  Info, 
  ChevronDown, 
  ChevronUp,
  RefreshCw
} from "lucide-react";
import "./Manage-Jobs.css";

const ManageJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all"); // all, active, closed, verified, unverified
    const [companyFilter, setCompanyFilter] = useState("all");
    const [expandedJobId, setExpandedJobId] = useState(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        verifiedJobs: 0,
        recentJobs: 0,
        totalCompanies: 0
    });

    useEffect(() => {
        fetchJobs();
        fetchCompanies();
    }, []);

    // Fetch Jobs from Backend
    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get the token from localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication required. Please log in again.");
                setLoading(false);
                return;
            }
            
            const response = await axios.get("http://localhost:5000/api/admin/jobs", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Ensure we have an array of jobs
            const jobsData = response.data.jobs || response.data || [];
            
            if (!Array.isArray(jobsData)) {
                console.error("API did not return an array:", jobsData);
                setJobs([]);
                setError("Invalid data format received from server");
                return;
            }
            
            setJobs(jobsData);
            
            // Calculate stats
            const currentDate = new Date();
            const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));
            
            setStats(prevStats => ({
                ...prevStats,
                totalJobs: jobsData.length,
                activeJobs: jobsData.filter(job => job.status !== 'closed').length,
                verifiedJobs: jobsData.filter(job => job.verified === true).length,
                recentJobs: jobsData.filter(job => new Date(job.createdAt) > thirtyDaysAgo).length
            }));
        } catch (error) {
            console.error("Error fetching jobs:", error);
            if (error.response && error.response.status === 403) {
                setError("Access denied. Admin privileges required.");
            } else {
                setError("Failed to fetch jobs. Please try again later.");
            }
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Companies from Backend
    const fetchCompanies = async () => {
        try {
            // Get the token from localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error("Authentication required. Please log in again.");
                setCompanies([]);
                return;
            }
            
            const response = await axios.get("http://localhost:5000/api/admin/companies", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Ensure we have an array of companies
            const companiesData = response.data.companies || response.data || [];
            
            if (!Array.isArray(companiesData)) {
                console.error("API did not return an array for companies:", companiesData);
                setCompanies([]);
                return;
            }
            
            setCompanies(companiesData);
            
            // Update stats with company count
            setStats(prevStats => ({
                ...prevStats,
                totalCompanies: companiesData.length
            }));
        } catch (error) {
            console.error("Error fetching companies:", error);
            setCompanies([]);
        }
    };

    // Handle Job Deletion
    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError("Authentication required. Please log in again.");
                    return;
                }
                
                await axios.delete(`http://localhost:5000/api/jobs/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                fetchJobs();
            } catch (error) {
                console.error("Error deleting job:", error);
                setError("Failed to delete job. Please try again.");
            }
        }
    };

    // Handle Job Verification
    const handleVerify = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication required. Please log in again.");
                return;
            }
            
            await axios.put(`http://localhost:5000/api/admin/verify-job/${id}`, {
                verified: !currentStatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchJobs();
        } catch (error) {
            console.error("Error verifying job:", error);
            setError("Failed to update verification status. Please try again.");
        }
    };

    // Handle Job Status Toggle
    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication required. Please log in again.");
                return;
            }
            
            const newStatus = currentStatus === 'closed' ? 'active' : 'closed';
            await axios.put(`http://localhost:5000/api/jobs/${id}`, {
                status: newStatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchJobs();
        } catch (error) {
            console.error("Error updating job status:", error);
            setError("Failed to update job status. Please try again.");
        }
    };

    // Toggle job expansion
    const toggleJobExpansion = (jobId) => {
        setExpandedJobId(expandedJobId === jobId ? null : jobId);
    };

    // Get company details by ID
    const getCompanyById = (companyId) => {
        return companies.find(company => company._id === companyId) || null;
    };

    // Filter and search jobs
    const filteredJobs = jobs.filter(job => {
        // Get company name from either job.companyName or job.company.name
        const companyName = job.companyName || 
            (job.company && typeof job.company === 'object' && job.company.name) || 
            '';
        
        const matchesSearch = 
            job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.jobDescription?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatusFilter = 
            filter === "all" || 
            (filter === "active" && job.status !== "closed") ||
            (filter === "closed" && job.status === "closed") ||
            (filter === "verified" && job.verified === true) ||
            (filter === "unverified" && job.verified !== true);

        const matchesCompanyFilter = 
            companyFilter === "all" || 
            (job.company && job.company._id === companyFilter) || 
            job.company === companyFilter;

        return matchesSearch && matchesStatusFilter && matchesCompanyFilter;
    });

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Calculate days remaining until expiry
    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return 0;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = Math.abs(expiry - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Check if job is expired
    const isJobExpired = (expiryDate) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        return today > expiry;
    };

    return (
        <div className="manage-jobs-container">
            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-card">
                    <Briefcase size={24} className="stat-icon" />
                    <div className="stat-number">{stats.totalJobs}</div>
                    <div className="stat-label">Total Jobs</div>
                </div>
                <div className="stat-card">
                    <Building2 size={24} className="stat-icon" />
                    <div className="stat-number">{stats.totalCompanies}</div>
                    <div className="stat-label">Companies</div>
                </div>
                <div className="stat-card">
                    <CheckCircle size={24} className="stat-icon" />
                    <div className="stat-number">{stats.verifiedJobs}</div>
                    <div className="stat-label">Verified Jobs</div>
                </div>
                <div className="stat-card">
                    <Clock size={24} className="stat-icon" />
                    <div className="stat-number">{stats.activeJobs}</div>
                    <div className="stat-label">Active Jobs</div>
                </div>
                <div className="stat-card">
                    <Calendar size={24} className="stat-icon" />
                    <div className="stat-number">{stats.recentJobs}</div>
                    <div className="stat-label">Recent Posts (30 days)</div>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="action-bar">
                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search jobs by title, company, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-options">
                    <div className="filter-group">
                        <Filter size={18} />
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                            <option value="all">All Status</option>
                        <option value="active">Active Jobs</option>
                        <option value="closed">Closed Jobs</option>
                            <option value="verified">Verified Jobs</option>
                            <option value="unverified">Unverified Jobs</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <Building2 size={18} />
                        <select 
                            value={companyFilter} 
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Companies</option>
                            {companies.map(company => (
                                <option key={company._id} value={company._id}>
                                    {company.name || company.companyName}
                                </option>
                            ))}
                    </select>
                    </div>
                    
                    <button className="refresh-button" onClick={() => {
                        fetchJobs();
                        fetchCompanies();
                    }}>
                        <RefreshCw size={18} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Job List */}
            <div className="job-list">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading jobs...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>No Jobs Found</h3>
                        <p>No jobs found matching your search criteria.</p>
                    </div>
                ) : (
                    filteredJobs.map((job) => {
                        const company = getCompanyById(job.company);
                        const isExpanded = expandedJobId === job._id;
                        const expired = isJobExpired(job.expiryDate);
                        
                        return (
                            <div key={job._id} className={`job-card ${isExpanded ? 'expanded' : ''} ${expired ? 'expired' : ''}`}>
                                <div className="job-card-header">
                                    <div className="job-title-section">
                                        <h3>{job.jobTitle}</h3>
                                        <div className="job-badges">
                            <div className="job-status-badge" data-status={job.status || 'active'}>
                                {job.status || 'Active'}
                            </div>
                                            {job.verified ? (
                                                <div className="verification-badge verified">
                                                    <CheckCircle size={16} />
                                                    <span>Verified</span>
                                                </div>
                                            ) : (
                                                <div className="verification-badge unverified">
                                                    <AlertTriangle size={16} />
                                                    <span>Unverified</span>
                                                </div>
                                            )}
                                            {expired && (
                                                <div className="expiry-badge">
                                                    <Clock size={16} />
                                                    <span>Expired</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        className="expand-button"
                                        onClick={() => toggleJobExpansion(job._id)}
                                    >
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>
                                
                                <div className="job-company-info">
                                    <div className="company-logo">
                                        {company && company.logo ? (
                                            <img 
                                                src={`http://localhost:5000${company.logo.startsWith('/') ? '' : '/'}${company.logo}`} 
                                                alt={company.name || company.companyName} 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = ""; // Clear the src
                                                    e.target.style.display = "none"; // Hide the img
                                                    e.target.parentNode.innerHTML = '<div class="fallback-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>';
                                                }}
                                            />
                                        ) : (
                                            <Building2 size={24} />
                                        )}
                                    </div>
                                    <div className="company-details">
                                        <h4>{job.companyName}</h4>
                                        <div className="company-meta">
                                            <span className="company-email">
                                                <Mail size={14} />
                                                {job.companyEmail}
                                            </span>
                                            {company && company.location && (
                                                <span className="company-location">
                                                    <MapPin size={14} />
                                                    {company.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="job-dates">
                                    <div className="date-item">
                                        <Calendar size={16} />
                                        <span>Posted: {formatDate(job.createdAt)}</span>
                                    </div>
                                    <div className="date-item">
                                        <Clock size={16} />
                                        <span>Expires: {formatDate(job.expiryDate)}</span>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="job-expanded-content">
                                        <div className="job-skills">
                                            <h4>
                                                <Tag size={16} />
                                                Skills Required
                                            </h4>
                                            <div className="skills-list">
                                                {job.skills && job.skills.length > 0 ? (
                                                    job.skills.map((skill, index) => (
                                                        <span key={index} className="skill-tag">{skill}</span>
                                                    ))
                                                ) : (
                                                    <span className="no-skills">No skills specified</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="job-description">
                                            <h4>
                                                <Info size={16} />
                                                Job Description
                                            </h4>
                                            <p>{job.jobDescription}</p>
                                        </div>
                                        
                                        {company && (
                                            <div className="company-full-details">
                                                <h4>
                                                    <Building2 size={16} />
                                                    Company Details
                                                </h4>
                                                <div className="company-info-grid">
                                                    {company.industry && (
                                                        <div className="company-info-item">
                                                            <Briefcase size={16} />
                                                            <span>Industry: {company.industry}</span>
                                                        </div>
                                                    )}
                                                    {company.size && (
                                                        <div className="company-info-item">
                                                            <Users size={16} />
                                                            <span>Size: {company.size}</span>
                                                        </div>
                                                    )}
                                                    {company.website && (
                                                        <div className="company-info-item">
                                                            <Globe size={16} />
                                                            <span>
                                                                Website: <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
                                                            </span>
                                                        </div>
                                                    )}
                                                    {company.phoneNumber && (
                                                        <div className="company-info-item">
                                                            <Phone size={16} />
                                                            <span>Phone: {company.phoneNumber}</span>
                                                        </div>
                                                    )}
                                                    {company.foundedYear && (
                                                        <div className="company-info-item">
                                                            <Calendar size={16} />
                                                            <span>Founded: {company.foundedYear}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {company.description && (
                                                    <div className="company-description">
                                                        <h5>About Company</h5>
                                                        <p>{company.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="applicants-section">
                                            <h4>
                                                <Users size={16} />
                                                Applicants
                                            </h4>
                                            <div className="applicants-count">
                                                {job.applicants ? job.applicants.length : 0} applicants for this position
                                    </div>
                                </div>
                            </div>
                                )}
                                
                            <div className="job-actions">
                                    <button 
                                        className={`verify-button ${job.verified ? 'verified' : 'unverified'}`}
                                        onClick={() => handleVerify(job._id, job.verified)}
                                    >
                                        {job.verified ? (
                                            <>
                                                <AlertTriangle size={16} /> Unverify
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} /> Verify
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="toggle-status-button"
                                        onClick={() => handleToggleStatus(job._id, job.status)}
                                    >
                                        {job.status === 'closed' ? (
                                            <>
                                                <CheckCircle size={16} /> Activate
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={16} /> Close
                                            </>
                                        )}
                                    </button>
                                <button 
                                    className="delete-button"
                                    onClick={() => handleDelete(job._id)}
                                >
                                        <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ManageJobs;
