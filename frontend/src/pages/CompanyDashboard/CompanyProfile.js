import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  Mail, 
  Globe, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Users, 
  Edit, 
  Save, 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  Instagram
} from 'lucide-react';
import './CompanyProfile.css';

// Define Base_Url constant
const Base_Url = 'http://localhost:5000';

const CompanyProfile = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    phoneNumber: '',
    location: '',
    industry: '',
    size: '',
    foundedYear: '',
    description: '',
    socialMedia: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    }
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  
  // Add retry state
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await axios.get(`${Base_Url}/api/company/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Company profile response:', response.data);
        
        // Handle both direct and nested response formats
        const companyData = response.data.company || response.data;
        
        if (companyData) {
          setCompanyData(companyData);
          setFormData({
            name: companyData.name || companyData.companyName || '',
            email: companyData.email || '',
            website: companyData.website || '',
            phoneNumber: companyData.phoneNumber || '',
            location: companyData.location || '',
            industry: companyData.industry || '',
            size: companyData.size || '',
            foundedYear: companyData.foundedYear || '',
            description: companyData.description || '',
            socialMedia: {
              linkedin: companyData.socialMedia?.linkedin || '',
              twitter: companyData.socialMedia?.twitter || '',
              facebook: companyData.socialMedia?.facebook || '',
              instagram: companyData.socialMedia?.instagram || ''
            }
          });
          
          if (companyData.logo) {
            setLogoPreview(`${Base_Url}/${companyData.logo}`);
          }
          
          // Clear error on success
          setError(null);
        } else {
          throw new Error('Failed to fetch company profile data');
        }
      } catch (err) {
        console.error('Error fetching company profile:', err);
        setError(`Failed to fetch company profile. Attempt ${retryCount + 1}/${maxRetries + 1} failed.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [retryCount]); // Add retryCount as dependency
  
  // Function to retry fetching company profile
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setLoading(true);
      setRetryCount(prev => prev + 1);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'socialMedia') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append social media fields
      Object.keys(formData.socialMedia).forEach(platform => {
        formDataToSend.append(`socialMedia[${platform}]`, formData.socialMedia[platform]);
      });
      
      // Append logo if changed
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }
      
      const response = await axios.put(
        `${Base_Url}/api/company/update-profile`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setCompanyData(response.data.company);
        setUpdateSuccess(true);
        setEditMode(false);
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setUpdateError(err.message || 'Failed to update profile');
    }
  };

  const cancelEdit = () => {
    // Reset form data to original company data
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        email: companyData.email || '',
        website: companyData.website || '',
        phoneNumber: companyData.phoneNumber || '',
        location: companyData.location || '',
        industry: companyData.industry || '',
        size: companyData.size || '',
        foundedYear: companyData.foundedYear || '',
        description: companyData.description || '',
        socialMedia: {
          linkedin: companyData.socialMedia?.linkedin || '',
          twitter: companyData.socialMedia?.twitter || '',
          facebook: companyData.socialMedia?.facebook || '',
          instagram: companyData.socialMedia?.instagram || ''
        }
      });
      
      // Reset logo preview
      if (companyData.logo) {
        setLogoPreview(`${Base_Url}/${companyData.logo}`);
      } else {
        setLogoPreview(null);
      }
      
      setLogoFile(null);
    }
    
    setEditMode(false);
    setUpdateError(null);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <AlertCircle size={48} color="#e74c3c" />
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={handleRetry}
              disabled={loading || retryCount >= maxRetries}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
            
            {retryCount >= maxRetries && (
              <button 
                className="check-connection-button"
                onClick={() => {
                  // Check API health
                  axios.get(`${Base_Url}/api/health`)
                    .then(response => {
                      if (response.data && response.data.status === 'ok') {
                        alert("API server is running. The issue might be with your account or connection. Please try logging out and back in.");
                      }
                    })
                    .catch(err => {
                      alert("Could not connect to the API server. Please check if the server is running.");
                    });
                }}
              >
                Check API Connection
              </button>
            )}
            
            <button 
              className="logout-button"
              onClick={() => {
                localStorage.removeItem('authToken');
                window.location.href = '/company-signup';
              }}
            >
              Logout & Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-content">
          <h1>Company Profile</h1>
          <p>Manage your company information and branding</p>
        </div>
        
        {!editMode ? (
          <button 
            className="edit-profile-button" 
            onClick={() => setEditMode(true)}
          >
            <Edit size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button 
              className="cancel-button" 
              onClick={cancelEdit}
            >
              <X size={18} />
              Cancel
            </button>
            <button 
              className="save-button" 
              onClick={handleSubmit}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        )}
      </div>
      
      {updateSuccess && (
        <div className="success-message">
          <CheckCircle size={20} />
          <span>Profile updated successfully!</span>
        </div>
      )}
      
      {updateError && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{updateError}</span>
        </div>
      )}
      
      <div className="profile-content">
        <div className="profile-main">
          <div className="company-card">
            <div className="company-logo-container">
              {editMode ? (
                <div className="logo-upload">
                  <input 
                    type="file" 
                    id="logo-upload" 
                    accept="image/*" 
                    onChange={handleLogoChange} 
                    className="logo-input"
                  />
                  <label htmlFor="logo-upload" className="logo-label">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Company logo preview" className="logo-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={24} />
                        <span>Upload Logo</span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                logoPreview ? (
                  <img src={logoPreview} alt="Company logo" className="company-logo" />
                ) : (
                  <div className="logo-placeholder">
                    <Building2 size={48} />
                  </div>
                )
              )}
            </div>
            
            <div className="company-info">
              {editMode ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="company-name-input"
                  placeholder="Company Name"
                />
              ) : (
                <h2 className="company-name">{companyData.name}</h2>
              )}
              
              <div className="company-details">
                {editMode ? (
                  <div className="form-group">
                    <label>
                      <MapPin size={16} />
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Company Location"
                    />
                  </div>
                ) : (
                  companyData.location && (
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{companyData.location}</span>
                    </div>
                  )
                )}
                
                {editMode ? (
                  <div className="form-group">
                    <label>
                      <Briefcase size={16} />
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="Industry"
                    />
                  </div>
                ) : (
                  companyData.industry && (
                    <div className="detail-item">
                      <Briefcase size={16} />
                      <span>{companyData.industry}</span>
                    </div>
                  )
                )}
                
                {editMode ? (
                  <div className="form-group">
                    <label>
                      <Users size={16} />
                      Company Size
                    </label>
                    <select
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1001+">1001+ employees</option>
                    </select>
                  </div>
                ) : (
                  companyData.size && (
                    <div className="detail-item">
                      <Users size={16} />
                      <span>{companyData.size} employees</span>
                    </div>
                  )
                )}
                
                {editMode ? (
                  <div className="form-group">
                    <label>
                      <Calendar size={16} />
                      Founded Year
                    </label>
                    <input
                      type="number"
                      name="foundedYear"
                      value={formData.foundedYear}
                      onChange={handleInputChange}
                      placeholder="Founded Year"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                ) : (
                  companyData.foundedYear && (
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>Founded in {companyData.foundedYear}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          
          <div className="about-section">
            <h3 className="section-title">About Company</h3>
            {editMode ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Write a description about your company..."
                rows="6"
              ></textarea>
            ) : (
              <p className="company-description">
                {companyData.description || "No description provided."}
              </p>
            )}
          </div>
        </div>
        
        <div className="profile-sidebar">
          <div className="contact-section">
            <h3 className="section-title">Contact Information</h3>
            
            <div className="contact-details">
              <div className="contact-item">
                <Mail size={18} />
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                  />
                ) : (
                  <span>{companyData.email}</span>
                )}
              </div>
              
              <div className="contact-item">
                <Phone size={18} />
                {editMode ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                  />
                ) : (
                  <span>{companyData.phoneNumber || "Not provided"}</span>
                )}
              </div>
              
              <div className="contact-item">
                <Globe size={18} />
                {editMode ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="Website URL"
                  />
                ) : (
                  companyData.website ? (
                    <a href={companyData.website} target="_blank" rel="noopener noreferrer">
                      {companyData.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )
                )}
              </div>
            </div>
          </div>
          
          <div className="social-section">
            <h3 className="section-title">Social Media</h3>
            
            <div className="social-links">
              <div className="social-item">
                <Linkedin size={18} className="linkedin-icon" />
                {editMode ? (
                  <input
                    type="url"
                    name="socialMedia.linkedin"
                    value={formData.socialMedia.linkedin}
                    onChange={handleInputChange}
                    placeholder="LinkedIn URL"
                  />
                ) : (
                  companyData.socialMedia?.linkedin ? (
                    <a href={companyData.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn Profile
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )
                )}
              </div>
              
              <div className="social-item">
                <Twitter size={18} className="twitter-icon" />
                {editMode ? (
                  <input
                    type="url"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter URL"
                  />
                ) : (
                  companyData.socialMedia?.twitter ? (
                    <a href={companyData.socialMedia.twitter} target="_blank" rel="noopener noreferrer">
                      Twitter Profile
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )
                )}
              </div>
              
              <div className="social-item">
                <Facebook size={18} className="facebook-icon" />
                {editMode ? (
                  <input
                    type="url"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleInputChange}
                    placeholder="Facebook URL"
                  />
                ) : (
                  companyData.socialMedia?.facebook ? (
                    <a href={companyData.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                      Facebook Page
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )
                )}
              </div>
              
              <div className="social-item">
                <Instagram size={18} className="instagram-icon" />
                {editMode ? (
                  <input
                    type="url"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleInputChange}
                    placeholder="Instagram URL"
                  />
                ) : (
                  companyData.socialMedia?.instagram ? (
                    <a href={companyData.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                      Instagram Profile
                    </a>
                  ) : (
                    <span>Not provided</span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile; 