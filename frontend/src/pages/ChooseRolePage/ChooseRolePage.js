// ChooseRolePage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, GraduationCap, Check } from "lucide-react";
import "./ChooseRolePage.css";

function ChooseRolePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");

  const handleContinue = () => {
    if (!selectedRole) return;

    if (selectedRole === "Talent") navigate("/user-signup");
    if (selectedRole === "Company") navigate("/company-signup");
  };

  return (
    <div
      className="choose-role-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/LoginBgimg.jpg)`,
      }}
    >
      <div className="choose-role-card">
        {/* Logo */}
        <div className="choose-role-logo-container">
          <div className="choose-role-logo" />
        </div>

        {/* Header */}
        <h1 className="choose-role-title">Select User Type</h1>
        <p className="choose-role-subtitle">
          Choose your role to get a personalized experience.
        </p>

        {/* Role Selection */}
        <div className="choose-role-options">
          {/* Learner */}
          <button
            type="button"
            onClick={() => setSelectedRole("Talent")}
            className={`choose-role-button ${
              selectedRole === "Talent" ? "role-selected" : ""
            }`}
            aria-pressed={selectedRole === "Talent"}
          >
            {selectedRole === "Talent" && (
              <span className="selected-badge" aria-hidden="true">
                <Check size={16} />
              </span>
            )}

            <div className="role-icon-wrap" aria-hidden="true">
              <GraduationCap className="role-icon" />
            </div>

            <div>
              <div className="role-title">Learner</div>
              <div className="role-desc">Build skills, track progress, get matched.</div>
            </div>

            <ul className="role-features">
              <li>
                <span className="feature-dot">✓</span> AI skill assessment
              </li>
              <li>
                <span className="feature-dot">✓</span> Personalized learning paths
              </li>
              <li>
                <span className="feature-dot">✓</span> Smart job recommendations
              </li>
            </ul>
          </button>

          {/* Company */}
          <button
            type="button"
            onClick={() => setSelectedRole("Company")}
            className={`choose-role-button ${
              selectedRole === "Company" ? "role-selected" : ""
            }`}
            aria-pressed={selectedRole === "Company"}
          >
            {selectedRole === "Company" && (
              <span className="selected-badge" aria-hidden="true">
                <Check size={16} />
              </span>
            )}

            <div className="role-icon-wrap" aria-hidden="true">
              <Briefcase className="role-icon" />
            </div>

            <div>
              <div className="role-title">Company</div>
              <div className="role-desc">Post jobs and hire verified talent faster.</div>
            </div>

            <ul className="role-features">
              <li>
                <span className="feature-dot">✓</span> Post jobs in minutes
              </li>
              <li>
                <span className="feature-dot">✓</span> Review verified profiles
              </li>
              <li>
                <span className="feature-dot">✓</span> AI-powered matching
              </li>
            </ul>
          </button>
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`choose-role-continue-button ${
            selectedRole ? "button-enabled" : "button-disabled"
          }`}
        >
          {selectedRole
            ? `Continue as ${selectedRole === "Talent" ? "Learner" : "Company"}`
            : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default ChooseRolePage;
