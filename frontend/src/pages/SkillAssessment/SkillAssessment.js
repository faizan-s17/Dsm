import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './SkillAssessment.css';
import { userAxios } from "../../components/UserAuth";
import { ArrowLeft } from 'react-feather'; // Import ArrowLeft icon

const SkillAssessment = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionType, setQuestionType] = useState('both'); // 'both', 'mcq', 'open_ended'
  const [jobDescription, setJobDescription] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Anti-cheat state
  const [antiCheat, setAntiCheat] = useState({
    tabSwitches: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    focusLost: 0,
    fullscreen: false,
    lastEvent: null, // { type, time }
    warningLevel: 0, // 0..3
  });
  
  // Assessment locked state
  const [assessmentLocked, setAssessmentLocked] = useState(false);
  
  // Assessment confidence metrics
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [totalConfidence, setTotalConfidence] = useState(0);
  const [focusScore, setFocusScore] = useState(100); // Start with perfect focus
  
  // Track when each question is viewed
  useEffect(() => {
    // If we have a previous question and a start time, record the time spent
    if (currentQuestionIndex !== null && questionStartTime !== null && questions.length > 0) {
      const timeSpent = Date.now() - questionStartTime;
      
      setQuestionTimeSpent(prev => ({
        ...prev,
        [currentQuestionIndex]: timeSpent
      }));
    }
    
    // Record start time for the current question
    if (questions.length > 0 && currentQuestionIndex !== null && questions[currentQuestionIndex]) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions]);
  
  // Update focus score based on anti-cheat events
  useEffect(() => {
    // Calculate focus score based on violations
    const violationCount = antiCheat.tabSwitches + antiCheat.focusLost + antiCheat.copyAttempts + antiCheat.pasteAttempts;
    const maxScoreReduction = 50; // Maximum reduction from perfect score
    const scoreReduction = Math.min(violationCount * 5, maxScoreReduction); // 5 points per violation
    setFocusScore(Math.max(0, 100 - scoreReduction));
  }, [antiCheat]);
  
  // Track last toast time to prevent duplicates
  const lastToastTime = useRef({}).current;
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please log in to access the skill assessment');
      navigate('/user-signup');
      return;
    }
    
    // New users should always see assessment options first, regardless of localStorage
    // Only check localStorage for returning users
    const urlParams = new URLSearchParams(window.location.search);
    const isNewUser = urlParams.get('new') === 'true';
    const forceNew = urlParams.get('force') === 'true';
    
    if (isNewUser || forceNew) {
      // For new users or forced new assessment, always show assessment options
      localStorage.removeItem('skillAssessmentResults');
      setShowOptions(true);
      setLoading(false);
      return;
    }
    
    // Check if there are saved results from a previous assessment
    const savedResults = localStorage.getItem('skillAssessmentResults');
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        
        // Validate the parsed results to ensure it has the minimum required properties
        if (typeof parsedResults === 'object' && parsedResults !== null) {
          // Ensure scores property exists
          if (!parsedResults.scores) {
            parsedResults.scores = {};
          }
          
          // Set default values for missing properties
          if (!parsedResults.assessmentTime) {
            parsedResults.assessmentTime = 0;
          }
          
          // Only show results if there are actual scores
          if (Object.keys(parsedResults.scores).length > 0) {
            setResults(parsedResults);
          } else {
            // If no scores, remove invalid results and show assessment options
            localStorage.removeItem('skillAssessmentResults');
            setShowOptions(true);
          }
        } else {
          console.error('Invalid results format in localStorage');
          localStorage.removeItem('skillAssessmentResults');
          setShowOptions(true);
        }
        
        setLoading(false);
      } catch (e) {
        console.error('Error parsing saved results:', e);
        localStorage.removeItem('skillAssessmentResults');
        setShowOptions(true);
        setLoading(false);
      }
    } else {
      // If no saved results, show the assessment options
      setShowOptions(true);
      setLoading(false);
    }
  }, [navigate]);
  
  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        setTimeElapsed(timeElapsed => timeElapsed + 1);
      }, 1000);
    } else if (!timerActive && timeElapsed !== 0) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeElapsed]);
  
  // Anti-cheat event listeners
  useEffect(() => {
    // Don't start anti-cheat if assessment is already submitted/evaluated
    if (submitting || results) return;
    
    // Track last event time to prevent duplicate toasts
    const lastEventTime = {};
    
    const onVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === "hidden" && now - (lastEventTime.TAB_SWITCH || 0) > 1000) {
        lastEventTime.TAB_SWITCH = now;
        bumpAntiCheat("TAB_SWITCH");
      }
    };

    const onBlur = () => {
      const now = Date.now();
      if (now - (lastEventTime.FOCUS_LOST || 0) > 1000) {
        lastEventTime.FOCUS_LOST = now;
        bumpAntiCheat("FOCUS_LOST");
      }
    };

    const onCopy = (e) => {
      const now = Date.now();
      if (now - (lastEventTime.COPY || 0) > 1000) {
        lastEventTime.COPY = now;
        bumpAntiCheat("COPY");
        // optional block:
        // e.preventDefault();
      }
    };

    const onPaste = (e) => {
      const now = Date.now();
      if (now - (lastEventTime.PASTE || 0) > 1000) {
        lastEventTime.PASTE = now;
        bumpAntiCheat("PASTE");
        // optional block:
        // e.preventDefault();
      }
    };

    const onFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      const now = Date.now();
      const eventType = fs ? "FULLSCREEN_ON" : "FULLSCREEN_OFF";
      if (now - (lastEventTime[eventType] || 0) > 1000) {
        lastEventTime[eventType] = now;
        bumpAntiCheat(eventType);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [submitting, results]);
  
  // Function to request fullscreen
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) {}
  };
  
  // Anti-cheat helper function
  const bumpAntiCheat = (type) => {
    // Only run anti-cheat if assessment is not submitted/evaluated
    if (submitting || results) return;
    
    setAntiCheat(prev => {
      const next = { ...prev };
      const now = Date.now();

      if (type === "TAB_SWITCH") next.tabSwitches += 1;
      if (type === "COPY") next.copyAttempts += 1;
      if (type === "PASTE") next.pasteAttempts += 1;
      if (type === "FOCUS_LOST") next.focusLost += 1;
      if (type === "FULLSCREEN_ON") next.fullscreen = true;
      if (type === "FULLSCREEN_OFF") next.fullscreen = false;

      next.lastEvent = { type, time: now };

      // Simple warning ladder (tune as you want)
      const score =
        next.tabSwitches * 2 +
        next.focusLost * 1 +
        next.copyAttempts * 2 +
        next.pasteAttempts * 2;

      next.warningLevel =
        score >= 10 ? 3 : score >= 6 ? 2 : score >= 3 ? 1 : 0;

      // Show toast when user triggers suspicious behavior (only if not shown recently)
      if (type === "TAB_SWITCH" && (now - (lastToastTime.TAB_SWITCH || 0) > 2000)) {
        lastToastTime.TAB_SWITCH = now;
        toast.warning("Tab switching detected. This may affect your integrity score.");
      }
      if (type === "COPY" && (now - (lastToastTime.COPY || 0) > 2000)) {
        lastToastTime.COPY = now;
        toast.warning("Copy detected. Avoid copying during assessment.");
      }
      if (type === "PASTE" && (now - (lastToastTime.PASTE || 0) > 2000)) {
        lastToastTime.PASTE = now;
        toast.warning("Paste detected. Avoid pasting during assessment.");
      }
      
      // Lock the assessment if warning level reaches 3
      if (next.warningLevel >= 3 && !assessmentLocked) {
        setAssessmentLocked(true);
        toast.error("Session locked due to policy violation.");
      }

      return next;
    });
  };
  

  
  // Anti-cheat indicator bar component
  const AntiCheatBar = () => {
    const level = antiCheat.warningLevel;

    const label =
      level === 0 ? "Integrity: Good" :
      level === 1 ? "Integrity: Warning" :
      level === 2 ? "Integrity: High Risk" :
                    "Integrity: Critical";

    return (
      <div className={`antiCheatBar level-${level}`}>
        <div className="antiCheatTop">
          <div className="antiCheatStatus">
            <span className="dot" />
            <span className="label">{label}</span>
          </div>

          <div className="antiCheatFS">
            <span className={`fsBadge ${antiCheat.fullscreen ? "on" : "off"}`}>
              {antiCheat.fullscreen ? "Fullscreen On" : "Fullscreen Off"}
            </span>
          </div>
        </div>

        <div className="antiCheatStats">
          <div className="stat"><span>Tab Switch</span><b>{antiCheat.tabSwitches}</b></div>
          <div className="stat"><span>Focus Lost</span><b>{antiCheat.focusLost}</b></div>
          <div className="stat"><span>Copy</span><b>{antiCheat.copyAttempts}</b></div>
          <div className="stat"><span>Paste</span><b>{antiCheat.pasteAttempts}</b></div>
        </div>

        {antiCheat.lastEvent && (
          <div className="antiCheatHint">
            Last event: <b>{antiCheat.lastEvent.type}</b>
          </div>
        )}
      </div>
    );
  };
  
  // Assessment Locked Overlay component
  const AssessmentLockedOverlay = () => {
    return (
      <div className="assessment-locked-overlay">
        <div className="locked-content">
          <div className="lock-icon">🔒</div>
          <h2>Assessment Locked</h2>
          <p>Session locked due to policy violation</p>
          <button 
            onClick={() => {
              // Navigate back to dashboard when locked
              navigate('/user-dashboard');
            }}
            className="locked-continue-btn"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  };
  
  // Question Navigator Panel component
  const QuestionNavigatorPanel = () => {
    if (!questions || questions.length === 0) return null;
    
    const isAnswered = (index) => {
      return answers[index] && answers[index].trim() !== '';
    };
    
    const navigateToQuestion = (index) => {
      setCurrentQuestionIndex(index);
    };
    
    return (
      <div className="question-navigator-panel">
        <h3>Questions</h3>
        <div className="navigator-grid">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`navigator-item ${index === currentQuestionIndex ? 'current' : ''} ${isAnswered(index) ? 'answered' : 'not-answered'}`}
              onClick={() => navigateToQuestion(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Assessment Confidence Summary component
  const AssessmentConfidenceSummary = () => {
    // Calculate average time spent per question
    const totalQuestionTime = Object.values(questionTimeSpent).reduce((sum, time) => sum + time, 0);
    const avgTimePerQuestion = questions.length > 0 ? totalQuestionTime / questions.length / 1000 : 0; // in seconds
    
    // Calculate average confidence based on anti-cheat metrics
    // Lower focus score and more violations indicate lower confidence
    const baseConfidence = 85; // Base confidence
    const violationPenalty = (antiCheat.tabSwitches * 2 + antiCheat.focusLost * 1 + antiCheat.copyAttempts * 3 + antiCheat.pasteAttempts * 3);
    const calculatedConfidence = Math.max(20, baseConfidence - violationPenalty); // Minimum 20% confidence
    
    return (
      <div className="assessment-confidence-summary">
        <h3>Assessment Metrics</h3>
        <div className="confidence-metrics">
          <div className="metric-item">
            <div className="metric-label">Avg. Time per Question</div>
            <div className="metric-value">{avgTimePerQuestion.toFixed(1)}s</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Avg. Confidence</div>
            <div className="metric-value">{calculatedConfidence}%</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Focus Score</div>
            <div className="metric-value">{focusScore}%</div>
          </div>
        </div>
        <p className="metrics-disclaimer">These metrics are logged for future model training.</p>
      </div>
    );
  };  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found in localStorage');
        toast.error('Please log in to access the skill assessment');
        navigate('/user-signup');
        return;
      }
      
      // First fetch user profile to see available skills
      const userProfileResponse = await userAxios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userSkills = userProfileResponse.data.skills || [];
      
      if (!userSkills || userSkills.length === 0) {
        toast.error('No skills found in your profile. Please update your profile with skills first.');
        setLoading(false);
        navigate('/profile');
        return;
      }
      
      console.log('Found user skills:', userSkills);
      
      // Prepare question types array based on user selection
      let questionTypes = ['mcq', 'open_ended'];
      if (questionType === 'mcq') {
        questionTypes = ['mcq'];
      } else if (questionType === 'open_ended') {
        questionTypes = ['open_ended'];
      }
      
      console.log('Sending request to get questions with token:', token.substring(0, 10) + '...');
      console.log('Requesting assessment for these skills:', userSkills);
      
      const response = await userAxios.post('http://localhost:5000/api/assessment/generate', {
        skills: userSkills,
        questionType: questionType,
        experienceLevel: experienceLevel,
        jobDescription: jobDescription.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Received response:', response.data);
      
      if (response.data.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        
        // Initialize answers state with empty values
        const initialAnswers = {};
        response.data.questions.forEach((q, index) => {
          initialAnswers[index] = '';
        });
        setAnswers(initialAnswers);
        setCurrentQuestionIndex(0);
        
        // Start the timer
        setTimeElapsed(0);
        setTimerActive(true);
        
        // Request fullscreen when assessment starts
        requestFullscreen();
        
        // Show success message with number of skills and questions
        const uniqueSkills = [...new Set(response.data.questions.map(q => q.Skill))];
        toast.success(`Assessment created with ${response.data.questions.length} questions for ${uniqueSkills.length} skills`);
      } else {
        console.error('No questions returned in response:', response.data);
        toast.error('No questions found for your skills. Please update your profile with skills first.');
        // Try to find user in localStorage to see if they have skills
        try {
          const userData = localStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            console.log('User data from localStorage:', user);
            if (!user.skills || user.skills.length === 0) {
              console.log('No skills found in user data');
            }
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Check if the error is due to authentication
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/user-signup');
        return;
      }
      
      const errorMessage = error.response?.data?.error || 'Failed to load assessment questions';
      toast.error(errorMessage);
      
      // Log detailed error info for debugging
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        response: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnswerChange = (index, answer) => {
    setAnswers({ ...answers, [index]: answer });
  };
  
  const handleMCQSelect = (index, option) => {
    setAnswers({ ...answers, [index]: option });
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      // Move to the previous question
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleBackNavigation = () => {
    if (results) {
      // If results are showing, go back to dashboard
      navigate('/user-dashboard');
    } else if (!showOptions && questions.length > 0) {
      // If in assessment, go back to options
      setShowOptions(true);
      setQuestions([]);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimerActive(false);
    } else {
      // Otherwise go back to dashboard
      navigate('/user-dashboard');
    }
  };
  
  const handleSubmit = async () => {
    // Capture time for the current question before submitting
    if (currentQuestionIndex !== null && questionStartTime !== null) {
      const timeSpent = Date.now() - questionStartTime;
      
      setQuestionTimeSpent(prev => ({
        ...prev,
        [currentQuestionIndex]: timeSpent
      }));
    }
    
    // Check if all questions have been answered
    const unansweredQuestions = Object.entries(answers).filter(([_, answer]) => !answer.trim());
    
    if (unansweredQuestions.length > 0) {
      toast.warning('Please answer all questions before submitting');
      return;
    }
    
    setSubmitting(true);
    setTimerActive(false);
    
    try {
      // Make sure we have the token BEFORE making any API calls
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/user-signup');
        setSubmitting(false);
        return;
      }
      
      // Verify token validity before proceeding
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Check if token is expired
        if (tokenData.exp * 1000 < Date.now()) {
          console.log('Token expired before assessment submission');
          localStorage.removeItem('authToken');
          toast.error('Your session has expired. Please log in again.');
          navigate('/user-signup');
          setSubmitting(false);
          return;
        }
        
        // Store the user's role to ensure proper redirections
        const userRole = tokenData.role || 'user';
        console.log('User role from token:', userRole);
      } catch (tokenError) {
        console.error('Error verifying token:', tokenError);
        toast.error('Authentication error. Please log in again.');
        navigate('/user-signup');
        setSubmitting(false);
        return;
      }
      
      // Convert answers object to an array preserving the order of questions
      const answersArray = questions.map((_, index) => answers[index] || '');
      
      // Log the submission data for debugging
      console.log('Submitting assessment with data:', {
        questions: questions.length,
        answers: answersArray.length,
        user_level: experienceLevel
      });
      
      // Calculate assessment metrics
      const totalQuestionTime = Object.values(questionTimeSpent).reduce((sum, time) => sum + time, 0);
      const avgTimePerQuestion = questions.length > 0 ? totalQuestionTime / questions.length / 1000 : 0; // in seconds
      
      // Calculate average confidence based on anti-cheat metrics
      // Lower focus score and more violations indicate lower confidence
      const baseConfidence = 85; // Base confidence
      const violationPenalty = (antiCheat.tabSwitches * 2 + antiCheat.focusLost * 1 + antiCheat.copyAttempts * 3 + antiCheat.pasteAttempts * 3);
      const calculatedConfidence = Math.max(20, baseConfidence - violationPenalty); // Minimum 20% confidence
      const avgConfidence = calculatedConfidence;
      
      const response = await userAxios.post('http://localhost:5000/api/assessment/evaluate', {
        questions: questions,
        answers: answersArray,
        experienceLevel: experienceLevel,
        assessmentMetrics: {
          avgTimePerQuestion: avgTimePerQuestion,
          avgConfidence: avgConfidence,
          focusScore: focusScore,
          antiCheat: {
            tabSwitches: antiCheat.tabSwitches,
            copyAttempts: antiCheat.copyAttempts,
            pasteAttempts: antiCheat.pasteAttempts,
            focusLost: antiCheat.focusLost,
            warningLevel: antiCheat.warningLevel
          },
          totalAssessmentTime: timeElapsed,
          questionTimeSpent: Object.entries(questionTimeSpent).map(([index, time]) => ({
            questionIndex: parseInt(index),
            timeSpent: time // time in milliseconds
          }))
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Assessment response data:', response.data);
      
      // Add assessment time and date to results
      const resultsWithTime = {
        ...response.data,
        assessmentTime: timeElapsed,
        assessmentDate: new Date().toISOString(),
        detailed_assessment: questions.map((q, idx) => {
          // For MCQ questions, determine if the answer is correct
          const isCorrect = q.Type === 'mcq' ? 
            answersArray[idx] === q.CorrectAnswer : undefined;
          
          return {
            question: q.Question,
            skill: q.Skill,
            answer: answersArray[idx],
            type: q.Type,
            isCorrect: isCorrect, // Will be true, false, or undefined for open-ended
            correctAnswer: q.Type === 'mcq' ? q.CorrectAnswer : undefined
          };
        })
      };
      
      // Ensure required fields exist
      if (!resultsWithTime.scores) {
        resultsWithTime.scores = {};
        
        // Post-process to ensure wrong MCQ answers don't get high scores
        if (resultsWithTime.detailed_assessment) {
          // Group questions by skill
          const assessmentsBySkill = {};
          
          resultsWithTime.detailed_assessment.forEach(item => {
            if (!assessmentsBySkill[item.skill]) {
              assessmentsBySkill[item.skill] = [];
            }
            assessmentsBySkill[item.skill].push(item);
          });
          
          // Calculate scores by skill with MCQ correction
          const skillScores = {};
          
          Object.entries(assessmentsBySkill).forEach(([skill, items]) => {
            // Count MCQ questions and correct answers
            let mcqTotal = 0;
            let mcqCorrect = 0;
            let openEndedTotal = 0;
            let openEndedScoreSum = 0;
            
            items.forEach(item => {
              if (item.type === 'mcq') {
                mcqTotal++;
                if (item.isCorrect === true) {
                  mcqCorrect++;
                }
              } else if (item.type === 'open_ended') {
                openEndedTotal++;
                // If we have a score from the backend for this question, use it
                if (item.score !== undefined) {
                  openEndedScoreSum += item.score;
                }
                // Otherwise use the overall skill score if available
                else if (response.data.scores && response.data.scores[skill]) {
                  openEndedScoreSum += response.data.scores[skill];
                }
                // Otherwise assume a median score for open-ended
                else {
                  openEndedScoreSum += 50;
                }
              }
            });
            
            // Calculate final score with correct weights
            let finalScore = 0;
            
            if (mcqTotal > 0 && openEndedTotal === 0) {
              // All MCQ questions - score based only on correct answers
              finalScore = Math.round((mcqCorrect / mcqTotal) * 100);
            } else if (mcqTotal === 0 && openEndedTotal > 0) {
              // All open-ended - use average of existing scores
              finalScore = Math.round(openEndedScoreSum / openEndedTotal);
            } else if (mcqTotal > 0 && openEndedTotal > 0) {
              // Mixed question types - weight MCQ and open-ended appropriately
              const mcqScore = (mcqCorrect / mcqTotal) * 100;
              const openEndedScore = openEndedScoreSum / openEndedTotal;
              
              // Give more weight to MCQ since they're objective
              finalScore = Math.round((mcqScore * 0.6) + (openEndedScore * 0.4));
            }
            
            // Ensure final score doesn't make no sense
            if (mcqTotal > 0 && mcqCorrect === 0) {
              // If all MCQs were wrong, cap the score at a low value
              finalScore = Math.min(finalScore, 30);
            }
            
            // Store the calculated score
            skillScores[skill] = finalScore;
          });
          
          // Use our corrected skill scores
          resultsWithTime.scores = skillScores;
        }
      }
      
      // Ensure we have at least empty arrays for recommendations if they don't exist
      if (!resultsWithTime.recommended_courses) {
        resultsWithTime.recommended_courses = [];
      }
      
      if (!resultsWithTime.recommended_jobs) {
        resultsWithTime.recommended_jobs = [];
      }
      
      console.log('Final assessment results:', resultsWithTime);
      
      setResults(resultsWithTime);
      
      // Save results to local storage to persist across page reloads
      localStorage.setItem('skillAssessmentResults', JSON.stringify(resultsWithTime));
      
      // Make a separate call to update the user's skill scores in their profile
      try {
        // Use the same token for consistency
        const updateResponse = await userAxios.post('http://localhost:5000/api/assessment/update-skill-scores', {
          skillScores: Object.entries(resultsWithTime.scores).map(([skill, score]) => ({
            skill,
            score,
            assessedAt: new Date()
          }))
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('User profile updated with skill scores', updateResponse.data);
      } catch (profileError) {
        console.error('Error updating user profile with skill scores:', profileError);
        // Continue execution even if this fails - don't redirect to login
      }
      
      // Update dashboard data if available
      if (window.updateDashboardData && typeof window.updateDashboardData === 'function') {
        window.updateDashboardData();
      }

      // Show success message with clear redirection plan
      toast.success('Assessment completed and saved successfully!', {
        autoClose: 3000
      });
      
      // Log completion
      console.log('Assessment completed successfully');
      
      // Explicitly verify token one more time before returning results
      try {
        const finalToken = localStorage.getItem('authToken');
        if (!finalToken) {
          console.error('Token missing after assessment completion');
          throw new Error('Authentication token not found');
        }
        
        const tokenData = JSON.parse(atob(finalToken.split('.')[1]));
        const userRole = tokenData.role || 'user';
        console.log('User role from token after assessment:', userRole);
        
        // No automatic redirection - user will use the "Go to Dashboard" button instead
      } catch (err) {
        console.error('Error in final token check:', err);
        toast.error('Session error. Please log in again');
        navigate('/user-signup');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit assessment';
      toast.error(errorMessage);
      
      // Check if this is an authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/user-signup');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderProgress = () => {
    return (
      <div className="assessment-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentQuestionIndex + 1) / questions.length * 100}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="timer-text">
            Time: {formatTime(timeElapsed)}
          </div>
        </div>
      </div>
    );
  };
  
  const renderAssessmentOptions = () => {
    return (
      <div className="assessment-options">
        <h2>Customize Your Assessment</h2>
        
        <div className="option-group">
          <label>Question Type:</label>
          <div className="radio-group">
            <div 
              className={`option-card ${questionType === 'both' ? 'active' : ''}`}
              onClick={() => setQuestionType('both')}
            >
              <input 
                type="radio" 
                name="questionType" 
                value="both" 
                checked={questionType === 'both'} 
                onChange={() => setQuestionType('both')}
                style={{ display: 'none' }}
              />
              <div>
                <h3>Both MCQ & Open-ended</h3>
                <p>Best for comprehensive assessment</p>
              </div>
            </div>
            <div 
              className={`option-card ${questionType === 'mcq' ? 'active' : ''}`}
              onClick={() => setQuestionType('mcq')}
            >
              <input 
                type="radio" 
                name="questionType" 
                value="mcq" 
                checked={questionType === 'mcq'} 
                onChange={() => setQuestionType('mcq')}
                style={{ display: 'none' }}
              />
              <div>
                <h3>Multiple Choice Only</h3>
                <p>Quick and objective assessment</p>
              </div>
            </div>
            <div 
              className={`option-card ${questionType === 'open_ended' ? 'active' : ''}`}
              onClick={() => setQuestionType('open_ended')}
            >
              <input 
                type="radio" 
                name="questionType" 
                value="open_ended" 
                checked={questionType === 'open_ended'} 
                onChange={() => setQuestionType('open_ended')}
                style={{ display: 'none' }}
              />
              <div>
                <h3>Open-ended Only</h3>
                <p>Detailed and descriptive assessment</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="option-group">
          <label>Experience Level:</label>
          <div className="select-wrapper">
            <select 
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="experience-select"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <p className="option-help">Select your experience level to get appropriate questions.</p>
        </div>
        
        <div className="option-group">
          <label htmlFor="jobDescription">Optional Job Description:</label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Enter a job description to tailor questions to a specific role (optional)"
            rows={4}
          />
          <p className="option-help">Providing a job description will help generate more relevant assessment questions.</p>
        </div>
        
        <button
          onClick={() => {
            setShowOptions(false);
            fetchQuestions();
          }}
          className="primary-button"
        >
          Start Assessment
        </button>
      </div>
    );
  };
  
  const renderMCQQuestion = (question, index) => {
    return (
      <div className="question-item">
        <div className="question-header">
          <div className="skill-tag">{question.Skill}</div>
          <div className="question-type-tag">Multiple Choice</div>
        </div>
        <div className="question-text">
          <p>{question.Question}</p>
        </div>
        <div className="mcq-options">
          {question.Options.map((option, optionIndex) => (
            <div 
              key={optionIndex} 
              className={`mcq-option ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}
              onClick={() => handleMCQSelect(currentQuestionIndex, option)}
            >
              <input
                type="radio"
                name={`question-${index}`}
                checked={answers[currentQuestionIndex] === option}
                onChange={() => handleMCQSelect(currentQuestionIndex, option)}
                style={{ display: 'none' }}
              />
              <span className="option-text">{option}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderOpenEndedQuestion = (question, index) => {
    return (
      <div className="question-item">
        <div className="question-header">
          <div className="skill-tag">{question.Skill}</div>
          <div className="question-type-tag">Open-ended</div>
        </div>
        <div className="question-text">
          <p>{question.Question}</p>
        </div>
        <div className="answer-input">
          <textarea
            value={answers[currentQuestionIndex] || ''}
            onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
          />
          <div className="char-counter">
            {answers[currentQuestionIndex]?.length || 0} characters
          </div>
        </div>
      </div>
    );
  };
  
  const renderDetailedResults = () => {
    // Guard against undefined results
    if (!results) {
      console.warn('Results object is undefined in renderDetailedResults');
      return (
        <div className="results-container">
          <div className="results-header">
            <h2>Assessment Results Not Available</h2>
            <p>Unable to load assessment results. Please try again.</p>
          </div>
        </div>
      );
    }

    // Create safe getters for potentially undefined properties
    const getAssessmentTime = () => {
      if (typeof results.assessmentTime !== 'number') return 0;
      return results.assessmentTime;
    };

    const getQuestionsCount = () => {
      if (!results.detailed_assessment) return 'N/A';
      if (!Array.isArray(results.detailed_assessment)) return 'N/A';
      return results.detailed_assessment.length;
    };

    const getScores = () => {
      if (!results.scores || typeof results.scores !== 'object') return {};
      return results.scores;
    };

    // Helper to get skill level based on score
    const getSkillLevel = (score) => {
      if (score >= 70) return "advanced";
      if (score >= 40) return "intermediate";
      return "beginner";
    };

    // Helper to get skill level label
    const getSkillLevelLabel = (score) => {
      if (score >= 70) return "Advanced";
      if (score >= 40) return "Intermediate";
      return "Beginner";
    };

    // Helper for skill tips based on level
    const getSkillTip = (skill, score) => {
      if (score >= 70) {
        return `Your ${skill} skills are advanced. Consider teaching others or working on complex projects.`;
      } else if (score >= 40) {
        return `Continue developing your ${skill} skills by working on more challenging projects.`;
      } else {
        return `Focus on building fundamental ${skill} skills with beginner-friendly tutorials and exercises.`;
      }
    };

    return (
      <div className="results-container">
        <div className="results-header">
          <h2>Assessment Complete!</h2>
          <div className="assessment-summary">
            <div className="summary-item">
              <span className="summary-label">Time Taken:</span>
              <span className="summary-value">
                {Math.floor(getAssessmentTime() / 60)}m {getAssessmentTime() % 60}s
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Questions:</span>
              <span className="summary-value">{getQuestionsCount()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Experience Level:</span>
              <span className="summary-value">{experienceLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-action-button">
          <button 
            onClick={() => navigate('/user-dashboard')}
            className="dashboard-button"
          >
            Go to Dashboard to View Recommendations
          </button>
        </div>

        <div className="results-section">
          <h2>Your Skill Scores</h2>
          <div className="skills-chart">
            {Object.entries(getScores()).map(([skill, score], index) => {
              const skillLevel = getSkillLevel(score);
              const skillLevelLabel = getSkillLevelLabel(score);
              
              // This will be the CSS variable for the width
              const scoreWidthVar = `--score-width: ${score}%`;
              
              return (
                <div key={index} className="skill-score-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="skill-name">
                    {skill}
                    <span className={`skill-level-badge skill-level-${skillLevel}`}>
                      {skillLevelLabel}
                    </span>
                  </div>
                  <div className="skill-score-bar">
                    <div 
                      className={`skill-score-fill ${skillLevel}`}
                      style={{ [scoreWidthVar]: '' }}
                    >
                    </div>
                    <div className="skill-score-threshold threshold-40"></div>
                    <div className="skill-score-threshold threshold-70"></div>
                    <span className="skill-score-text">{score}%</span>
                  </div>
                  {results.feedback && results.feedback[skill] && (
                    <div className="skill-feedback">
                      <strong>Feedback:</strong> {results.feedback[skill]}
                    </div>
                  )}
                  <div className="skill-tips">
                    <div className="skill-tip-item">
                      <span className="skill-tip-icon">💡</span>
                      <span>{getSkillTip(skill, score)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {Object.keys(getScores()).length === 0 && (
              <p className="no-data-message">No skill scores available</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const printResults = () => {
    window.print();
  };
  
  if (loading) {
    return (
      <div className="assessment-container">
          {/* Render locked overlay if assessment is locked */}
          {assessmentLocked && <AssessmentLockedOverlay />}
          
          <div className="header-section">
            <div className="logo-container">
              <img 
                src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
                alt="DSM Logo" 
                className="logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/user-dashboard')} 
              className="back-to-dashboard-btn"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
          <div className="assessment-card">
            <div className="assessment-header">
              <h1>Loading Skill Assessment</h1>
              <p>Preparing your personalized skill assessment questions...</p>
            </div>
            <div className="loading-spinner"></div>
          </div>
      </div>
    );
  }
  
  if (results) {
    return (
      <div className="assessment-container assessment-results-container">
          {/* Render locked overlay if assessment is locked */}
          {assessmentLocked && <AssessmentLockedOverlay />}
          
          <div className="header-section">
            <div className="logo-container">
              <img 
                src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
                alt="DSM Logo" 
                className="logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/user-dashboard')} 
              className="back-to-dashboard-btn"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
          <div className="assessment-card results-card">
            <div className="assessment-header">
              <h1>Assessment Results</h1>
              <p>Your personalized skill assessment results</p>
            </div>
          
          {renderDetailedResults()}
          
          <div className="recommendations-section">
            <h2>Recommended Courses</h2>
            <div className="recommendations-grid">
              {/* First show database courses if available */}
              {results?.db_courses && results.db_courses.length > 0 ? (
                results.db_courses.map((course, index) => (
                  <div key={index} className="recommendation-card">
                    <h3>{course.title}</h3>
                    <p><strong>Provider:</strong> {course.provider}</p>
                    {course.description && (
                      <p className="course-description">{course.description.substring(0, 100)}...</p>
                    )}
                    {course.rationale && (
                      <p className="recommendation-rationale">{course.rationale}</p>
                    )}
                    {course.url && (
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="view-link">
                        View Course
                      </a>
                    )}
                  </div>
                ))
              ) : (
                // Otherwise show Gemini-generated recommendations
                results?.recommended_courses && results.recommended_courses.length > 0 ? (
                  results.recommended_courses.map((course, index) => (
                    <div key={index} className="recommendation-card">
                      <h3>{course.title}</h3>
                      <p><strong>Provider:</strong> {course.provider}</p>
                      {course.rationale && (
                        <p className="recommendation-rationale">{course.rationale}</p>
                      )}
                      {course.url && (
                        <a href={course.url} target="_blank" rel="noopener noreferrer" className="view-link">
                          View Course
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-recommendations">No course recommendations available yet.</p>
                )
              )}
            </div>
            
            <h2>Recommended Jobs</h2>
            <div className="recommendations-grid">
              {/* First show database jobs if available */}
              {results?.db_jobs && results.db_jobs.length > 0 ? (
                results.db_jobs.map((job, index) => (
                  <div key={index} className="recommendation-card job-card">
                    <h3>{job.jobTitle}</h3>
                    <p><strong>Company:</strong> {job.companyName}</p>
                    {job.description && (
                      <p className="job-description">{job.description.substring(0, 100)}...</p>
                    )}
                    {job.rationale && (
                      <p className="recommendation-rationale">{job.rationale}</p>
                    )}
                    <button 
                      onClick={() => navigate(`/job/${job.id}`)}
                      className="view-link"
                    >
                      View Job
                    </button>
                  </div>
                ))
              ) : (
                // Otherwise show Gemini-generated recommendations
                results?.recommended_jobs && results.recommended_jobs.length > 0 ? (
                  results.recommended_jobs.map((job, index) => (
                    <div key={index} className="recommendation-card job-card">
                      <h3>{job.jobTitle}</h3>
                      <p><strong>Company:</strong> {job.companyName}</p>
                      <p><strong>Location:</strong> {job.location}</p>
                      {job.rationale && (
                        <p className="recommendation-rationale">{job.rationale}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-recommendations">No job recommendations available yet.</p>
                )
              )}
            </div>
          </div>
          
          <AssessmentConfidenceSummary />
          
          <div className="assessment-actions">
            <button onClick={() => navigate('/user-dashboard')} className="primary-button">
              Go to Dashboard
            </button>
            <button onClick={printResults} className="secondary-button">
              <span className="print-icon">🖨️</span> Print Results
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('skillAssessmentResults');
                setShowOptions(true);
                setResults(null);
              }} 
              className="secondary-button"
            >
              Take New Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (showOptions) {
    return (
      <div className="assessment-container">
          {/* Render locked overlay if assessment is locked */}
          {assessmentLocked && <AssessmentLockedOverlay />}
          
          <div className="header-section">
            <div className="logo-container">
              <img 
                src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
                alt="DSM Logo" 
                className="logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/user-dashboard')} 
              className="back-to-dashboard-btn"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
          <div className="assessment-card">
            <div className="assessment-header">
              <h1>Skill Assessment</h1>
              <p>Test your skills and get personalized course & job recommendations</p>
            </div>
            <div className="assessment-intro">
              <p>Evaluate your skills with our personalized assessment. Complete the assessment to receive customized course and job recommendations.</p>
            </div>
            {renderAssessmentOptions()}
          </div>
      </div>
    );
  }
  
  if (questions.length === 0) {
    return (
      <div className="assessment-container">
          {/* Render locked overlay if assessment is locked */}
          {assessmentLocked && <AssessmentLockedOverlay />}
          
          <div className="header-section">
            <div className="logo-container">
              <img 
                src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
                alt="DSM Logo" 
                className="logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/user-dashboard')} 
              className="back-to-dashboard-btn"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
          <div className="assessment-card">
            <div className="assessment-header">
              <h1>No Questions Available</h1>
              <p>Update your profile to take the assessment</p>
            </div>
            <p>No assessment questions were found for your skills. Please update your profile with relevant skills first.</p>
            <button 
              onClick={() => navigate('/profile')}
              className="primary-button"
            >
              Update Profile
            </button>
          </div>
      </div>
    );
  }
  
  // Render the current question with back button
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="assessment-container">
      {/* Render locked overlay if assessment is locked */}
      {assessmentLocked && <AssessmentLockedOverlay />}
      
      <div className="header-section">
        <div className="logo-container">
          <img 
            src={`${process.env.PUBLIC_URL}/logo-2.svg`} 
            alt="DSM Logo" 
            className="logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `${process.env.PUBLIC_URL}/dmslogo.png`;
            }}
          />
        </div>
        <button 
          onClick={() => navigate('/user-dashboard')} 
          className="back-to-dashboard-btn"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </div>
      
      {/* Anti-cheat indicator bar */}
      {!showOptions && !results && questions.length > 0 && !assessmentLocked && <AntiCheatBar />}
      
      {/* Question Navigator Panel */}
      {!showOptions && !results && questions.length > 0 && !assessmentLocked && <QuestionNavigatorPanel />}
      
      <div className="assessment-card">
        <div className="assessment-header">
          <h1>Skill Assessment</h1>
          <p>Test your skills and get personalized course & job recommendations</p>
        </div>
        
        <div className="assessment-intro">
          <p>Answer the following questions to assess your skills. 
             Your results will be used to provide personalized recommendations.</p>
        </div>
        
        {renderProgress()}
        
        <div className="question-container">
          {currentQuestion.Type === 'mcq' 
            ? renderMCQQuestion(currentQuestion, currentQuestionIndex)
            : renderOpenEndedQuestion(currentQuestion, currentQuestionIndex)
          }
        </div>
        
        <div className="navigation-buttons">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`nav-button ${currentQuestionIndex === 0 ? 'disabled' : ''}`}
          >
            Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="nav-button"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillAssessment; 