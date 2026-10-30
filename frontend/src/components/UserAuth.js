import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Create a separate axios instance for user routes
// Use baseURL from environment and avoid `withCredentials` when using JWT in Authorization header
export const userAxios = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || ''
});

// Add request interceptor for user routes
userAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor specifically for user routes
userAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to user login for user-specific routes
    if (error.response?.status === 401) {
      console.log('Authentication error in user route:', error.config.url);
      if (!error.config.url.includes('/api/admin')) {
        localStorage.removeItem('authToken');
        toast.error('Your session has expired. Please log in again.');
        window.location.href = '/user-signup';
      }
    }
    return Promise.reject(error);
  }
);

// Component to check user authentication
const UserAuth = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Function to verify token validity
    const verifyAuth = () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        toast.error('Please log in to continue');
        navigate('/user-signup');
        return false;
      }
      
      try {
        // Decode and verify token
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (tokenData.exp * 1000 < Date.now()) {
          console.log('Token expired, redirecting to login');
          localStorage.removeItem('authToken');
          toast.error('Your session has expired. Please log in again.');
          navigate('/user-signup');
          return false;
        }
        
        // Check user role - if admin or company, redirect to their specific dashboard
        if (tokenData.role === 'admin') {
          navigate('/admin-dashboard');
          return false;
        } else if (tokenData.role === 'company') {
          navigate('/company-dashboard');
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('authToken');
        toast.error('Authentication error. Please log in again.');
        navigate('/user-signup');
        return false;
      }
    };
    
    verifyAuth();
    
    // Set up interval to periodically check token validity (every 5 minutes)
    const tokenCheckInterval = setInterval(() => {
      verifyAuth();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, [navigate]);
  
  return children;
};

export default UserAuth; 