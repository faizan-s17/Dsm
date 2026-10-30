import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import { ArrowLeft } from "lucide-react";
import "./SkillPractice.css";

const SkillPractice = () => {
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [userSolution, setUserSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [availableSkills, setAvailableSkills] = useState([]);
  
  // Anti-cheat state
  const [antiCheat, setAntiCheat] = useState({
    tabSwitches: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    focusLost: 0,
    fullscreen: false,
    lastEvent: null, // { type, time }
    warningLevel: 0, // 0..3
    totalViolations: 0,
    integrityScore: 100
  });
  
  // Focus score state (similar to assessment)
  const [focusScore, setFocusScore] = useState(100); // Start with perfect focus
  
  // Assessment locked state
  const [assessmentLocked, setAssessmentLocked] = useState(false);
  
  // Track when each question is viewed
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  
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
  
  // Keep latest values for event handlers (prevents stale closure bug)
  const currentProblemRef = useRef(null);
  const evaluatingRef = useRef(false);
  const evaluationResultRef = useRef(null);
  const assessmentLockedRef = useRef(false);
  
  useEffect(() => { currentProblemRef.current = currentProblem; }, [currentProblem]);
  useEffect(() => { evaluatingRef.current = evaluating; }, [evaluating]);
  useEffect(() => { evaluationResultRef.current = evaluationResult; }, [evaluationResult]);
  useEffect(() => { assessmentLockedRef.current = assessmentLocked; }, [assessmentLocked]);
  
  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (timerActive) {
      interval = setInterval(() => {
        setTimeSpent(prevTime => prevTime + 1);
      }, 1000);
    } else if (!timerActive && timeSpent !== 0) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeSpent]);
  
  const navigate = useNavigate();

  const base_url = "http://localhost:5000";

  useEffect(() => {
    // Get user's skills to populate the dropdown
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          toast.error('Please log in to access the skill practice');
          navigate("/user-signup");
          return;
        }

        const response = await axios.get(`${base_url}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAvailableSkills(response.data.skills || []);
        // Don't auto-select skill if user has already made a selection
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Error fetching user profile. Please try again.");
      }
    };

    fetchUserProfile();
  }, [navigate]);
  
  // Effect to start timer when a problem is loaded
  useEffect(() => {
    if (currentProblem && problems.length > 0) {
      setTimerActive(true);
      // Request fullscreen when practice starts
      requestFullscreen();
    } else {
      setTimerActive(false);
    }
  }, [currentProblem, problems]);
  
  // Anti-cheat event listeners
  useEffect(() => {
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

    const onFocus = () => {
      const now = Date.now();
      if (document.visibilityState === "visible" && now - (lastEventTime.TAB_SWITCH || 0) > 1000) {
        // This may indicate a tab switch back to our page
        lastEventTime.TAB_SWITCH = now;
        bumpAntiCheat("TAB_SWITCH");
      }
    };

    const onCopy = (e) => {
      const now = Date.now();
      if (now - (lastEventTime.COPY || 0) > 1000) {
        lastEventTime.COPY = now;
        bumpAntiCheat("COPY");
        // Prevent the actual copy if needed
        // e.preventDefault();
      }
    };

    const onPaste = (e) => {
      const now = Date.now();
      if (now - (lastEventTime.PASTE || 0) > 1000) {
        lastEventTime.PASTE = now;
        bumpAntiCheat("PASTE");
        // Prevent the actual paste if needed
        // e.preventDefault();
      }
    };

    const onContextMenu = (e) => {
      const now = Date.now();
      if (now - (lastEventTime.COPY || 0) > 1000) {
        lastEventTime.COPY = now;
        bumpAntiCheat("COPY");
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
    window.addEventListener("focus", onFocus);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []); // Run only once on mount
  
  // Function to request fullscreen
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) {}
  };
  
  // Anti-cheat helper function
  const bumpAntiCheat = (type) => {
    // Only run anti-cheat if evaluation is not complete and we have an active problem
    if (evaluatingRef.current || evaluationResultRef.current || !currentProblemRef.current) return;
    
    setAntiCheat(prev => {
      const next = { ...prev };
      const now = Date.now();

      if (type === "TAB_SWITCH") next.tabSwitches += 1;
      if (type === "COPY") next.copyAttempts += 1;
      if (type === "PASTE") next.pasteAttempts += 1;
      if (type === "FOCUS_LOST") next.focusLost += 1;
      if (type === "FULLSCREEN_ON") next.fullscreen = true;
      if (type === "FULLSCREEN_OFF") next.fullscreen = false;

      // update total violations and integrity score
      next.totalViolations = next.tabSwitches + next.copyAttempts + next.pasteAttempts + next.focusLost;
      // Calculate integrity score based on violations (similar to assessment logic)
      const violationCount = next.tabSwitches + next.focusLost + next.copyAttempts + next.pasteAttempts;
      const maxScoreReduction = 50; // Maximum reduction from perfect score
      const scoreReduction = Math.min(violationCount * 5, maxScoreReduction); // 5 points per violation
      next.integrityScore = Math.max(0, 100 - scoreReduction);

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
        toast.warning("Copy detected. Avoid copying during practice.");
      }
      if (type === "PASTE" && (now - (lastToastTime.PASTE || 0) > 2000)) {
        lastToastTime.PASTE = now;
        toast.warning("Paste detected. Avoid pasting during practice.");
      }
      
      // Lock the assessment if warning level reaches 3
      if (next.warningLevel >= 3 && !assessmentLockedRef.current) {
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
      <div className={`antiCheatBar level-${level}`} style={{
        padding: '10px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '5px',
        marginBottom: '20px',
        fontSize: '14px',
        marginTop: '20px' // Add some top margin to position it lower
      }}>
        <div className="antiCheatTop" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <div className="antiCheatStatus" style={{display: 'flex', alignItems: 'center'}}>
            <span className="dot" style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: level === 0 ? 'green' : level === 1 ? 'orange' : level === 2 ? 'red' : 'darkred', marginRight: '8px'}} />
            <span className="label" style={{fontWeight: 'bold'}}>{label}</span>
          </div>

          <div className="antiCheatFS">
            <span className={`fsBadge ${antiCheat.fullscreen ? "on" : "off"}`} style={{
              padding: '3px 8px',
              backgroundColor: antiCheat.fullscreen ? '#d4edda' : '#f8d7da',
              color: antiCheat.fullscreen ? '#155724' : '#721c24',
              borderRadius: '3px',
              fontSize: '12px'
            }}>
              {antiCheat.fullscreen ? "Fullscreen On" : "Fullscreen Off"}
            </span>
          </div>
        </div>

        <div className="antiCheatStats" style={{display: 'flex', justifyContent: 'space-around'}}>
          <div className="stat" style={{textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: '#6c757d'}}>Tab Switch</span><br/>
            <b style={{fontSize: '16px'}}>{antiCheat.tabSwitches}</b>
          </div>
          <div className="stat" style={{textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: '#6c757d'}}>Focus Lost</span><br/>
            <b style={{fontSize: '16px'}}>{antiCheat.focusLost}</b>
          </div>
          <div className="stat" style={{textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: '#6c757d'}}>Copy</span><br/>
            <b style={{fontSize: '16px'}}>{antiCheat.copyAttempts}</b>
          </div>
          <div className="stat" style={{textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: '#6c757d'}}>Paste</span><br/>
            <b style={{fontSize: '16px'}}>{antiCheat.pasteAttempts}</b>
          </div>
          <div className="stat" style={{textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: '#6c757d'}}>Integrity</span><br/>
            <b style={{fontSize: '16px'}}>{antiCheat.integrityScore}%</b>
          </div>
        </div>

        {antiCheat.lastEvent && (
          <div className="antiCheatHint" style={{marginTop: '10px', textAlign: 'center', fontSize: '12px', color: '#6c757d'}}>
            Last event: <b>{antiCheat.lastEvent.type}</b>
          </div>
        )}
      </div>
    );
  };
  
  // Assessment Locked Overlay component
  const AssessmentLockedOverlay = () => {
    return (
      <div className="assessment-locked-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <div className="locked-content" style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div className="lock-icon" style={{fontSize: '48px', marginBottom: '15px'}}>🔒</div>
          <h2>Practice Session Locked</h2>
          <p>Session locked due to policy violation</p>
          <button 
            onClick={() => {
              // Navigate back to dashboard when locked
              toast.info("Returning to dashboard due to policy violation.");
              navigate('/user-dashboard');
            }}
            className="locked-continue-btn"
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  };

  const fetchProblems = async () => {
    if (!selectedSkill) {
      toast.error("Please select a skill first");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${base_url}/api/practice/problems`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            skill: selectedSkill,
            difficulty: difficulty,
            count: 5
          }
        }
      );

      setProblems(response.data.problems);
      if (response.data.problems && response.data.problems.length > 0) {
        setCurrentProblem(response.data.problems[0]);
        // Reset time when problems are fetched
        setTimeSpent(0);
        setTimerActive(true);
        
        // Request fullscreen when practice starts
        requestFullscreen();
        
        // Show success message
        const uniqueSkills = [...new Set(response.data.problems.map(p => p.skill || p.Skill))];
        toast.success(`Practice problems created with ${response.data.problems.length} problems for ${uniqueSkills.length} skills`);
      }
    } catch (error) {
      console.error("Error fetching practice problems:", error);
      toast.error("Error fetching practice problems. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateSolution = async () => {
    if (!userSolution.trim()) {
      toast.error("Please enter your solution");
      return;
    }

    setEvaluating(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${base_url}/api/practice/evaluate`,
        {
          skill: selectedSkill,
          solution: userSolution,
          problem: currentProblem,
          timeSpent: timeSpent,
          antiCheatMetrics: {
            tabSwitches: antiCheat.tabSwitches,
            copyAttempts: antiCheat.copyAttempts,
            pasteAttempts: antiCheat.pasteAttempts,
            focusLost: antiCheat.focusLost,
            warningLevel: antiCheat.warningLevel,
            totalViolations: antiCheat.totalViolations,
            integrityScore: antiCheat.integrityScore,
            focusScore: focusScore
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setEvaluationResult(response.data.result);
    } catch (error) {
      console.error("Error evaluating solution:", error);
      toast.error("Error evaluating solution. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      setCurrentProblemIndex(nextIndex);
      setCurrentProblem(problems[nextIndex]);
      setUserSolution("");
      setEvaluationResult(null);
      // Reset timer for the new problem
      setTimeSpent(0);
    }
  };

  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      const prevIndex = currentProblemIndex - 1;
      setCurrentProblemIndex(prevIndex);
      setCurrentProblem(problems[prevIndex]);
      setUserSolution("");
      setEvaluationResult(null);
      // Reset timer for the new problem
      setTimeSpent(0);
    }
  };

  return (
    <div className="skill-practice-container">
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

        <div className="header-right">
          <button 
            onClick={() => navigate('/user-dashboard')} 
            className="back-to-dashboard-btn"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
        </div>
      </div>
      <h1>Skill Practice</h1>
      
      {/* Anti-cheat indicator bar as floating element */}
      {!assessmentLocked && (
        <div className="integrity-under-button">
          <AntiCheatBar />
        </div>
      )}
      
      <div className="practice-setup">
        <div className="setup-controls">
          <div className="form-group">
            <label htmlFor="skill-select">Select Skill:</label>
            <select
              id="skill-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="form-select"
            >
              <option value="">-- Select a skill --</option>
              {availableSkills.map((skill, index) => (
                <option key={index} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="difficulty-select">Difficulty:</label>
            <select
              id="difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="form-select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <button 
            onClick={fetchProblems} 
            disabled={loading || !selectedSkill}
            className="primary-button"
          >
            {loading ? "Loading Problems..." : "Get Practice Problems"}
          </button>
        </div>
      </div>

      {currentProblem && (
        <div className="problem-section">
          <div className="problem-header">
            <h2>Problem {currentProblemIndex + 1} of {problems.length}</h2>
            <div className="problem-timer">
              <div className="time-spent">Time: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
            </div>
            <div className="problem-navigation">
              <button 
                onClick={handlePrevProblem} 
                disabled={currentProblemIndex === 0}
                className="nav-button"
              >
                Previous
              </button>
              <button 
                onClick={handleNextProblem} 
                disabled={currentProblemIndex === problems.length - 1}
                className="nav-button"
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="problem-content">
            <h3>{currentProblem.title || "Practice Problem"}</h3>
            <div className="problem-description">
              <p>{currentProblem.description}</p>
              
              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div className="problem-examples">
                  <h4>Examples:</h4>
                  {currentProblem.examples.map((example, idx) => (
                    <div key={idx} className="example">
                      <p><strong>Example {idx + 1}:</strong></p>
                      <p><strong>Input:</strong> {example.input}</p>
                      <p><strong>Output:</strong> {example.output}</p>
                      {example.explanation && (
                        <p><strong>Explanation:</strong> {example.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="solution-section">
            <h3>Your Solution</h3>
            <textarea
              value={userSolution}
              onChange={(e) => setUserSolution(e.target.value)}
              placeholder="Write your solution here..."
              className="solution-input"
              rows={10}
            />
            
            <button 
              onClick={handleEvaluateSolution} 
              disabled={evaluating || !userSolution.trim()}
              className="evaluate-button"
            >
              {evaluating ? "Evaluating..." : "Evaluate Solution"}
            </button>
          </div>
          
          {evaluationResult && (
            <div className={`evaluation-result ${evaluationResult.passed ? 'success' : 'failure'}`}>
              <h3>Evaluation Result</h3>
              <div className="result-details">
                <p><strong>Score:</strong> {evaluationResult.score}%</p>
                <p><strong>Status:</strong> {evaluationResult.passed ? 'Passed' : 'Failed'}</p>
                <p><strong>Feedback:</strong> {evaluationResult.feedback}</p>
                {evaluationResult.metrics && (
                  <div className="result-metrics">
                    <p><strong>Focus Score:</strong> {evaluationResult.metrics.focusScore}%</p>
                    <p><strong>Anti-Cheat Score:</strong> {evaluationResult.metrics.antiCheatScore}%</p>
                    <p><strong>Code Quality:</strong> {evaluationResult.metrics.codeQuality}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {!selectedSkill && (
        <div className="no-skill-message">
          <p>Please select a skill to start practicing.</p>
        </div>
      )}
    </div>
  );
};

export default SkillPractice;