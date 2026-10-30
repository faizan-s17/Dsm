import "./App.css";
import ChooseRolePage from "./pages/ChooseRolePage/ChooseRolePage";
import UserSignup from "./pages/UserSignup";
import CompanySignup from "./pages/CompanySignup";
import CompanyDashboard from "./pages/CompanyDashboard/CompanyDashboard";
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import Profile from "./pages/UserProfile/Profile"; 
import AdminLogin from "./pages/Admin/Admin-Login/Admin-Login";
import AdminDashboard from "./pages/Admin/Admin-Dashboard/Admin-Dashboard";
import SkillAssessmentWrapper from "./pages/SkillAssessment/SkillAssessmentWrapper";
import SkillPractice from "./pages/SkillPractice/SkillPractice";
import Chatbot from "./pages/CHATBOT/Chatbot";
import VerifyReportPage from "./pages/VerifyReport/VerifyReportPage";
import LeaderboardPage from "./pages/Leaderboard/LeaderboardPage";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Enhanced Protected Route wrapper component
const ProtectedRoute = ({ element, requiredRole = null }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = () => {
      // Check for admin data first (new method)
      const adminDataString = localStorage.getItem('adminData');
      if (adminDataString && requiredRole === 'admin') {
        try {
          const adminData = JSON.parse(adminDataString);
          if (adminData.isAdmin && adminData.role === 'admin') {
            console.log('Admin authenticated via adminData');
            setIsAuthenticated(true);
            setUserRole('admin');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing admin data:', error);
          localStorage.removeItem('adminData');
        }
      }
      
      // Fall back to token authentication for other roles
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Decode token to check expiration and role
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (tokenData.exp * 1000 < Date.now()) {
          console.log('Token expired, logging out');
          localStorage.removeItem("authToken");
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log('Token data for role detection:', tokenData);
        
        // Enhanced role detection - more explicit and reliable
        if (tokenData.role) {
          // Use the explicit role field if present
          console.log(`Detected role from token role field: ${tokenData.role}`);
          setUserRole(tokenData.role);
        } else if (tokenData.adminId) {
          console.log('Detected admin role from adminId field');
          setUserRole('admin');
        } else if (tokenData.companyId || tokenData.companyName) {
          console.log('Detected company role from company-specific fields');
          setUserRole('company');
        } else if (tokenData.userId || tokenData.email) {
          console.log('Detected user role from user-specific fields');
          setUserRole('user');
        } else {
          console.log('No specific role detected, defaulting to user');
          setUserRole('user');
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem("authToken");
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    verifyAuth();
    
    // Add token check interval to periodically verify token validity
    const tokenCheckInterval = setInterval(() => {
      verifyAuth();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(tokenCheckInterval);
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect based on required role
    if (requiredRole === 'admin') {
      return <Navigate to="/admin-login" replace />;
    } else if (requiredRole === 'company') {
      return <Navigate to="/company-signup" replace />;
    } else {
      return <Navigate to="/user-signup" replace />;
    }
  }

  // If a specific role is required and user's role doesn't match
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch - Required: ${requiredRole}, User has: ${userRole}`);
    
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (userRole === 'company') {
      return <Navigate to="/company-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  return element;
};

// Admin Protected Route with specific admin role check
const AdminProtectedRoute = ({ element }) => (
  <ProtectedRoute element={element} requiredRole="admin" />
);

// Company Protected Route with specific company role check
const CompanyProtectedRoute = ({ element }) => (
  <ProtectedRoute element={element} requiredRole="company" />
);

// User Protected Route with specific user role check
const UserProtectedRoute = ({ element }) => (
  <ProtectedRoute element={element} requiredRole="user" />
);

function App() {
  // Define the router with role-specific protected routes
  const router = createBrowserRouter(
    [
      {
        path: "/",
        element: (
          <iframe
            src={`${process.env.PUBLIC_URL}/index1.html`}
            title="Landing Page"
            width="100%"
            height="100vh"
            frameBorder="0"
            style={{
              border: "none",
              display: "block",
              width: "100%",
              height: "100vh",
            }}
          />
        ),
      },
      {
        path: "/choose-role",
        element: <ChooseRolePage />,
      },
      {
        path: "/user-signup",
        element: <UserSignup />,
      },
      {
        path: "/company-signup",
        element: <CompanySignup />,
      },
      {
        path: "/company-dashboard",
        element: <CompanyProtectedRoute element={<CompanyDashboard />} />,
      },
      {
        path: "/user-dashboard",
        element: <UserProtectedRoute element={<UserDashboard />} />,
      },
      {
        path: "/profile",
        element: <UserProtectedRoute element={<Profile />} />,
      },
      {
        path: "/skill-assessment",
        element: <UserProtectedRoute element={<SkillAssessmentWrapper />} />,
      },
      {
        path: "/skill-practice",
        element: <UserProtectedRoute element={<SkillPractice />} />,
      },
      {
        path: "/chatbot",
        element: <UserProtectedRoute element={<Chatbot />} />,
      },
      {
        path: "/verify/:publicId",
        element: <VerifyReportPage />
      },
      {
        path: "/leaderboard",
        element: <LeaderboardPage />
      },
      {
        path: "/admin-login",
        element: <AdminLogin />,
      },
      {
        path: "/admin-dashboard",
        element: <AdminProtectedRoute element={<AdminDashboard />} />,
      },
      // Add a catch-all redirect
      {
        path: "*",
        element: <Navigate to="/choose-role" replace />,
      },
    ],
    {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
