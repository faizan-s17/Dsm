import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, Mail, Calendar, Tag, Clock, Search, FileText, ChevronRight } from 'lucide-react';
import './PostJobForm.css';

// Base URL for API calls
const Base_Url = 'http://localhost:5000';

// Update the JOB_CATEGORIES to focus on Computer Science jobs
const JOB_CATEGORIES = {
  "Software Development": [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile App Developer",
    "Game Developer",
    "DevOps Engineer",
    "QA Engineer",
    "Software Architect",
    "Embedded Systems Engineer",
    "iOS Developer",
    "Android Developer",
    "React Developer",
    "Node.js Developer",
    "Python Developer",
    "Java Developer",
    "C++ Developer",
    ".NET Developer",
    "Go Developer",
    "Rust Developer",
    "Ruby Developer",
    "PHP Developer",
    "TypeScript Developer",
    "Angular Developer",
    "Vue.js Developer",
    "Flutter Developer",
    "Kotlin Developer",
    "Swift Developer",
    "Software Development Engineer",
    "Junior Developer",
    "Senior Developer",
    "Principal Engineer",
    "Tech Lead"
  ],
  "Data Science & AI": [
    "Data Scientist",
    "Machine Learning Engineer",
    "AI Engineer",
    "Data Analyst",
    "Business Intelligence Analyst",
    "Data Engineer",
    "Research Scientist",
    "Computer Vision Engineer",
    "NLP Engineer",
    "Deep Learning Specialist",
    "Big Data Engineer",
    "Data Architect",
    "Machine Learning Scientist",
    "AI Researcher",
    "MLOps Engineer",
    "Statistical Analyst",
    "Predictive Modeler",
    "Data Mining Specialist",
    "Analytics Consultant"
  ],
  "Cybersecurity": [
    "Security Engineer",
    "Penetration Tester",
    "Security Analyst",
    "Cybersecurity Specialist",
    "Information Security Officer",
    "Security Architect",
    "Ethical Hacker",
    "Security Consultant",
    "Incident Responder",
    "Forensics Analyst",
    "Vulnerability Assessor",
    "SOC Analyst",
    "Security Operations Center Manager",
    "Compliance Analyst",
    "Risk Assessment Specialist",
    "Network Security Engineer",
    "Application Security Engineer",
    "Identity and Access Management Specialist",
    "Cloud Security Engineer"
  ],
  "Cloud & Infrastructure": [
    "Cloud Engineer",
    "Cloud Architect",
    "System Administrator",
    "Network Engineer",
    "Database Administrator",
    "Site Reliability Engineer",
    "Infrastructure Engineer",
    "Solutions Architect",
    "AWS Solutions Architect",
    "Azure Cloud Engineer",
    "Google Cloud Engineer",
    "Cloud DevOps Engineer",
    "Platform Engineer",
    "Infrastructure Architect",
    "Cloud Security Engineer",
    "Cloud Migration Specialist",
    "Containerization Engineer",
    "Microservices Architect",
    "Cloud Cost Optimization Specialist"
  ],
  "IT Support & Management": [
    "IT Support Specialist",
    "IT Project Manager",
    "Technical Support Engineer",
    "IT Consultant",
    "IT Manager",
    "Technical Lead",
    "CTO",
    "IT Director",
    "Project Coordinator",
    "Program Manager",
    "Scrum Master",
    "Product Owner",
    "Technical Recruiter",
    "IT Business Analyst",
    "Change Management Specialist",
    "Service Desk Manager",
    "Operations Manager",
    "Digital Transformation Manager",
    "Innovation Manager"
  ],
  "DevOps & Automation": [
    "DevOps Engineer",
    "Site Reliability Engineer",
    "Platform Engineer",
    "Release Manager",
    "Build Engineer",
    "CI/CD Pipeline Engineer",
    "Configuration Manager",
    "Infrastructure Automation Engineer",
    "Cloud Automation Engineer",
    "Deployment Engineer",
    "Monitoring and Alerting Engineer",
    "Performance Engineer",
    "Chaos Engineer",
    "Infrastructure as Code Engineer",
    "Container Orchestration Engineer",
    "Docker Specialist",
    "Kubernetes Administrator",
    "Terraform Engineer",
    "Ansible Specialist",
    "Jenkins Administrator"
  ],
  "Database & Analytics": [
    "Database Administrator",
    "Database Developer",
    "Database Architect",
    "Data Warehouse Engineer",
    "ETL Developer",
    "BI Developer",
    "SQL Developer",
    "MongoDB Developer",
    "PostgreSQL DBA",
    "MySQL DBA",
    "Oracle DBA",
    "Database Performance Tuner",
    "Data Modeling Specialist",
    "Database Security Specialist",
    "Database Migration Specialist",
    "NoSQL Database Specialist",
    "Graph Database Engineer",
    "Time Series Database Specialist",
    "Database Backup and Recovery Specialist",
    "Database Compliance Specialist"
  ],
  "UI/UX & Design": [
    "UI Designer",
    "UX Designer",
    "UX Researcher",
    "UI Developer",
    "Frontend Developer",
    "Visual Designer",
    "Interaction Designer",
    "Product Designer",
    "Graphic Designer",
    "Motion Graphics Designer",
    "UX Writer",
    "Accessibility Designer",
    "Design Systems Engineer",
    "Prototype Developer",
    "Information Architect",
    "User Researcher",
    "Usability Analyst",
    "Visual Interface Designer",
    "Experience Designer",
    "Digital Product Designer"
  ],
  "Mobile Development": [
    "Mobile App Developer",
    "iOS Developer",
    "Android Developer",
    "React Native Developer",
    "Flutter Developer",
    "Cross-Platform Developer",
    "Mobile UI/UX Designer",
    "Mobile DevOps Engineer",
    "Mobile Security Specialist",
    "Mobile Performance Engineer",
    "Mobile Testing Engineer",
    "Mobile Architect",
    "Mobile Product Manager",
    "Mobile Accessibility Specialist",
    "Mobile Analytics Specialist",
    "App Store Optimization Specialist",
    "Mobile Backend Developer",
    "Mobile Game Developer",
    "AR/VR Mobile Developer",
    "Progressive Web App Developer"
  ],
  "Emerging Technologies": [
    "Blockchain Developer",
    "Smart Contract Developer",
    "Web3 Developer",
    "Cryptocurrency Engineer",
    "DeFi Developer",
    "NFT Developer",
    "IoT Engineer",
    "Robotics Engineer",
    "AR/VR Developer",
    "Metaverse Developer",
    "Computer Vision Specialist",
    "AR/VR UX Designer",
    "3D Graphics Programmer",
    "Spatial Computing Engineer",
    "Edge Computing Engineer",
    "Quantum Computing Researcher",
    "Biometric Systems Engineer",
    "Autonomous Systems Engineer",
    "Drone Systems Engineer",
    "Digital Twin Engineer"
  ]
};

// Flatten job titles for the select dropdown
const ALL_CS_JOBS = [];
Object.entries(JOB_CATEGORIES).forEach(([category, jobs]) => {
  jobs.forEach(job => {
    ALL_CS_JOBS.push({ category, title: job });
  });
});

// Sort jobs alphabetically by title
ALL_CS_JOBS.sort((a, b) => a.title.localeCompare(b.title));

// Function to get job title suggestions based on input
const getJobTitleSuggestions = (input) => {
  if (!input) return [];
  
  const inputLower = input.toLowerCase();
  
  // First, try to find exact matches
  const exactMatches = ALL_CS_JOBS.filter(job => 
    job.title.toLowerCase().includes(inputLower)
  );
  
  // If we have exact matches, return those
  if (exactMatches.length > 0) {
    return exactMatches.slice(0, 5); // Limit to 5 suggestions
  }
  
  // Otherwise, try to find partial matches (words)
  const partialMatches = ALL_CS_JOBS.filter(job => 
    job.title.toLowerCase().split(' ').some(word => word.startsWith(inputLower))
  );
  
  return partialMatches.slice(0, 5); // Limit to 5 suggestions
};

// Function to get the category of a job title
const getJobCategory = (jobTitle) => {
  for (const [category, titles] of Object.entries(JOB_CATEGORIES)) {
    if (titles.includes(jobTitle)) {
      return category;
    }
  }
  return null;
};

export default function PostJobForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    companyEmail: '',
    jobDescription: '',
    skills: [],
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const suggestionsRef = useRef(null);
  
  // Initialize loading state for company data specifically
  const [loadingCompanyData, setLoadingCompanyData] = useState(true);
  
  // Add state for retry functionality
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // State for manual override mode
  const [manualOverrideMode, setManualOverrideMode] = useState(false);

  // Toggle manual override mode
  const toggleManualOverride = () => {
    setManualOverrideMode(!manualOverrideMode);
    
    // Clear errors when enabling manual mode
    if (!manualOverrideMode) {
      setError('');
    }
  };

  // Function to retry fetching company info
  const retryFetchCompanyInfo = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError('');
      setLoadingCompanyData(true);
    }
  };

  // Function to check API connection
  const checkApiConnection = async () => {
    try {
      setLoadingCompanyData(true);
      setError('Checking API connection...');
      
      // Try to ping the base URL to check if the server is reachable
      const response = await axios.get(`${Base_Url}/api/health`, { 
        timeout: 5000 // 5 second timeout
      });
      
      console.log('API health check response:', response.data);
      
      if (response.data && response.data.status === 'ok') {
        setError('API server is reachable. Retrying to fetch company information...');
        // If server is reachable, retry fetching company info
        retryFetchCompanyInfo();
      } else {
        setError('API server is reachable but returned an unexpected response. Please contact support.');
      }
    } catch (error) {
      console.error('API connection check failed:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('API server connection timed out. Please check your internet connection or try again later.');
      } else if (error.response) {
        setError(`API server returned an error: ${error.response.status} ${error.response.statusText}`);
      } else if (error.request) {
        setError('Could not connect to the API server. Please check your internet connection or the server might be down.');
      } else {
        setError(`Error checking API connection: ${error.message}`);
      }
    } finally {
      setLoadingCompanyData(false);
    }
  };

  // Function to check token validity
  const checkTokenValidity = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }
    
    try {
      // Decode the token (this doesn't verify the signature, just checks the format)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // Check if token has expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log('Token has expired');
        return false;
      }
      
      // Check if token has the company role
      if (payload.role !== 'company') {
        console.log('Token does not have company role');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  };

  // Function to refresh token
  const refreshToken = async () => {
    try {
      setLoadingCompanyData(true);
      setError('Attempting to refresh your session...');
      
      // Get current token
      const currentToken = localStorage.getItem('authToken');
      if (!currentToken) {
        navigate('/company-signup');
        return false;
      }
      
      // Try to decode the token to get the email
      let email = '';
      try {
        const base64Url = currentToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        email = payload.email;
      } catch (error) {
        console.error('Error decoding token:', error);
        return false;
      }
      
      if (!email) {
        console.error('Could not extract email from token');
        return false;
      }
      
      // Make a request to refresh the token
      // Note: This is a simplified example. In a real app, you would have a dedicated refresh token endpoint
      const response = await axios.post(`${Base_Url}/api/company/login`, {
        email: email,
        password: prompt('Please enter your password to refresh your session:')
      });
      
      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Failed to refresh token');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      setLoadingCompanyData(false);
    }
  };

  // Get company info on component mount
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setLoadingCompanyData(true);
        setError(''); // Clear any previous errors
        
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found, redirecting to signup');
          navigate('/company-signup');
          return;
        }
        
        // Log token information (without revealing the full token)
        console.log('Auth token found, length:', token.length);
        console.log('Token prefix:', token.substring(0, 10) + '...');
        
        console.log(`Fetching company profile (attempt ${retryCount + 1}/${maxRetries + 1}) from:`, `${Base_Url}/api/company/profile`);
        
        const response = await axios.get(`${Base_Url}/api/company/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Company profile API response:', response.data);
        
        // Check if we have the company data
        if (response.data) {
          // Handle both direct response and nested response formats
          const companyData = response.data.company || response.data;
          
          if (companyData.companyName && companyData.email) {
            console.log('Company data retrieved successfully:', companyData.companyName, companyData.email);
            
            setFormData(prev => ({
              ...prev,
              companyName: companyData.companyName,
              companyEmail: companyData.email
            }));
            
            // Clear any errors for these fields since they're now populated
            setFieldErrors(prev => ({
              ...prev,
              companyName: '',
              companyEmail: ''
            }));
            
            // Reset retry count on success
            setRetryCount(0);
          } else {
            console.error('API response missing expected data fields:', companyData);
            
            // Try to use alternative field names if available
            const companyName = companyData.companyName || companyData.company_name || companyData.name;
            const companyEmail = companyData.email || companyData.companyEmail || companyData.company_email;
            
            if (companyName && companyEmail) {
              console.log('Using alternative field names:', companyName, companyEmail);
        
        setFormData(prev => ({
          ...prev,
                companyName: companyName,
                companyEmail: companyEmail
              }));
              
              setFieldErrors(prev => ({
                ...prev,
                companyName: '',
                companyEmail: ''
              }));
              
              // Reset retry count on success
              setRetryCount(0);
              return; // Exit early if we found alternative fields
            } else {
              // If we couldn't find the data, automatically enable manual override mode
              console.log('Could not find company data, enabling manual override mode');
              setManualOverrideMode(true);
            }
          }
        } else {
          // If no data was returned, automatically enable manual override mode
          console.log('No company data returned, enabling manual override mode');
          setManualOverrideMode(true);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Enable manual override mode on any error
        console.log('Error fetching company info, enabling manual override mode');
        setManualOverrideMode(true);
      } finally {
        setLoadingCompanyData(false);
      }
    };
    
    fetchCompanyInfo();
  }, [navigate, retryCount]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowAllCategories(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Group jobs by category for the select dropdown
  const renderJobOptions = () => {
    return Object.entries(JOB_CATEGORIES).map(([category, jobs]) => (
      <optgroup key={category} label={category}>
        {jobs.map((job, index) => (
          <option key={`${category}-${index}`} value={job}>
            {job}
          </option>
        ))}
      </optgroup>
    ));
  };

  // Field validation state
  const [fieldErrors, setFieldErrors] = useState({
    jobTitle: '',
    companyName: '',
    companyEmail: '',
    jobDescription: '',
    expiryDate: '',
    skills: ''
  });

  // Validate a specific field - modified to skip validation for readonly fields if they're being loaded
  const validateField = (name, value) => {
    // Skip validation for company name and email if they're being loaded
    if ((name === 'companyName' || name === 'companyEmail') && loadingCompanyData) {
      return '';
    }
    
    switch(name) {
      case 'jobTitle':
        return value ? '' : 'Job Title is required';
      case 'companyName':
        return value ? '' : 'Company Name is required';
      case 'companyEmail':
        return value ? '' : 'Company Email is required';
      case 'jobDescription':
        return value ? '' : 'Job Description is required';
      case 'expiryDate':
        return value ? '' : 'Expiry Date is required';
      case 'skills':
        return formData.skills.length > 0 ? '' : 'At least one skill is required';
      default:
        return '';
    }
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors({
      ...fieldErrors,
      [name]: error
    });
  };

  // Modified handleChange to clear field errors when typing
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'jobTitle') {
      setFormData({ ...formData, [name]: value });
      
      // If input is empty, show all categories
      if (value.length === 0) {
        setShowAllCategories(true);
      } else {
        // Otherwise show filtered suggestions
        setShowAllCategories(false);
      }
      
      // Always show the dropdown when typing in the job title field
      setShowSuggestions(true);
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear error for this field when user types
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };
  
  const handleFocus = () => {
    // Always show categories when the field is focused
    setShowAllCategories(true);
    setShowSuggestions(true);
  };
  
  const handleSelectSuggestion = (suggestion) => {
    setFormData({ ...formData, jobTitle: suggestion.title });
    setShowSuggestions(false);
    setShowAllCategories(false);
  };
  
  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()]
      });
      setCurrentSkill('');
    }
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Skip company data loading check if in manual override mode
    if (!manualOverrideMode) {
      // If company data is still loading, show a message and prevent submission
      if (loadingCompanyData) {
        setError('Company information is still loading. Please wait a moment and try again.');
        setLoading(false);
        return;
      }
      
      // If company data failed to load
      if (!formData.companyName || !formData.companyEmail) {
        setError('Company information could not be loaded. Please refresh the page and try again or use manual entry mode.');
        setLoading(false);
        return;
      }
    }
    
    // Validate all fields at once
    const newFieldErrors = {
      jobTitle: validateField('jobTitle', formData.jobTitle),
      companyName: validateField('companyName', formData.companyName),
      companyEmail: validateField('companyEmail', formData.companyEmail),
      jobDescription: validateField('jobDescription', formData.jobDescription),
      expiryDate: validateField('expiryDate', formData.expiryDate),
      skills: validateField('skills', formData.skills)
    };
    
    setFieldErrors(newFieldErrors);
    
    // Check if there are any validation errors
    const hasErrors = Object.values(newFieldErrors).some(error => error !== '');
    
    if (hasErrors) {
      setError('Please fill in all required fields correctly.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/company-signup');
        return;
      }
      
      const response = await axios.post(
        `${Base_Url}/api/jobs`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Job posted successfully!');
      // Reset form except company info
      setFormData({
        ...formData,
        jobTitle: '',
        jobDescription: '',
        skills: [],
        expiryDate: ''
      });
      
      // Reset field errors
      setFieldErrors({
        jobTitle: '',
        companyName: '',
        companyEmail: '',
        jobDescription: '',
        expiryDate: '',
        skills: ''
      });
      
      // Update the parent component to show posted jobs tab
      setTimeout(() => {
        navigate('/company-dashboard', { state: { activeTab: 'postedJobs' } });
      }, 2000);
      
    } catch (error) {
      console.error('Error posting job:', error);
      setError(error.response?.data?.message || 'Error posting job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Post a New Job</h1>
          <p>Create a compelling job listing to attract the best talent for your company</p>
        </div>
      </div>

      <div className="form-container">
        <div className="form-header">
          <h2>Job Details</h2>
          <p>Provide accurate information to attract the right candidates</p>
        </div>

        {manualOverrideMode && (
          <div className="manual-mode-message">
            <div className="manual-mode-content">
              <p><strong>Manual Entry Mode Activated</strong></p>
              <p>Please enter your company information in the fields below. This information will only be used for this job posting.</p>
              <p>If you frequently need to enter this information manually, please contact support for assistance.</p>
            </div>
            <button 
              type="button" 
              className="manual-override-button" 
              onClick={toggleManualOverride}
            >
              Cancel Manual Entry
            </button>
          </div>
        )}
        
        {success && <div className="success-message">{success}</div>}
        
        <form className="job-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="jobTitle" className="required">
              <Briefcase className="icon" size={20} />
              Job Title
            </label>
            <div className="suggestion-container">
              <select
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={`form-select ${fieldErrors.jobTitle ? 'invalid' : ''}`}
                required
              >
                <option value="" disabled>Select a job title</option>
                {renderJobOptions()}
              </select>
              {fieldErrors.jobTitle && <div className="field-error">{fieldErrors.jobTitle}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="companyName" className="required">
              <Building2 className="icon" size={20} />
              Company Name {!manualOverrideMode && loadingCompanyData && <span className="loading-text">(Loading...)</span>}
              {manualOverrideMode && <span className="manual-text">(Manual Entry)</span>}
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${fieldErrors.companyName ? 'invalid' : ''} ${!manualOverrideMode && loadingCompanyData ? 'input-loading' : ''} ${manualOverrideMode ? 'manual-input' : ''}`}
              required
              readOnly={!manualOverrideMode}
              placeholder={!manualOverrideMode && loadingCompanyData ? "Loading company name..." : "Enter your company name"}
            />
            {fieldErrors.companyName && <div className="field-error">{fieldErrors.companyName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="companyEmail" className="required">
              <Mail className="icon" size={20} />
              Company Email {!manualOverrideMode && loadingCompanyData && <span className="loading-text">(Loading...)</span>}
              {manualOverrideMode && <span className="manual-text">(Manual Entry)</span>}
            </label>
            <input
              type="email"
              id="companyEmail"
              name="companyEmail"
              value={formData.companyEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${fieldErrors.companyEmail ? 'invalid' : ''} ${!manualOverrideMode && loadingCompanyData ? 'input-loading' : ''} ${manualOverrideMode ? 'manual-input' : ''}`}
              required
              readOnly={!manualOverrideMode}
              placeholder={!manualOverrideMode && loadingCompanyData ? "Loading company email..." : "Enter your company email"}
            />
            {fieldErrors.companyEmail && <div className="field-error">{fieldErrors.companyEmail}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="skills" className="required">
              <Tag className="icon" size={20} />
              Required Skills
            </label>
            <div className="skills-input-container">
              <input
                type="text"
                id="skills"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. JavaScript, React, Node.js"
                className={`form-input ${fieldErrors.skills ? 'invalid' : ''}`}
              />
              <button 
                type="button" 
                className="add-skill-btn"
                onClick={() => {
                  handleAddSkill();
                  // Clear skills error if skills were added
                  if (formData.skills.length > 0) {
                    setFieldErrors({
                      ...fieldErrors,
                      skills: ''
                    });
                  }
                }}
              >
                <span>Add Skill</span>
              </button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="skills-list">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    <span>{skill}</span>
                    <button 
                      type="button"
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fieldErrors.skills && <div className="field-error">{fieldErrors.skills}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate" className="required">
              <Calendar className="icon" size={20} />
              Expiry Date
            </label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              onBlur={handleBlur}
              min={new Date().toISOString().split('T')[0]}
              className={`form-input ${fieldErrors.expiryDate ? 'invalid' : ''}`}
              required
            />
            {fieldErrors.expiryDate && <div className="field-error">{fieldErrors.expiryDate}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription" className="required">
              <FileText className="icon" size={20} />
              Job Description
            </label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Describe the job responsibilities, requirements, and benefits..."
              className={`form-textarea ${fieldErrors.jobDescription ? 'invalid' : ''}`}
              required
            ></textarea>
            {fieldErrors.jobDescription && <div className="field-error">{fieldErrors.jobDescription}</div>}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <>
                <Briefcase size={20} />
                <span>Post Job</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}