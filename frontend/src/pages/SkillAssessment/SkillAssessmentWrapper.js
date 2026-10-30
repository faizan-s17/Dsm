import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import SkillAssessment from './SkillAssessment';
import UserAuth from '../../components/UserAuth';

const SkillAssessmentWrapper = () => {
  const [errorKey, setErrorKey] = useState(0);
  const navigate = useNavigate();

  // Function to reset the component by changing its key
  const resetComponent = () => {
    // Remove any problematic data from localStorage
    localStorage.removeItem('skillAssessmentResults');
    // Update the key to force re-render
    setErrorKey(prevKey => prevKey + 1);
  };

  // Function to navigate back to dashboard
  const returnToDashboard = () => {
    navigate('/user-dashboard');
  };

  return (
    <UserAuth>
      <ErrorBoundary 
        resetAction={resetComponent}
        fallbackUI={(
          <div className="error-fallback">
            <h2>Something went wrong with the Skill Assessment</h2>
            <p>We encountered an error while rendering your assessment results.</p>
            <div className="error-actions">
              <button onClick={resetComponent} className="primary-button">
                Try Again
              </button>
              <button onClick={returnToDashboard} className="secondary-button">
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      >
        <SkillAssessment key={errorKey} />
      </ErrorBoundary>
    </UserAuth>
  );
};

export default SkillAssessmentWrapper; 