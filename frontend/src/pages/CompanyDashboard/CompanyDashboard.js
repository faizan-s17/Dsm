import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import DashboardStats from "./DashboardStats";
import PostedJobs from "./PostedJobs";
import PostJobForm from "./PostJobForm";
import AvailableCandidates from "./AvailableCandidates";
import CompanyProfile from "./CompanyProfile";
import { Bot, Send, X, AlertCircle, MessageSquare } from "lucide-react";
import "./CompanyDashboard.css";
import Chatbot from "../CHATBOT/Chatbot";

// Define Base_Url constant
const Base_Url = 'http://localhost:5000';

// Floating AI Assistant component
const FloatingAssistant = ({ isOpen, toggleAssistant }) => {
  return (
    <div className="floating_assistantz">
      <button className="assistant_triggerz" onClick={toggleAssistant}>
        <Bot className="ai_iconz" />
      </button>
      <div className={`assistant_containerz ${isOpen ? '' : 'hidden'}`}>
        <div className="assistant_headerz">
          <h3>AI Assistant</h3>
          <button onClick={toggleAssistant}>
            <X size={20} />
          </button>
        </div>
        <div className="assistant_contentz">
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Add retry state
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // AI Assistant state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // If a `tab` query param is present, honor it (allows deep-linking)
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        // Map known legacy values to our internal tab keys
        if (tabParam === 'postJob' || tabParam === 'post-job') setActiveTab('post-job');
        else if (tabParam === 'posted-jobs' || tabParam === 'jobs') setActiveTab('posted-jobs');
        else setActiveTab(tabParam);
      }
    } catch (e) {
      console.warn('Could not parse query params for tab:', e);
    }

    // Fetch company information
    fetchCompanyInfo();
  }, [navigate, retryCount]);

  const fetchCompanyInfo = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${Base_Url}/api/company/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Company profile response:", response.data);
      
      // Handle both direct and nested response formats
      if (response.data) {
        // Check if the data is nested or direct
        const companyData = response.data.company || response.data;
        setCompanyInfo(companyData);
        setError(""); // Clear any previous errors
      } else {
        setError("Failed to load company information");
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
      setError(`Error loading company information. Attempt ${retryCount + 1}/${maxRetries + 1} failed.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to retry fetching company info
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setLoading(true);
      setRetryCount(prev => prev + 1);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleAssistant = () => {
    setIsAssistantOpen(!isAssistantOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats companyInfo={companyInfo} />;
      case "jobs":
      case "posted-jobs":
        return <PostedJobs />;
      case "post-job":
        return <PostJobForm />;
      case "candidates":
        return <AvailableCandidates />;
      case "company-profile":
        return <CompanyProfile />;
      case "ai-assistant":
        return (
          <div className="chatbot-page">
            <Chatbot />
          </div>
        );
      default:
        return <DashboardStats companyInfo={companyInfo} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#e74c3c" />
        <h3>Error Loading Dashboard</h3>
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
            onClick={handleLogout}
          >
            Logout and Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        companyName={companyInfo?.companyName || companyInfo?.name || 'Company'}
      />
      <div className="dashboard-content">
        {renderContent()}
      </div>
      
      {/* Floating AI Assistant */}
      <FloatingAssistant 
        isOpen={isAssistantOpen}
        toggleAssistant={toggleAssistant}
      />
    </div>
  );
}
