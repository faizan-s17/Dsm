import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { toast } from 'react-toastify';
import "./companySignup.css";
import axios from "axios";

const base_url = "http://localhost:5000";

// Zod schema for validation
const companyRegisterSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    address: z.string().min(5, "Address must be at least 5 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const companyLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password is required"),
});

export default function CompanyAuthForm() {
  const [activeTab, setActiveTab] = useState("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [enteredOTP, setEnteredOTP] = useState("");
  const [signupData, setSignupData] = useState({});
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetOTP, setResetOTP] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: errorsSignup },
  } = useForm({
    resolver: zodResolver(companyRegisterSchema),
  });

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
  } = useForm({
    resolver: zodResolver(companyLoginSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.exp * 1000 > Date.now()) {
          navigate("/company-dashboard", { replace: true });
        }
      } catch (error) {
        localStorage.removeItem("authToken");
      }
    }
  }, [navigate]);

  const onSubmitSignup = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${base_url}/api/company/register`,
        data
      );
      if (response.status === 200) {
        toast.success(response.data.message);
        setSignupData(data);
        setIsVerifying(true);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    try {
      const response = await axios.post(`${base_url}/api/company/verify-otp`, {
        ...signupData,
        otp: enteredOTP,
      });

      if (response.status === 200) {
        const { token, companyName } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("companyName", companyName);
        toast.success("Signup successful!");
        navigate("/company-dashboard");
      }
    } catch (error) {
      toast.error("Incorrect OTP. Please try again.");
    }
  };

  const onSubmitLogin = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${base_url}/api/company/login`, data);

      if (response.status === 200) {
        const { token, companyName } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("companyName", companyName);
        toast.success("Login successful!");
        navigate("/company-dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${base_url}/api/company/forgot-password`,
        {
          email: forgotPasswordEmail,
        }
      );
      if (response.status === 200) {
        toast.success(
          response.data.message || "Password reset OTP sent to your email!"
        );
        setShowResetForm(true);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Error sending reset OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${base_url}/api/company/reset-password`,
        {
          email: forgotPasswordEmail,
          otp: resetOTP,
          newPassword,
        }
      );
      if (response.status === 200) {
        toast.success("Password has been successfully reset!");
        setIsForgotPassword(false);
        setShowResetForm(false);
        setActiveTab("login");
      }
    } catch (error) {
      toast.error("Error resetting password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        toast.error("Invalid Google login response. Please try again.");
        return;
      }

      const response = await axios.post(
        `${base_url}/api/company/google-login`,
        {
          token: credentialResponse.credential,
        }
      );

      if (response.status === 200) {
        const { token, name } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("companyName", name);
        toast.success("Google Login successful!");
        navigate("/company-dashboard");
      }
    } catch (error) {
      console.error(
        "Google Login Error:",
        error.response?.data || error.message
      );
      toast.error("Google Login failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId="816858607919-ir0r4h1rhhq9g2g7s23e07b7scfqopku.apps.googleusercontent.com">
      <div
        className="company-auth-body"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/LoginBgimg.jpg'})` }}
      >
        <div className="company-auth-form">
          {!isVerifying ? (
            <>
              <ul className="company-auth-tab-group">
                <li
                  className={`company-auth-tab ${
                    activeTab === "signup" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("signup");
                    setIsForgotPassword(false);
                    setShowResetForm(false);
                  }}
                >
                  <a href="#signup">Sign Up</a>
                </li>
                <li
                  className={`company-auth-tab ${
                    activeTab === "login" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTab("login");
                    setIsForgotPassword(false);
                    setShowResetForm(false);
                  }}
                >
                  <a href="#login">Log In</a>
                </li>
              </ul>

              <div className="company-auth-tab-content">
                {activeTab === "signup" && (
                  <div id="signup">
                    <h1>Sign Up Your Company</h1>
                    <form onSubmit={handleSubmitSignup(onSubmitSignup)}>
                      <div className="company-auth-field-wrap">
                        <label>
                          Company Name<span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          {...registerSignup("companyName")}
                          required
                        />
                        {errorsSignup.companyName && (
                          <p className="error-message">
                            {errorsSignup.companyName.message}
                          </p>
                        )}
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Email Address<span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          {...registerSignup("email")}
                          required
                        />
                        {errorsSignup.email && (
                          <p className="error-message">
                            {errorsSignup.email.message}
                          </p>
                        )}
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Password<span className="req">*</span>
                        </label>
                        <input
                          type="password"
                          {...registerSignup("password")}
                          required
                        />
                        {errorsSignup.password && (
                          <p className="error-message">
                            {errorsSignup.password.message}
                          </p>
                        )}
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Confirm Password<span className="req">*</span>
                        </label>
                        <input
                          type="password"
                          {...registerSignup("confirmPassword")}
                          required
                        />
                        {errorsSignup.confirmPassword && (
                          <p className="error-message">
                            {errorsSignup.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Address<span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          {...registerSignup("address")}
                          required
                        />
                        {errorsSignup.address && (
                          <p className="error-message">
                            {errorsSignup.address.message}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="company-auth-button primary"
                      >
                        {isLoading ? "Registering..." : "Register"}
                      </button>
                      <div className="or-divider">or</div>
                      <button
                        className="go-back"
                        onClick={() => navigate("/choose-role")}
                      >
                        Change Role?
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === "login" && !isForgotPassword && (
                  <div id="login">
                    <h1>Login Your Company</h1>
                    <form onSubmit={handleSubmitLogin(onSubmitLogin)}>
                      <div className="company-auth-field-wrap">
                        <label>
                          Email Address<span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          {...registerLogin("email")}
                          required
                        />
                        {errorsLogin.email && (
                          <p className="error-message">
                            {errorsLogin.email.message}
                          </p>
                        )}
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Password<span className="req">*</span>
                        </label>
                        <input
                          type="password"
                          {...registerLogin("password")}
                          required
                        />
                        {errorsLogin.password && (
                          <p className="error-message">
                            {errorsLogin.password.message}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="company-auth-button primary"
                      >
                        {isLoading ? "Logging in..." : "Log In"}
                      </button>
                      <div className="or-divider">or</div>
                      <button
                        className="go-back"
                        onClick={() => navigate("/choose-role")}
                      >
                        Change Role?
                      </button>
                      <p className="company-auth-forgot-password">
                        <a
                          href="#forgot-password"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsForgotPassword(true);
                            setActiveTab("login");
                          }}
                        >
                          Forgot your password?
                        </a>
                      </p>
                    </form>
                  </div>
                )}

                {isForgotPassword && !showResetForm && (
                  <div id="forgot-password">
                    <h1>Reset Your Password</h1>
                    <form onSubmit={handleForgotPassword}>
                      <div className="company-auth-field-wrap">
                        <label>
                          Email Address<span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) =>
                            setForgotPasswordEmail(e.target.value)
                          }
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="company-auth-button primary"
                      >
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    </form>
                  </div>
                )}

                {showResetForm && (
                  <div id="reset-password">
                    <h1>Enter OTP and New Password</h1>
                    <form onSubmit={handlePasswordReset}>
                      <div className="company-auth-field-wrap">
                        <label>
                          Enter OTP<span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          value={resetOTP}
                          onChange={(e) => setResetOTP(e.target.value)}
                          maxLength={6}
                          required
                        />
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          New Password<span className="req">*</span>
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="company-auth-field-wrap">
                        <label>
                          Confirm New Password<span className="req">*</span>
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="company-auth-button primary"
                      >
                        {isLoading ? "Resetting Password..." : "Reset Password"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="company-auth-otp-verification">
              <h2>Enter OTP</h2>
              <input
                type="text"
                value={enteredOTP}
                onChange={(e) => setEnteredOTP(e.target.value)}
                maxLength={6}
                required
              />
              <button onClick={onVerifyOTP} className="company-auth-button">
                Verify OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
