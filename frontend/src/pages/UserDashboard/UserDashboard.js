import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";
import { toast } from 'react-toastify';

import {
  Briefcase,
  Book,
  Target,
  User,
  LogOut,
  ChevronRight,
  Award,
  TrendingUp,
  X,
  Bot
} from "lucide-react";

import Chatbot from "../CHATBOT/Chatbot";
import BadgeChip from '../../components/BadgeChip';

// Initial profile state
const initialProfileState = {
  name: "",
  email: "",
  skills: [],
  skillScores: [],
  avgSkillScore: 0,
  badge: {
    name: "Beginner",
    icon: "bi bi-star",
    updatedAt: new Date()
  },
  ongoingCourse: null,   // ✅ add this
  profilePicture: null,
  recentActivity: []
};
// Profile Dropdown Component
const ProfileDropdown = ({
  userProfile,
  isDropdownOpen,
  handleDropdownToggle,
  navigate,
  handleLogout,
  setActiveTab,
}) => {
  const base_url = "http://localhost:5000";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.profilio_dropdownz');
      if (dropdown && !dropdown.contains(event.target) && isDropdownOpen) {
        handleDropdownToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, handleDropdownToggle]);

  return (
    <div className="profilio_dropdownz">
      <div
        className="profilio_triggerz"
        onClick={handleDropdownToggle}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleDropdownToggle();
          }
        }}
      >
        <img
          src={userProfile.profilePicture
            ? `${base_url}${userProfile.profilePicture}`
            : `${process.env.PUBLIC_URL}/default-avatar.png`}
          alt={`${userProfile.name}'s profile`}
          className="profilio_picz"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${process.env.PUBLIC_URL}/default-avatar.png`;
          }}
        />
        <span className="profilio_namez">{userProfile.name}</span>
      </div>
      {isDropdownOpen && (
        <div className="dropdownio_menuz">
          <div className="dropdownio_headerz">
            <div className="dropdownio_profilio_infoz">
              <img
                src={userProfile.profilePicture
                  ? `${base_url}${userProfile.profilePicture}`
                  : `${process.env.PUBLIC_URL}/default-avatar.png`}
                alt="Profile"
                className="dropdownio_profilio_picz"
              />
              <div className="dropdownio_userz_infoz">
                <h4>{userProfile.name}</h4>
                <p className="dropdownio_emailz">{userProfile.email}</p>
                <BadgeChip badgeName={userProfile.badge?.name} badgeIcon={userProfile.badge?.icon} avgScore={userProfile.avgSkillScore} />
              </div>
            </div>
          </div>
          <div className="dropdownio_dividerz"></div>
          <button
            className="dropdownio_optionz"
            onClick={() => navigate('/profile')}
          >
            <User size={16} />
            View Profile
          </button>

          <div className="dropdownio_dividerz"></div>
          <button
            className="dropdownio_optionz logouto_btnz"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// Floating AI Assistant Component
const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="floating_assistantz">
      <button
        className="assistant_triggerz"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        <Bot className="ai_iconz" />
      </button>

      <div className={`assistant_containerz ${!isOpen ? 'hidden' : ''}`}>
        <div className="assistant_headerz">
          <h3>
            <Bot size={20} />
            AI Assistant
          </h3>
          <button onClick={() => setIsOpen(false)} aria-label="Close">
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

// Add a function to set CSS variables for progress bars
const applyProgressBarStyles = (element, value) => {
  if (!element) return;
  
  // Set the width properly
  element.style.setProperty('--final-width', `${value}%`);
  
  // Set progress for circular indicators
  element.style.setProperty('--progress', `${value}%`);
  
  // Set progress fill for other components
  element.style.setProperty('--progress-width', `${value}%`);
};

// Main Dashboard Component
export default function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(initialProfileState);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [skillAssessmentResults, setSkillAssessmentResults] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const skillsChartRef = useRef(null);

  const base_url = "http://localhost:5000";

  const handleLogout = () => {
    // Clear all user-specific data
    setUserProfile(initialProfileState);
    setRecommendedJobs([]);
    setRecommendedCourses([]);

    // Clear session storage and local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("skillAssessmentResults");
    sessionStorage.clear();

    // Navigate to home
    navigate("/");
  };

  // Fetch recommended courses based on user's skills
  const fetchRecommendedCourses = useCallback(async (skills) => {
    if (!skills || skills.length === 0) return;
    
    setCourseLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token available");
      
      // First check if we have assessment results with course recommendations
      const savedResults = localStorage.getItem('skillAssessmentResults');
      if (savedResults) {
        try {
          const assessmentResults = JSON.parse(savedResults);
          if (assessmentResults.recommended_courses && assessmentResults.recommended_courses.length > 0) {
            setRecommendedCourses(assessmentResults.recommended_courses);
            // Also use these for all courses initially
            setAllCourses(assessmentResults.recommended_courses);
            setCourseLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved assessment results:', e);
        }
      }
      
      // Try to fetch from API - use try/catch to handle failing endpoints
      try {
        // Fetch recommended courses based on skills
        const response = await axios.get(`${base_url}/api/courses/recommended`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { skills: skills.join(",") },
          timeout: 5000 // 5 second timeout for API calls
        });
        
        if (response.data && response.data.courses && response.data.courses.length > 0) {
          setRecommendedCourses(response.data.courses);
        } else {
          console.warn("API returned empty courses array");
          // Fallback to generated data if API doesn't return the expected structure
          const fallbackCourses = generateFallbackCourses(skills);
          setRecommendedCourses(fallbackCourses);
        }
      } catch (error) {
        console.error("API endpoint error for recommended courses:", error);
        toast.warning("Couldn't load course recommendations from server, showing local recommendations instead");
        // Generate fallback courses when API fails
        const fallbackCourses = generateFallbackCourses(skills);
        setRecommendedCourses(fallbackCourses);
      }

      // Try to fetch all courses with separate try/catch
      try {
        const allCoursesResponse = await axios.get(`${base_url}/api/courses/all`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout for API calls
        });
        
        if (allCoursesResponse.data && allCoursesResponse.data.courses && allCoursesResponse.data.courses.length > 0) {
          setAllCourses(allCoursesResponse.data.courses);
        } else {
          console.warn("API returned empty all courses array");
          // Set all courses to be the same as recommended if this endpoint fails
          setAllCourses(recommendedCourses.length > 0 ? recommendedCourses : generateFallbackCourses(skills, 8));
        }
      } catch (error) {
        console.error("API endpoint error for all courses:", error);
        // Use recommended courses as fallback or generate more
        setAllCourses(recommendedCourses.length > 0 ? recommendedCourses : generateFallbackCourses(skills, 8));
      }
      
    } catch (error) {
      console.error("Error fetching course data:", error);
      // Generate fallback data when entire function fails
      const fallbackCourses = generateFallbackCourses(skills);
      setRecommendedCourses(fallbackCourses);
      setAllCourses(fallbackCourses);
    } finally {
      setCourseLoading(false);
    }
  }, [setRecommendedCourses, setAllCourses, setCourseLoading, generateFallbackCourses, toast]);

  // Fetch recommended jobs based on user's skills
  const fetchRecommendedJobs = useCallback(async (skills) => {
    if (!skills || skills.length === 0) return;
    
    setJobLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token available");
      
      // First check if we have assessment results with job recommendations
      const savedResults = localStorage.getItem('skillAssessmentResults');
      if (savedResults) {
        try {
          const assessmentResults = JSON.parse(savedResults);
          if (assessmentResults.recommended_jobs && assessmentResults.recommended_jobs.length > 0) {
            // Add match percentage to jobs from assessment
            const jobsWithMatch = assessmentResults.recommended_jobs.map(job => {
              // If matchPercentage is already present, use it - otherwise calculate based on skills
              const matchPercentage = job.matchPercentage || calculateJobMatch(job, skills);
              return { ...job, matchPercentage };
            });
            setRecommendedJobs(jobsWithMatch);
            // Also use these for all jobs initially
            setAllJobs(jobsWithMatch);
            setJobLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved assessment results:', e);
        }
      }
      
      // Try to fetch from API - use try/catch to handle failing endpoints
      try {
        // Fetch recommended jobs based on skills
        const response = await axios.get(`${base_url}/api/jobs/recommended`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { skills: skills.join(",") },
          timeout: 5000 // 5 second timeout for API calls
        });
        
        if (response.data && response.data.jobs && response.data.jobs.length > 0) {
          // Process job data to include match percentage
          const jobsWithMatch = response.data.jobs.map(job => {
            const matchPercentage = calculateJobMatch(job, skills);
            return { ...job, matchPercentage };
          });
          
          // Sort by match percentage (descending)
          jobsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
          
          setRecommendedJobs(jobsWithMatch);
        } else {
          console.warn("API returned empty jobs array");
          // Fallback to generated data if API doesn't return the expected structure
          const fallbackJobs = generateFallbackJobs(skills);
          setRecommendedJobs(fallbackJobs);
        }
      } catch (error) {
        console.error("API endpoint error for recommended jobs:", error);
        toast.warning("Couldn't load job recommendations from server, showing local recommendations instead");
        // Generate fallback jobs when API fails
        const fallbackJobs = generateFallbackJobs(skills);
        setRecommendedJobs(fallbackJobs);
      }

      // Try to fetch all jobs with separate try/catch
      try {
        const allJobsResponse = await axios.get(`${base_url}/api/jobs/all`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout for API calls
        });
        
        if (allJobsResponse.data && allJobsResponse.data.jobs && allJobsResponse.data.jobs.length > 0) {
          // Add match percentage to all jobs
          const allJobsWithMatch = allJobsResponse.data.jobs.map(job => {
            const matchPercentage = calculateJobMatch(job, skills);
            return { ...job, matchPercentage };
          });
          
          setAllJobs(allJobsWithMatch);
        } else {
          console.warn("API returned empty all jobs array");
          // Set all jobs to be the same as recommended if this endpoint fails
          setAllJobs(recommendedJobs.length > 0 ? recommendedJobs : generateFallbackJobs(skills, 8));
        }
    } catch (error) {
        console.error("API endpoint error for all jobs:", error);
        // Use recommended jobs as fallback or generate more
        setAllJobs(recommendedJobs.length > 0 ? recommendedJobs : generateFallbackJobs(skills, 8));
      }
      
    } catch (error) {
      console.error("Error fetching job data:", error);
      // Generate fallback data when entire function fails
      const fallbackJobs = generateFallbackJobs(skills);
      setRecommendedJobs(fallbackJobs);
      setAllJobs(fallbackJobs);
    } finally {
      setJobLoading(false);
    }
  }, [setRecommendedJobs, setAllJobs, setJobLoading, calculateJobMatch, generateFallbackJobs, toast]);

  // Auth Check Effect
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/user-signup");
          return;
        }

        // Log decoded token data to show user-specific information
        const tokenData = JSON.parse(atob(token.split('.')[1]));

        // Check if token is expired
        if (tokenData.exp * 1000 < Date.now()) {
          console.log('Token expired, logging out');
          handleLogout();
          return;
        }

        setLoading(true);
        // Show loading toast
        toast.info("Loading your dashboard...", { autoClose: 2000 });

        // First fetch user's MongoDB profile with skill scores
        try {
          const response = await axios.get(`${base_url}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000 // Increased timeout for slower connections
          });

          if (response.data && typeof response.data === 'object') {
            // Initialize user profile with data from MongoDB
           const profileData = {
  name: response.data.name || 'Unknown User',
  email: response.data.email || '',
  skills: Array.isArray(response.data.skills) ? response.data.skills : [],
  skillScores: Array.isArray(response.data.skillScores) ? response.data.skillScores : [],
  avgSkillScore: response.data.avgSkillScore || 0,
  badge: response.data.badge || {
    name: "Beginner",
    icon: "bi bi-star",
    updatedAt: new Date()
  },
  ongoingCourse: response.data.ongoingCourse || null, // ✅ add this
  profilePicture: response.data.profilePicture || null,
  recentActivity: Array.isArray(response.data.recentActivity) ? response.data.recentActivity : []
};
            // If we have MongoDB skill scores, use them as our primary source
            let hasMongoDBScores = profileData.skillScores && profileData.skillScores.length > 0;
            
            // Now check localStorage for possible newer assessment results
            const savedResults = localStorage.getItem('skillAssessmentResults');
            let assessmentResults = null;
            let localStorageScoresNewer = false;
            
            if (savedResults) {
              try {
                assessmentResults = JSON.parse(savedResults);
                
                // Enhanced fix for incorrect high scores - normalize scores based on correctness
                if (assessmentResults.detailed_assessment) {
                  const skillScores = {};
                  const assessmentsBySkill = {};
                  
                  // Group questions by skill
                  assessmentResults.detailed_assessment.forEach(item => {
                    if (!assessmentsBySkill[item.skill]) {
                      assessmentsBySkill[item.skill] = [];
                    }
                    assessmentsBySkill[item.skill].push(item);
                  });
                  
                  // Calculate accurate scores for each skill based ONLY on correct answers
                  Object.entries(assessmentsBySkill).forEach(([skill, questions]) => {
                    let correctCount = 0;
                    let totalCount = 0;
                    
                    questions.forEach(q => {
                      totalCount++;
                      // Strictly check for true (not truthy)
                      if (q.isCorrect === true) {
                        correctCount++;
                      }
                    });
                    
                    // Calculate percentage based on correct answers
                    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
                    
                    // If ALL answers are wrong, score should be low
                    if (correctCount === 0 && totalCount > 0) {
                      skillScores[skill] = Math.min(30, Math.round(100 / totalCount)); // Max 30% if all wrong
                    } else {
                      skillScores[skill] = score;
                    }
                  });
                  
                  // Update scores in the assessment results
                  if (Object.keys(skillScores).length > 0) {
                    assessmentResults.scores = skillScores;
                    
                    // Also update localStorage with corrected scores
                    localStorage.setItem('skillAssessmentResults', JSON.stringify(assessmentResults));
                    
                    // Check if localStorage assessment is newer than MongoDB scores
                    if (hasMongoDBScores && assessmentResults.assessmentDate) {
                      const assessmentDate = new Date(assessmentResults.assessmentDate);
                      const mostRecentMongoDBDate = new Date(Math.max(
                        ...profileData.skillScores.map(s => new Date(s.assessedAt).getTime())
                      ));
                      
                      localStorageScoresNewer = assessmentDate > mostRecentMongoDBDate;
                    }
                  }
                }
                
                setSkillAssessmentResults(assessmentResults);
                
                // If localStorage scores are newer or we don't have MongoDB scores,
                // synchronize the localStorage assessment results with MongoDB
                if (localStorageScoresNewer || !hasMongoDBScores) {
                  if (assessmentResults.scores) {
                    // Send an API request to update MongoDB with newer scores
                    try {
                      const scoreArray = Object.entries(assessmentResults.scores).map(
                        ([skill, score]) => ({ skill, score })
                      );
                      
                      // Only attempt update if we have scores to update
                      if (scoreArray.length > 0) {
                        await axios.post(`${base_url}/api/skill-assessment/update-skill-scores`, 
                          { skillScores: scoreArray },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        // Update our profile data with these newer scores
                        profileData.skillScores = scoreArray.map(item => ({
                          ...item,
                          assessedAt: new Date()
                        }));
                        
                        console.log("Successfully synchronized newer assessment scores with MongoDB");
                        
                        // Add assessment activity if not already in the activity list
                        const activityDate = new Date();
                        const skillsList = scoreArray.map(s => s.skill).join(', ');
                        const assessmentActivity = {
                          type: 'assessment',
                          description: `Completed skill assessment for ${skillsList}`,
                          date: activityDate.toISOString()
                        };
                        
                        // Only add if not already present
                        const hasRecentAssessment = profileData.recentActivity.some(
                          activity => activity.type === 'assessment' && 
                          new Date(activity.date).toDateString() === activityDate.toDateString()
                        );
                        
                        if (!hasRecentAssessment) {
                          profileData.recentActivity = [
                            assessmentActivity,
                            ...profileData.recentActivity
                          ].slice(0, 10);
                        }
                      }
                    } catch (error) {
                      console.error("Error synchronizing assessment scores with MongoDB:", error);
                      // Continue with local data even if sync fails
                    }
                  }
                }
              }
              catch (e) {
                console.error('Error parsing saved assessment results:', e);
              }
            }
            
            // Add login activity if there are no activities yet
            if (profileData.recentActivity.length === 0) {
              profileData.recentActivity = [
                {
                  type: 'login',
                  description: 'Logged into your account',
                  date: new Date().toISOString(),
                }
              ];
            }
            
            // Set the final processed user profile
            setUserProfile(profileData);
            
            // Show success toast
            toast.success("Dashboard loaded successfully!", { autoClose: 2000 });
            
            // Load recommended courses and jobs based on user skills
            const skillsToUse = (profileData.skills && profileData.skills.length > 0) ? 
              profileData.skills : 
              (assessmentResults && assessmentResults.scores ? Object.keys(assessmentResults.scores) : ['Programming', 'Web Development', 'Communication']);
            
            await Promise.all([
              fetchRecommendedJobs(skillsToUse),
              fetchRecommendedCourses(skillsToUse)
            ]);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast.error('Failed to load user profile. Using default values.', { autoClose: 5000 });
          
          // Check localStorage for assessment results in case of API failure
          const savedResults = localStorage.getItem('skillAssessmentResults');
          let assessmentResults = null;
          
          if (savedResults) {
            try {
              assessmentResults = JSON.parse(savedResults);
              setSkillAssessmentResults(assessmentResults);
            } catch (e) {
              console.error('Error parsing saved assessment results:', e);
            }
          }
          
          // Generate fallback data with default skills if profile fetch fails
          const defaultSkills = ['Programming', 'Web Development', 'Communication'];
          setUserProfile({
            ...initialProfileState,
            skills: defaultSkills,
            recentActivity: [{
              type: 'login',
              description: 'Logged into your account',
              date: new Date().toISOString(),
            }]
          });
          
          await Promise.all([
            fetchRecommendedJobs(defaultSkills),
            fetchRecommendedCourses(defaultSkills)
          ]);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);

        if (error.response?.status === 401) {
          handleLogout();
          return;
        }

        // Show error notification to user
        toast.error('Failed to load dashboard data. Please refresh the page.', { autoClose: 5000 });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Apply animation for skill bars after data loads
  useEffect(() => {
    if (!loading && skillsChartRef.current) {
      // Apply animations after a short delay to ensure DOM is ready
      setTimeout(() => {
        // Handle localStorage assessment results
        if (skillAssessmentResults && skillAssessmentResults.scores) {
          Object.entries(skillAssessmentResults.scores).forEach(([skill, score], index) => {
            const el = document.getElementById(`skill-bar-${index}`);
            if (el) applyProgressBarStyles(el, score);
          });
        } 
        // Handle MongoDB skillScores
        else if (userProfile.skillScores && userProfile.skillScores.length > 0) {
          userProfile.skillScores.forEach((skillScore, index) => {
            if (typeof skillScore !== 'string') {
              const el = document.getElementById(`skill-bar-${index}`);
              if (el) applyProgressBarStyles(el, skillScore.score);
            }
          });
        }
        
        // Update circular score indicators
        const avgScore = skillAssessmentResults && skillAssessmentResults.scores 
          ? Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length)
          : userProfile.skillScores && userProfile.skillScores.length > 0
            ? Math.round(userProfile.skillScores.reduce((acc, curr) => acc + (typeof curr === 'string' ? 0 : curr.score), 0) / userProfile.skillScores.length)
            : 0;
        
        const scoreCircles = document.querySelectorAll('.assessment-score-circle');
        scoreCircles.forEach(circle => {
          circle.style.setProperty('--progress', `${avgScore}%`);
        });
        
        // Skill development items
        if (skillAssessmentResults && skillAssessmentResults.scores) {
          Object.entries(skillAssessmentResults.scores)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 3)
            .forEach(([skill, score], index) => {
              const el = document.getElementById(`skill-dev-progress-${index}`);
              if (el) applyProgressBarStyles(el, score);
            });
        }
      }, 500);
    }
  }, [loading, skillAssessmentResults, userProfile.skillScores]);
const handleSelectCourse = async (course) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return toast.error("Login required");

    const res = await axios.post(
      "http://localhost:5000/api/user/course/select",
      {
        courseId: course._id || null,
        title: course.title,
        provider: course.provider || course.category || "",
        courseLink: course.url || "",
        skills: course.skills || []
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    toast.success("Course selected");
    setUserProfile(prev => ({
      ...prev,
      ongoingCourse: res.data.ongoingCourse
    }));
  } catch (err) {
    console.error(err);
    toast.error(
      err?.response?.data?.message || "Failed to select course"
    );
  }
};

  


const completeOngoingCourse = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return toast.error("Login required");

    const res = await axios.post(`${base_url}/api/user/course/complete`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.success("Course marked as completed!");
    setUserProfile(prev => ({ ...prev, ongoingCourse: res.data.ongoingCourse }));

    // ✅ after completing: take assessment
    window.location.href = "/skill-assessment";
  } catch (err) {
    console.error("completeOngoingCourse error:", err);
    toast.error(err.response?.data?.message || "Failed to complete course");
  }
};

  // Helper to calculate job match percentage
  function calculateJobMatch(job, userSkills) {
    // If already has a match percentage, use it
    if (job.matchPercentage !== undefined) {
      return job.matchPercentage;
    }
    
    // If either job or user has no skills, return low match
    if (!job.skills || !job.skills.length || !userSkills || !userSkills.length) {
      return Math.floor(30 + Math.random() * 30); // Random between 30-60%
    }
    
    // Normalize user skills for comparison (they might be objects or strings)
    const normalizedUserSkills = userSkills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : 
      (skill.name ? skill.name.toLowerCase() : '')
    ).filter(Boolean); // Remove empty strings
    
    // Normalize job skills for comparison
    const normalizedJobSkills = job.skills.map(skill => 
      typeof skill === 'string' ? skill.toLowerCase() : ''
    ).filter(Boolean);
    
    // Count matching skills
    const matchedSkills = normalizedJobSkills.filter(skill => 
      normalizedUserSkills.includes(skill)
    );
    
    // Calculate match percentage
    return normalizedJobSkills.length > 0 ? 
      Math.round((matchedSkills.length / normalizedJobSkills.length) * 100) : 
      Math.floor(30 + Math.random() * 30); // Random between 30-60% if no job skills
  };

  // Helper to generate fallback course data
  function generateFallbackCourses(skills, count = 4) {
    const providers = ["Coursera", "Udemy", "edX", "Pluralsight", "LinkedIn Learning"];
    const fallbackCourses = [];
    
    // Make sure we always have valid skills array
    const validSkills = Array.isArray(skills) && skills.length > 0 ? 
      skills : ['Programming', 'Web Development', 'Data Science'];
    
    // Generate a course for each skill (up to count)
    for (let i = 0; i < Math.min(validSkills.length, count); i++) {
      const skill = typeof validSkills[i] === 'string' ? validSkills[i] : (validSkills[i].name || 'Programming');
      
      // Create different types of courses for the same skill
      const courseTypes = [
        {
          title: `Advanced ${skill} Masterclass`,
          provider: providers[0],
          description: `This comprehensive masterclass covers advanced concepts in ${skill}, designed for those who want to excel in their career.`,
          level: "Advanced",
          duration: "8 weeks"
        },
        {
          title: `${skill} Fundamentals`,
          provider: providers[1],
          description: `Build a solid foundation in ${skill} with this hands-on course covering all the essentials you need to know.`,
          level: "Beginner",
          duration: "4 weeks"
        },
        {
          title: `Professional ${skill} Certification`,
          provider: providers[2],
          description: `Get industry-recognized certification in ${skill} and boost your resume with this professional course.`,
          level: "Intermediate",
          duration: "12 weeks"
        },
        {
          title: `${skill} for Real-World Projects`,
          provider: providers[3],
          description: `Apply ${skill} concepts to real-world projects and build a portfolio that will impress employers.`,
          level: "Intermediate",
          duration: "6 weeks"
        }
      ];
      
      // Use a different course type for each skill
      const courseIndex = i % courseTypes.length;
      const selectedCourse = courseTypes[courseIndex];
      
      fallbackCourses.push({
        title: selectedCourse.title,
        provider: selectedCourse.provider,
        description: selectedCourse.description,
        skills: [skill],
        level: selectedCourse.level,
        duration: selectedCourse.duration,
        url: "https://www.coursera.org/",
        rationale: `This ${selectedCourse.level.toLowerCase()} course is recommended based on your ${skill} assessment results.`,
        image: `${process.env.PUBLIC_URL}/course-${i+1}.jpg` // Placeholder for course images
      });
    }
    
    // Add some general courses if needed
    while (fallbackCourses.length < count) {
      const index = fallbackCourses.length % providers.length;
      fallbackCourses.push({
        title: "Career Development in Tech",
        provider: providers[index],
        description: "Learn how to advance your career in the technology industry with this comprehensive course.",
        skills: ["Career Development", "Professional Skills"],
        level: "All Levels",
        duration: "Self-paced",
        url: "https://www.udemy.com/",
        rationale: "This course will help you develop your professional skills.",
        image: `${process.env.PUBLIC_URL}/course-career.jpg` // Placeholder for course images
      });
    }
    
    return fallbackCourses;
  };

  // Helper to generate fallback job data
  function generateFallbackJobs(skills, count = 4) {
    const companies = ["Tech Solutions Inc.", "Digital Innovations", "Global Software", "NextGen Technologies", "Data Systems"];
    const locations = ["Remote", "New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA"];
    const fallbackJobs = [];
    
    // Make sure we always have valid skills array
    const validSkills = Array.isArray(skills) && skills.length > 0 ? 
      skills : ['Programming', 'Web Development', 'Data Science'];
    
    // Generate a job for each skill (up to count)
    for (let i = 0; i < Math.min(validSkills.length, count); i++) {
      const skill = typeof validSkills[i] === 'string' ? validSkills[i] : (validSkills[i].name || 'Programming');
      
      // More realistic/varied match percentages - not always high
      const matchPercentage = i === 0 ? 
        Math.floor(85 + Math.random() * 15) : // First match is high (85-100%)
        i === 1 ? 
          Math.floor(70 + Math.random() * 15) : // Second match is good (70-85%)
          Math.floor(40 + Math.random() * 30); // Others are moderate to good (40-70%)
      
      fallbackJobs.push({
        jobTitle: `${skill} Developer`,
        companyName: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        jobDescription: `We are looking for a skilled ${skill} Developer to join our team and build innovative solutions.`,
        skills: [skill, "Problem Solving", "Teamwork"],
        rationale: `This job matches your ${skill} skills and experience level.`,
        matchPercentage
      });
    }
    
    // Add some general jobs if needed
    while (fallbackJobs.length < count) {
      // Lower match percentages for filler jobs
      const matchPercentage = Math.floor(30 + Math.random() * 30); // Random between 30-60%
      
      fallbackJobs.push({
        jobTitle: "Junior Software Developer",
        companyName: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        jobDescription: "Join our team as a Junior Software Developer and work on exciting projects using cutting-edge technologies.",
        skills: ["Programming", "Web Development", "Communication"],
        rationale: "This entry-level position matches your skill profile.",
        matchPercentage
      });
    }
    
    // Sort by match percentage
    fallbackJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    return fallbackJobs;
  };

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      case "skills":
        return renderSkillsTab();
      case "courses":
        return renderCoursesTab();
      case "allcourses":
        return renderAllCoursesTab();
      case "jobs":
        return renderJobsTab();
      case "alljobs":
        return renderAllJobsTab();
      default:
        return renderOverviewTab();
    }
  };

  // Render Overview Tab
  const renderOverviewTab = () => {
    return (
      <div className="contentio_sectionz">
        <h2>Dashboard Overview</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="overview_statsz">
              <div className="statio_cardz">
                <div className="statio_iconz pulse-animation">
                  <TrendingUp size={24} />
                </div>
                <div className="statio_infoz">
                  <h3>{userProfile.skills?.length || 0}</h3>
                  <p>Skills</p>
                </div>
              </div>
              
              <div className="statio_cardz">
                <div className="statio_iconz pulse-animation">
                  <Book size={24} />
                </div>
                <div className="statio_infoz">
                  <h3>{recommendedCourses?.length || 0}</h3>
                  <p>Recommended Courses</p>
                </div>
              </div>
              
              <div className="statio_cardz">
                <div className="statio_iconz pulse-animation">
                  <Briefcase size={24} />
                </div>
                <div className="statio_infoz">
                  <h3>{recommendedJobs?.length || 0}</h3>
                  <p>Job Matches</p>
                </div>
              </div>
            </div>

            <div className="overview_gridz">
              <div className="overview_cardz">
                <h3>Recent Activity</h3>
                <div className="activity_listz">
                  {userProfile.recentActivity && userProfile.recentActivity.length > 0 ? (
                    userProfile.recentActivity.map((activity, index) => (
                      <div key={index} className="activity_itemz">
                        <div className="activity_iconz">
                          {activity.type === 'course' && <Book size={16} />}
                          {activity.type === 'skill' && <Target size={16} />}
                          {activity.type === 'job' && <Briefcase size={16} />}
                          {activity.type === 'assessment' && <Award size={16} />}
                          {activity.type === 'login' && <User size={16} />}
                        </div>
                        <div className="activity_contentz">
                          <p>{activity.description}</p>
                          <span>{new Date(activity.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no_activityz">No recent activity</p>
                  )}
                </div>
              </div>
 <div className="overview_cardz">
    <h3>Your Skills</h3>
    {userProfile.skills && userProfile.skills.length > 0 ? (
      <div className="skills-tags-container">
        {userProfile.skills.map((skill, index) => (
          <div key={index} className="skill-tag">
            {typeof skill === 'string' ? skill : skill.name}
            {typeof skill !== 'string' && skill.level && (
              <span
                className={`skill-level ${
                  skill.level < 50 ? 'beginner' :
                  skill.level < 80 ? 'intermediate' : 'advanced'
                }`}
                title={`${skill.level}% proficiency`}
              />
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="no_activityz">No skills added yet</p>
    )}
    <div className="assessment_actions mt-4">
      <button
        onClick={() => navigate('/profile')}
        className="secondary-button"
      >
        Update Skills
      </button>
    </div>
  </div>

  {/* ✅ NEW: Ongoing Course Card */}
  <div className="overview_cardz">
    <h3>Ongoing Course</h3>

    {!userProfile.ongoingCourse || userProfile.ongoingCourse.status !== "ongoing" ? (
      <p className="no_activityz">Add course first</p>
    ) : (
      <>
        <p><strong>{userProfile.ongoingCourse.title}</strong></p>
        <p>{userProfile.ongoingCourse.provider}</p>

        {userProfile.ongoingCourse.courseLink && (
          <a
            href={userProfile.ongoingCourse.courseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="view_course_link"
          >
            Open Course
          </a>
        )}

        <div className="assessment_actions mt-4">
          <button
            className="primary-button"
            onClick={completeOngoingCourse}
          >
            Completed
          </button>
        </div>
      </>
    )}
  </div>
</div>

            {skillAssessmentResults ? (
              <div className="overview_gridz mt-4">
                <div className="overview_cardz highlight-card">
                  <h3>Your Latest Assessment</h3>
                  <div className="assessment-summary-container">
                    <div className="assessment-score-circle">
                      <div className="score-number">
                        {skillAssessmentResults.scores ? 
                          Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length) :
                          'N/A'
                        }%
                      </div>
                      <div className="score-label">Average Score</div>
                    </div>
                    <p className="assessment-summary">
                      You've completed your skill assessment. See detailed results to discover your strengths and areas for improvement.
                    </p>
                  </div>
                  <div className="assessment_actions">
                    <button 
                      onClick={() => setActiveTab("skills")} 
                      className="primary-button"
                    >
                      View Detailed Results
                    </button>
                    <button 
                      onClick={() => window.location.href = '/skill-assessment?force=true'} 
                      className="secondary-button"
                    >
                      Retake Assessment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overview_gridz mt-4">
                <div className="overview_cardz highlight-card">
                  <h3>Skill Assessment</h3>
                  <p className="assessment-summary">
                    Take a skill assessment to get personalized course and job recommendations.
                  </p>
                  <div className="assessment_actions">
                    <button 
                      onClick={() => window.location.href = '/skill-assessment'} 
                      className="primary-button"
                    >
                      Take Assessment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Render Skills Tab
  const renderSkillsTab = () => {
    return (
      <div className="contentio_sectionz">
        <h2>Skill Assessment Results</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading assessment results...</p>
          </div>
        ) : (!userProfile.skillScores || userProfile.skillScores.length === 0) && !skillAssessmentResults ? (
          <div className="no_assessment_card">
            <div className="no_assessment_content">
              <Award size={48} className="no_assessment_icon" />
              <h3>No Assessment Completed Yet</h3>
              <p>Complete a skill assessment to see your results here and get personalized recommendations.</p>
              <button 
                onClick={() => window.location.href = '/skill-assessment'} 
                className="primary-button"
              >
                Take Assessment Now
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="skill-assessment-summary">
              <div className="skill-summary-header">
                <h3>Your Skill Proficiency</h3>
                <div className="skill-summary-score">
                  <div className="assessment-score-circle">
                    {skillAssessmentResults && skillAssessmentResults.scores ? (
                      <div className="score-number">
                        {Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length)}%
                      </div>
                    ) : (
                      <div className="score-number">
                        {userProfile.skillScores && userProfile.skillScores.length > 0 ? 
                          Math.round(userProfile.skillScores.reduce((acc, curr) => 
                            acc + (typeof curr === 'string' ? 0 : curr.score), 0) / userProfile.skillScores.length) : 'N/A'
                        }
                      </div>
                    )}
                    <div className="score-label">Avg Score</div>
                  </div>
                  <div className="skill-level-distribution">
                    <div className="level-item">
                      <span className="level-dot beginner"></span>
                      <span className="level-label">Beginner</span>
                      <span className="level-count">
                        {skillAssessmentResults && skillAssessmentResults.scores ? 
                          Object.values(skillAssessmentResults.scores).filter(score => score < 40).length :
                          userProfile.skillScores ? userProfile.skillScores.filter(s => 
                            typeof s !== 'string' && s.score < 40).length : 0
                        }
                      </span>
                    </div>
                    <div className="level-item">
                      <span className="level-dot intermediate"></span>
                      <span className="level-label">Intermediate</span>
                      <span className="level-count">
                        {skillAssessmentResults && skillAssessmentResults.scores ? 
                          Object.values(skillAssessmentResults.scores).filter(score => score >= 40 && score < 70).length :
                          userProfile.skillScores ? userProfile.skillScores.filter(s => 
                            typeof s !== 'string' && s.score >= 40 && s.score < 70).length : 0
                        }
                      </span>
                    </div>
                    <div className="level-item">
                      <span className="level-dot advanced"></span>
                      <span className="level-label">Advanced</span>
                      <span className="level-count">
                        {skillAssessmentResults && skillAssessmentResults.scores ? 
                          Object.values(skillAssessmentResults.scores).filter(score => score >= 70).length :
                          userProfile.skillScores ? userProfile.skillScores.filter(s => 
                            typeof s !== 'string' && s.score >= 70).length : 0
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="assessment_stats_card">
              <div className="skills_chart" ref={skillsChartRef}>
                {skillAssessmentResults && skillAssessmentResults.scores ? (
                  Object.entries(skillAssessmentResults.scores).map(([skill, score], index) => {
                    // Ensure score is a number and between 0-100
                    const numericScore = typeof score === 'number' ? Math.min(Math.max(score, 0), 100) : 0;
                    
                    // Determine skill level label
                    const skillLevelLabel = numericScore < 40 ? 'Beginner' : 
                                           numericScore < 70 ? 'Intermediate' : 'Advanced';
                    
                    // Calculate animation delay for cascading effect
                    const animationDelay = `${index * 0.1}s`;
                    
                    return (
                      <div key={index} className="skill_score_item" style={{animationDelay}}>
                        <div className="skill_score_header">
                          <span className="skill_name">{skill}</span>
                          <div className="skill_score_level">
                            <span className={`level_badge ${
                              numericScore < 40 ? 'beginner_badge' : 
                              numericScore < 70 ? 'intermediate_badge' : 'advanced_badge'
                            }`}>{skillLevelLabel}</span>
                            <span className="skill_score">{numericScore}%</span>
                          </div>
                        </div>
                        <div className="skill_score_bar_container">
                          <div className="skill_score_bar">
                            <div 
                              id={`skill-bar-${index}`}
                              className={`skill_score_fill ${
                                numericScore < 40 ? 'beginner' : 
                                numericScore < 70 ? 'intermediate' : 'advanced'
                              } animate-width`}
                              style={{ width: `0%`, animationDelay }}
                            ></div>
                          </div>
                          <div className="score-markers">
                            <div className="marker-40" title="Beginner threshold"></div>
                            <div className="marker-70" title="Intermediate threshold"></div>
                          </div>
                        </div>
                        <div className="skill_tip">
                          {numericScore < 40 ? 
                            <><span className="tip-icon">💡</span> Focus on {skill} fundamentals to build a solid foundation.</> :
                            numericScore < 70 ? 
                            <><span className="tip-icon">🚀</span> Deepen your {skill} knowledge with intermediate courses.</> :
                            <><span className="tip-icon">🏆</span> Pursue advanced {skill} topics to become an expert.</>
                          }
                        </div>
                      </div>
                    );
                  })
                ) : (
                  userProfile.skillScores && userProfile.skillScores.map((skillScore, index) => {
                    // Handle different formats and ensure numeric score
                    let skillName = typeof skillScore === 'string' ? skillScore : skillScore.skill;
                    let numericScore = typeof skillScore === 'string' ? 0 : 
                                      (typeof skillScore.score === 'number' ? Math.min(Math.max(skillScore.score, 0), 100) : 0);
                    
                    // Determine skill level label
                    const skillLevelLabel = numericScore < 40 ? 'Beginner' : 
                                           numericScore < 70 ? 'Intermediate' : 'Advanced';
                    
                    // Calculate animation delay for cascading effect
                    const animationDelay = `${index * 0.1}s`;
                    
                    return (
                      <div key={index} className="skill_score_item" style={{animationDelay}}>
                        <div className="skill_score_header">
                          <span className="skill_name">{skillName}</span>
                          <div className="skill_score_level">
                            <span className={`level_badge ${
                              numericScore < 40 ? 'beginner_badge' : 
                              numericScore < 70 ? 'intermediate_badge' : 'advanced_badge'
                            }`}>{skillLevelLabel}</span>
                            <span className="skill_score">{numericScore}%</span>
                          </div>
                        </div>
                        <div className="skill_score_bar_container">
                          <div className="skill_score_bar">
                            <div 
                              id={`skill-bar-${index}`}
                              className={`skill_score_fill ${
                                numericScore < 40 ? 'beginner' : 
                                numericScore < 70 ? 'intermediate' : 'advanced'
                              } animate-width`}
                              style={{ width: `0%`, animationDelay }}
                            ></div>
                          </div>
                          <div className="score-markers">
                            <div className="marker-40" title="Beginner threshold"></div>
                            <div className="marker-70" title="Intermediate threshold"></div>
                          </div>
                        </div>
                        <div className="skill_tip">
                          {numericScore < 40 ? 
                            <><span className="tip-icon">💡</span> Focus on {skillName} fundamentals to build a solid foundation.</> :
                            numericScore < 70 ? 
                            <><span className="tip-icon">🚀</span> Deepen your {skillName} knowledge with intermediate courses.</> :
                            <><span className="tip-icon">🏆</span> Pursue advanced {skillName} topics to become an expert.</>
                          }
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="assessment_actions">
                <button 
                  onClick={() => navigate('/skill-practice')} 
                  className="primary-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
                    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
                    <path d="M12 2v2"></path>
                    <path d="M12 22v-2"></path>
                    <path d="m17 20.66-1-1.73"></path>
                    <path d="M11 10.27 7 3.34"></path>
                    <path d="m20.66 17-1.73-1"></path>
                    <path d="m3.34 7 1.73 1"></path>
                    <path d="M14 12h8"></path>
                    <path d="M2 12h2"></path>
                  </svg>
                  Practice Skills
                </button>
                <button 
                  onClick={() => window.location.href = '/skill-assessment?force=true'} 
                  className="secondary-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                  </svg>
                  Retake Assessment
                </button>
              </div>
            </div>
            
            {skillAssessmentResults && skillAssessmentResults.assessmentTime && (
              <div className="assessment_info_card">
                <div className="assessment_info_grid">
                  <div className="assessment_info_item">
                    <div className="info_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <div className="info_content">
                      <span className="info_label">Last Assessment</span>
                      <span className="info_value">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="assessment_info_item">
                    <div className="info_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div className="info_content">
                      <span className="info_label">Time Taken</span>
                      <span className="info_value">
                        {Math.floor(skillAssessmentResults.assessmentTime / 60)}m {skillAssessmentResults.assessmentTime % 60}s
                      </span>
                    </div>
                  </div>
                  <div className="assessment_info_item">
                    <div className="info_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                    </div>
                    <div className="info_content">
                      <span className="info_label">Questions</span>
                      <span className="info_value">
                        {skillAssessmentResults.detailed_assessment ? skillAssessmentResults.detailed_assessment.length : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="assessment_info_item">
                    <div className="info_icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="info_content">
                      <span className="info_label">Average Score</span>
                      <span className={`info_value ${
                        skillAssessmentResults.scores ? 
                          (Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length) < 40 ? 'low_score' : 
                           Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length) < 70 ? 'medium_score' : 'high_score') 
                          : ''
                      }`}>
                        {skillAssessmentResults.scores ? 
                          Math.round(Object.values(skillAssessmentResults.scores).reduce((a, b) => a + b, 0) / Object.values(skillAssessmentResults.scores).length) :
                          'N/A'
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {skillAssessmentResults && skillAssessmentResults.scores && (
          <div className="skill-development-section">
            <div className="section-title-with-badge">
              <h3>Skill Development Recommendations</h3>
              <span className="badge-chip">Personalized for you</span>
            </div>
            <p className="section-description">Based on your assessment results, here are the areas you should focus on to improve your skills:</p>
            
            <div className="skill-development-list">
              {Object.entries(skillAssessmentResults.scores)
                .sort(([, a], [, b]) => a - b) // Sort by score ascending (lowest first)
                .slice(0, 3) // Take top 3 weakest skills
                .map(([skill, score], index) => {
                  // Ensure score is a number
                  const numericScore = typeof score === 'number' ? score : 0;
                  
                  // Determine recommended resources based on level
                  const resources = numericScore < 40 ? 
                    ["Fundamentals Course", "Beginner's Guide", "Interactive Tutorials"] :
                    numericScore < 70 ?
                    ["Practice Projects", "Advanced Techniques", "Community Forums"] :
                    ["Expert Workshops", "Certification Programs", "Teaching Opportunities"];

                  return (
                    <div key={index} className="skill-development-item">
                      <div className="skill-dev-header">
                        <h4>{skill}</h4>
                        <span className={`score-badge ${
                          numericScore < 40 ? 'beginner_badge' : 
                          numericScore < 70 ? 'intermediate_badge' : 'advanced_badge'
                        }`}>{numericScore}%</span>
                      </div>
                      <div className="skill-dev-progress">
                        <div className="progress-bar">
                          <div 
                            id={`skill-dev-progress-${index}`}
                            className={`progress-fill ${
                              numericScore < 40 ? 'beginner' : 
                              numericScore < 70 ? 'intermediate' : 'advanced'
                            }`}
                            style={{ width: '0%' }}
                          ></div>
                        </div>
                      </div>
                      <p className="skill-dev-description">
                        {numericScore < 40 ? 
                          `Your score in ${skill} is at a beginner level. We recommend starting with fundamental courses.` :
                          numericScore < 70 ? 
                          `Your ${skill} skills are intermediate. Try advanced courses to reach expert level.` :
                          `You have strong ${skill} skills. Consider specialization courses to become an expert.`
                        }
                      </p>
                      <div className="resource-tags">
                        {resources.map((resource, idx) => (
                          <span key={idx} className="resource-tag">{resource}</span>
                        ))}
                      </div>
                      <div className="skill-dev-actions">
                        <button 
                          onClick={() => setActiveTab("courses")} 
                          className="primary-button sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          View Recommended Courses
                        </button>
                        <button 
                          onClick={() => window.open('https://docs.google.com/document/d/1_skill_resources', '_blank')}
                          className="secondary-button sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Learning Resources
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="skill-action-banner">
              <div className="banner-content">
                <div className="banner-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="banner-text">
                  <h4>Ready to improve your skills further?</h4>
                  <p>Take practice assessments regularly to track your progress</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/skill-practice'} 
                className="primary-button"
              >
                Practice Skills
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Courses Tab
  const renderCoursesTab = () => {
    return (
      <div className="contentio_sectionz">
        <h2>Recommended Courses</h2>
        
        {courseLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading course recommendations...</p>
          </div>
        ) : recommendedCourses && recommendedCourses.length > 0 ? (
          <>
            <p className="section-description">
              These courses are tailored to your skills and assessment results to help you grow professionally.
            </p>
            <div className="recommendations_grid">
              {recommendedCourses.map((course, index) => (
                <div key={index} className="recommendation_card course_card">
                  <div className="course-header">
                    <h4>{course.title}</h4>
                    <span className="course-provider">{course.provider || course.category}</span>
                  </div>
                  
                  {course.level && (
                    <div className="course-level-badge">
                      {course.level}
                    </div>
                  )}
                  
                  {course.description && (
                    <p className="recommendation_description">{course.description.substring(0, 150)}...</p>
                  )}
                  
                  {course.skills && (
                    <div className="course-skills">
                      {course.skills.map((skill, idx) => (
                        <span key={idx} className="job_skill_tag">{skill}</span>
                      ))}
                    </div>
                  )}
                  
                  {course.duration && (
                    <div className="course-duration">
                      <span>Duration: {course.duration}</span>
                    </div>
                  )}
                  
                  {course.rationale && (
                    <p className="recommendation_rationale">{course.rationale}</p>
                  )}
                  
                  <div className="course-actions">
                    {course.url && (
                      <a 
                        href={course.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view_course_link"
                      >
                        View Course
                      </a>
                    )}
                    <button
  className="save-course-btn"
  onClick={() => handleSelectCourse(course)}
>
  Select Course
</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no_assessment_card">
            <div className="no_assessment_content">
              <Book size={48} className="no_assessment_icon" />
              <h3>No Course Recommendations Yet</h3>
              <p>Complete a skill assessment to get personalized course recommendations based on your skills and proficiency levels.</p>
              <button 
                onClick={() => window.location.href = '/skill-assessment'} 
                className="primary-button"
              >
                Take Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Jobs Tab
  const renderJobsTab = () => {
    return (
      <div className="contentio_sectionz">
        <h2>Recommended Jobs</h2>
        
        {jobLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading job recommendations...</p>
          </div>
        ) : recommendedJobs && recommendedJobs.length > 0 ? (
          <div className="recommendations_grid">
            {recommendedJobs.map((job, index) => (
              <div key={index} className="recommendation_card job_card">
                {job.matchPercentage !== undefined && (
                  <div className="job_match">
                    <span className="match_label">Match</span>
                    <span className={`match_percentage ${
                      job.matchPercentage >= 80 ? 'high_match' :
                      job.matchPercentage >= 60 ? 'medium_match' : 'low_match'
                    }`}>{job.matchPercentage}%</span>
                  </div>
                )}
                
                <h4>{job.jobTitle}</h4>
                <p><strong>Company:</strong> {job.companyName}</p>
                {job.location && <p><strong>Location:</strong> {job.location}</p>}
                
                {job.jobDescription && (
                  <p className="recommendation_description">
                    {job.jobDescription.substring(0, 150)}...
                  </p>
                )}
                
                {job.skills && (
                  <div className="job_skills">
                    {job.skills.map((skill, idx) => (
                      <span key={idx} className="job_skill_tag">{skill}</span>
                    ))}
                  </div>
                )}
                
                {job.rationale && (
                  <p className="recommendation_rationale">{job.rationale}</p>
                )}
                
                <button 
                  onClick={() => window.location.href = `/job-details/${job._id || index}`}
                  className="view_job_button"
                >
                  View Job
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no_assessment_card">
            <div className="no_assessment_content">
              <Briefcase size={48} className="no_assessment_icon" />
              <h3>No Job Recommendations Yet</h3>
              <p>Complete a skill assessment to get personalized job recommendations that match your skills and proficiency levels.</p>
              <button 
                onClick={() => window.location.href = '/skill-assessment'} 
                className="primary-button"
              >
                Take Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render All Courses Tab
  const renderAllCoursesTab = () => {
    const qRaw = (courseSearch || "").trim();
    const q = qRaw.toLowerCase();
    const filteredCourses = q
      ? allCourses.filter((course) => {
          const titleMatch = (course.title || "").toLowerCase().includes(q);
          const skillsMatch = Array.isArray(course.skills)
            ? course.skills.some((s) => (s || "").toLowerCase().includes(q))
            : false;
          return titleMatch || skillsMatch;
        })
      : allCourses;

    return (
      <div className="contentio_sectionz">
        <h2>All Available Courses</h2>
        <div className="courses_search_bar_container">
          <input
            type="search"
            className="course-search-input"
            placeholder="Search by course name or skill"
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            aria-label="Search courses by name or skill"
          />
        </div>

        {courseLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div className="recommendations_grid">
            {filteredCourses.map((course, index) => {
              const courseHref = course.courseLink || course.url;

              return (
                <div key={course._id || index} className="recommendation_card">
                  <div className="course-header">
                    <h4>{course.title}</h4>
                    <span className="course-provider">{course.provider || course.category}</span>
                  </div>

                  {course.description && (
                    <p className="recommendation_description">
                      {course.description.substring(0, 150)}...
                    </p>
                  )}

                  {course.skills && (
                    <div className="course-skills">
                      {course.skills.map((skill, idx) => (
                        <span key={idx} className="job_skill_tag">{skill}</span>
                      ))}
                    </div>
                  )}

                  {courseHref && (
                    <a
                      href={courseHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view_course_link"
                    >
                      View Course
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no_data_card">
            <div className="no_data_content">
              <Book size={48} className="no_data_icon" />
              <h3>{qRaw ? "No courses match your search" : "No Courses Available"}</h3>
              <p>{qRaw ? "Try a different keyword or clear the search." : "We haven't found any courses in our database. Please check back later."}</p>
            </div>
          </div>
        )}
      </div>
    );
  };
const fetchAllCoursesFromDB = async () => {
  setCourseLoading(true);
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.get(`${base_url}/api/courses/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // your backend might return array directly OR inside {courses: []}
    const courses = Array.isArray(res.data) ? res.data : (res.data.courses || []);
    setAllCourses(courses);
  } catch (err) {
    console.error("fetchAllCoursesFromDB error:", err);
    toast.error("Failed to load all courses from database");
  } finally {
    setCourseLoading(false);
  }
};

  // Render All Jobs Tab
  const renderAllJobsTab = () => {
    return (
      <div className="contentio_sectionz">
        <h2>All Available Jobs</h2>
        
        {jobLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : allJobs && allJobs.length > 0 ? (
          <div className="recommendations_grid">
            {allJobs.map((job, index) => (
              <div key={index} className="recommendation_card job_card">
                <h4>{job.jobTitle}</h4>
                <p><strong>Company:</strong> {job.companyName}</p>
                <p><strong>Location:</strong> {job.location || 'Not specified'}</p>
                
                {job.jobDescription && (
                  <p className="recommendation_description">
                    {job.jobDescription.substring(0, 150)}...
                  </p>
                )}
                
                {job.skills && (
                  <div className="job_skills">
                    {job.skills.map((skill, idx) => (
                      <span key={idx} className="job_skill_tag">{skill}</span>
                    ))}
                  </div>
                )}
                
                <button 
                  onClick={() => window.location.href = `/job-details/${job._id}`}
                  className="view_job_button"
                >
                  View Job
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no_data_card">
            <div className="no_data_content">
              <Briefcase size={48} className="no_data_icon" />
              <h3>No Jobs Available</h3>
              <p>We haven't found any jobs in our database. Please check back later.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboardio_containerz">
      <aside className="sidebario_navz">
        <div className="sidebario_headerz">
          <h2>User Dashboard</h2>
        </div>

        <div className="sidebario_menuz">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "skills", label: "Skills", icon: Target },
            { id: "courses", label: "Recommended Courses", icon: Book },
            { id: "allcourses", label: "All Courses", icon: Book },
            { id: "jobs", label: "Recommended Jobs", icon: Briefcase },
            { id: "alljobs", label: "All Jobs", icon: Briefcase }
          ].map((item) => (
            <button
              key={item.id}
              className={`menuz_itemz ${activeTab === item.id ? "activio" : ""}`}
             onClick={() => {
  setActiveTab(item.id);
  if (item.id === "allcourses") fetchAllCoursesFromDB();
}}
            >
              <item.icon className="menuz_iconz" />
              <span>{item.label}</span>
              <ChevronRight className="arrowo_iconz" />
            </button>
          ))}
          <button 
            className="menuz_itemz"
            onClick={() => navigate('/leaderboard')}
          >
            <Award className="menuz_iconz" />
            <span>Leaderboard</span>
            <ChevronRight className="arrowo_iconz" />
          </button>
          <button 
            className="menuz_itemz"
            onClick={() => navigate('/skill-practice')}
          >
            <TrendingUp className="menuz_iconz" />
            <span>Practice</span>
            <ChevronRight className="arrowo_iconz" />
          </button>
          <button 
            className="menuz_itemz"
            onClick={() => navigate('/chatbot')}
          >
            <Bot className="menuz_iconz" />
            <span>AI Assistant</span>
            <ChevronRight className="arrowo_iconz" />
          </button>
          <div className="menuz_dividerz"></div>
          <button 
            className="menuz_itemz"
            onClick={() => navigate('/profile')}
          >
            <User className="menuz_iconz" />
            <span>Profile</span>
            <ChevronRight className="arrowo_iconz" />
          </button>
          <button className="menuz_itemz logouto_btnz" onClick={handleLogout}>
            <LogOut className="menuz_iconz" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="mainio_contentz">
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
        <header className="dashboardio_headerz">
          <div className="headerio_leftz">
            <div className="welcome-message-container">
              <h1>Welcome back, {userProfile.name?.split(' ')[0] || 'User'}!</h1>
              <BadgeChip badgeName={userProfile.badge?.name} badgeIcon={userProfile.badge?.icon} avgScore={userProfile.avgSkillScore} />
            </div>
            <p>Let's continue your professional journey</p>
          </div>

          <div className="headerio_rightz">
            <ProfileDropdown
              userProfile={userProfile}
              isDropdownOpen={isDropdownOpen}
              handleDropdownToggle={handleDropdownToggle}
              navigate={navigate}
              handleLogout={handleLogout}
              setActiveTab={setActiveTab}
            />
          </div>
        </header>

        <section className="dashboardio_contentz">
          {renderTabContent()}
        </section>
      </main>

      <FloatingAssistant />
    </div>
  );
}
  