import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserCircle, 
  Bot, 
  LogOut 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange, companyName }) => {
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">D</div>
          <div className="logo-text">{companyName || 'Dashboard'}</div>
        </div>
      </div>
      
      <div className="nav-container">
        <div className="nav-buttons">
          <button 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <div className="nav-indicator"></div>
            <LayoutDashboard className="icon" size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'posted-jobs' ? 'active' : ''}`}
            onClick={() => onTabChange('posted-jobs')}
          >
            <div className="nav-indicator"></div>
            <Briefcase className="icon" size={20} />
            <span>Posted Jobs</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'post-job' ? 'active' : ''}`}
            onClick={() => onTabChange('post-job')}
          >
            <div className="nav-indicator"></div>
            <Briefcase className="icon" size={20} />
            <span>Post Job</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => onTabChange('candidates')}
          >
            <div className="nav-indicator"></div>
            <Users className="icon" size={20} />
            <span>Candidates</span>
          </button>
          
          <button 
            className={`nav-button ${activeTab === 'company-profile' ? 'active' : ''}`}
            onClick={() => onTabChange('company-profile')}
          >
            <div className="nav-indicator"></div>
            <UserCircle className="icon" size={20} />
            <span>Company Profile</span>
          </button>
          

        </div>
      </div>
      
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <LogOut className="icon" size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;