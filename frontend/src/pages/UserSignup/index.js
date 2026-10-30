// /* eslint-disable jsx-a11y/anchor-is-valid */
// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
// import axios from "axios";
// import "./userSignup.css";

// const base_url = 'http://localhost:5000';

// // Zod schemas for validation
// const registerSchema = z
//   .object({
//     name: z.string().min(2, "Name must be at least 2 characters"),
//     email: z.string().email("Invalid email address"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     confirmPassword: z.string(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ["confirmPassword"],
//   });

// const loginSchema = z.object({
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(6, "Password is required"),
// });

// export default function AuthForm() {
//   const [activeTab, setActiveTab] = useState("signup");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [verificationCode, setVerificationCode] = useState("");
//   const [emailForVerification, setEmailForVerification] = useState("");
//   const navigate = useNavigate();

//   // Sign Up form
//   const {
//     register: registerSignup,
//     handleSubmit: handleSubmitSignup,
//     formState: { errors: errorsSignup },
//   } = useForm({
//     resolver: zodResolver(registerSchema),
//   });

//   // Login form
//   const {
//     register: registerLogin,
//     handleSubmit: handleSubmitLogin,
//     formState: { errors: errorsLogin },
//   } = useForm({
//     resolver: zodResolver(loginSchema),
//   });

//   // Sign Up submission
//   const onSubmitSignup = async (data) => {
//     setIsLoading(true);
//     try {
//       console.log("Sign up data:", data);

//       // Send signup data to the server
//       const response = await axios.post(`${base_url}/api/user/register`, {
//         name: data.name,
//         email: data.email,
//         password: data.password,
//       });

//       if (response.data.success) {
//         alert("A verification code has been sent to your email.");
//         setEmailForVerification(data.email);
//         setIsVerifying(true);
//       } else {
//         alert(response.data.message || "Error during signup. Please try again.");
//       }
//     } catch (error) {
//       console.error("Registration failed:", error);
//       alert("Error during signup. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle verification code submission
//   const handleVerifyCode = async () => {
//     setIsLoading(true);
//     try {
//       const response = await axios.post(`${base_url}/api/user/verify-otp`, {
//         email: emailForVerification,
//         otp: verificationCode,
//       });

//       if (response.data.success) {
//         alert("Email verified successfully!");
//         navigate("/user-dashboard");
//       } else {
//         alert(response.data.message || "Invalid verification code.");
//       }
//     } catch (error) {
//       console.error("OTP verification failed:", error);
//       alert("Error during OTP verification. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Login submission
//   const onSubmitLogin = async (data) => {
//     setIsLoading(true);
//     try {
//       console.log("Login data:", data);
//       alert("Login successful!");
//       navigate("/user-dashboard");
//     } catch (error) {
//       console.error("Login failed:", error);
//       alert("Error during login. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Handle Google Login Success
//   const handleGoogleLoginSuccess = (response) => {
//     console.log("Google Token:", response.credential);
//     alert("Google Sign-In Successful!");
//     navigate("/user-dashboard");
//   };

//   // Handle Google Login Failure
//   const handleGoogleLoginFailure = () => {
//     alert("Google Sign-In Failed. Please try again.");
//   };

//   return (
//     <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
//       <div className="form">
//         {!isVerifying && (
//           <ul className="tab-group">
//             <li
//               className={`tab ${activeTab === "signup" ? "active" : ""}`}
//               onClick={() => setActiveTab("signup")}
//             >
//               <a href="#signup">Sign Up</a>
//             </li>
//             <li
//               className={`tab ${activeTab === "login" ? "active" : ""}`}
//               onClick={() => setActiveTab("login")}
//             >
//               <a href="#login">Log In</a>
//             </li>
//           </ul>
//         )}

//         <div className="tab-content">
//           {isVerifying ? (
//             <div id="verify">
//               <h1>Email Verification</h1>
//               <p>
//                 Please enter the verification code sent to your email to
//                 complete the signup process.
//               </p>
//               <div className="field-wrap">
//                 <label>
//                   Verification Code<span className="req">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={verificationCode}
//                   onChange={(e) => setVerificationCode(e.target.value)}
//                   required
//                 />
//               </div>
//               <button
//                 onClick={handleVerifyCode}
//                 className="button button-block"
//               >
//                 {isLoading ? "Verifying..." : "Verify Email"}
//               </button>
//             </div>
//           ) : (
//             <>
//               {activeTab === "signup" && (
//                 <div id="signup">
//                   <h1>Sign Up for Free</h1>
//                   <form onSubmit={handleSubmitSignup(onSubmitSignup)}>
//                     <div className="field-wrap">
//                       <label>
//                         Full Name<span className="req">*</span>
//                       </label>
//                       <input type="text" {...registerSignup("name")} required />
//                       {errorsSignup.name && (
//                         <p className="text-sm text-red-600">
//                           {errorsSignup.name.message}
//                         </p>
//                       )}
//                     </div>
//                     <div className="field-wrap">
//                       <label>
//                         Email Address<span className="req">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         {...registerSignup("email")}
//                         required
//                       />
//                       {errorsSignup.email && (
//                         <p className="text-sm text-red-600">
//                           {errorsSignup.email.message}
//                         </p>
//                       )}
//                     </div>
//                     <div className="field-wrap">
//                       <label>
//                         Set A Password<span className="req">*</span>
//                       </label>
//                       <input
//                         type="password"
//                         {...registerSignup("password")}
//                         required
//                       />
//                       {errorsSignup.password && (
//                         <p className="text-sm text-red-600">
//                           {errorsSignup.password.message}
//                         </p>
//                       )}
//                     </div>
//                     <div className="field-wrap">
//                       <label>
//                         Confirm Password<span className="req">*</span>
//                       </label>
//                       <input
//                         type="password"
//                         {...registerSignup("confirmPassword")}
//                         required
//                       />
//                       {errorsSignup.confirmPassword && (
//                         <p className="text-sm text-red-600">
//                           {errorsSignup.confirmPassword.message}
//                         </p>
//                       )}
//                     </div>
//                     <button type="submit" className="button button-block">
//                       {isLoading ? (
//                         <span>
//                           Loading... <span className="spinner"></span>
//                         </span>
//                       ) : (
//                         "Get Started"
//                       )}
//                     </button>
//                   </form>
//                   <div className="google-auth">
//                     <GoogleLogin
//                       onSuccess={handleGoogleLoginSuccess}
//                       onError={handleGoogleLoginFailure}
//                     />
//                   </div>
//                 </div>
//               )}
//               {activeTab === "login" && (
//                 <div id="login">
//                   <h1>Welcome Back!</h1>
//                   <form onSubmit={handleSubmitLogin(onSubmitLogin)}>
//                     <div className="field-wrap">
//                       <label>
//                         Email Address<span className="req">*</span>
//                       </label>
//                       <input
//                         type="email"
//                         {...registerLogin("email")}
//                         required
//                       />
//                       {errorsLogin.email && (
//                         <p className="text-sm text-red-600">
//                           {errorsLogin.email.message}
//                         </p>
//                       )}
//                     </div>
//                     <div className="field-wrap">
//                       <label>
//                         Password<span className="req">*</span>
//                       </label>
//                       <input
//                         type="password"
//                         {...registerLogin("password")}
//                         required
//                       />
//                       {errorsLogin.password && (
//                         <p className="text-sm text-red-600">
//                           {errorsLogin.password.message}
//                         </p>
//                       )}
//                     </div>
//                     <button type="submit" className="button button-block">
//                       {isLoading ? (
//                         <span>
//                           Loading... <span className="spinner"></span>
//                         </span>
//                       ) : (
//                         "Log In"
//                       )}
//                     </button>
//                   </form>
//                   <div className="google-auth">
//                     <GoogleLogin
//                       onSuccess={handleGoogleLoginSuccess}
//                       onError={handleGoogleLoginFailure}
//                     />
//                   </div>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </GoogleOAuthProvider>
//   );
// }

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "./userSignup.css";
import axios from "axios";
import { toast } from 'react-toastify';

const base_url = "http://localhost:5000";

// Zod schema for validation
const userRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    skills: z.string().min(1, "Please enter at least one skill"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password is required"),
});

export default function UserAuthForm() {
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
    resolver: zodResolver(userRegisterSchema),
  });

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
  } = useForm({
    resolver: zodResolver(userLoginSchema),
  });

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${base_url}/api/user/forgot-password`,
        { email: forgotPasswordEmail }
      );
      toast.info(response.data.message || "Password reset OTP sent to your email!");
      setShowResetForm(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send reset OTP";
      toast.error(errorMessage);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      const response = await axios.post(
        `${base_url}/api/user/reset-password`,
        {
          email: forgotPasswordEmail,
          otp: resetOTP,
          newPassword,
        }
      );
      toast.success("Password has been successfully reset!");
      setIsForgotPassword(false);
      setShowResetForm(false);
    } catch (error) {
      toast.error("Error resetting password. Please try again.");
    }
  };

  const onSubmitSignup = async (data) => {
    try {
      // Format skills as an array from comma-separated string
      const skillsArray = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
      
      const response = await axios.post(
        `${base_url}/api/user/register`,
        {
          ...data,
          skills: skillsArray
        }
      );
      toast.success(response.data.message);
      setSignupData({
        ...data,
        skills: skillsArray
      });
      setIsVerifying(true);
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const onVerifyOTP = async () => {
    try {
      const response = await axios.post(`${base_url}/api/user/verify-otp`, {
        email: signupData.email,
        otp: enteredOTP,
        name: signupData.fullName,
        password: signupData.password,
        skills: signupData.skills
      });

      if (response.status === 200) {
        const { token, userName } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("userName", userName);
        toast.success("Signup successful! Redirecting to dashboard...");
        navigate('/user-dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid verification code.";
      toast.error(errorMessage);
    }
  };

  const onSubmitLogin = async (data) => {
    try {
      const response = await axios.post(`${base_url}/api/user/login`, data);

      if (response.status === 200) {
        const { token, userName } = response.data;
        localStorage.setItem("authToken", token);
        localStorage.setItem("userName", userName);
        toast.success("Login successful!");
        navigate("/user-dashboard", { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = (credentialResponse) => {
    if (credentialResponse.credential) {
      // Handle successful Google login
      toast.success("Google Login successful!");
      // Add your Google login logic here
    } else {
      toast.error("Google Login failed. Please try again.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.exp * 1000 > Date.now()) {
          navigate("/user-dashboard", { replace: true });
        }
      } catch (error) {
        localStorage.removeItem("authToken");
      }
    }
  }, [navigate]);

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div
        className="user-auth-body"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL + '/LoginBgimg.jpg'})` }}
      >
        <div className="user-auth-form">
          {!isVerifying ? (
            <>
              <ul className="user-auth-tab-group">
                <li
                  className={`user-auth-tab ${
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
                  className={`user-auth-tab ${
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

              <div className="user-auth-tab-content">
                {activeTab === "signup" && (
                  <div id="signup">
                    <h1>Sign Up as a User</h1>
                    <form onSubmit={handleSubmitSignup(onSubmitSignup)}>
                      <div className="user-auth-field-wrap">
                        <label>
                          Full Name<span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          {...registerSignup("fullName")}
                          required
                        />
                        {errorsSignup.fullName && (
                          <p className="error-message">
                            {errorsSignup.fullName.message}
                          </p>
                        )}
                      </div>
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
                        <label>
                          Skills (comma separated)<span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          {...registerSignup("skills")}
                          placeholder="e.g. JavaScript, React, Python, UI/UX Design"
                          required
                        />
                        {errorsSignup.skills && (
                          <p className="error-message">
                            {errorsSignup.skills.message}
                          </p>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="user-auth-button primary"
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
                    <h1>Login as a User</h1>
                    <form onSubmit={handleSubmitLogin(onSubmitLogin)}>
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
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
                        className="user-auth-button primary"
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
                      <p className="user-auth-forgot-password">
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
                      <div className="user-auth-field-wrap">
                        <label>
                          Email Address<span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="user-auth-button primary"
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
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
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
                      <div className="user-auth-field-wrap">
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
                        className="user-auth-button primary"
                      >
                        {isLoading ? "Resetting Password..." : "Reset Password"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="user-auth-otp-verification">
              <h2>Enter OTP</h2>
              <input
                type="text"
                value={enteredOTP}
                onChange={(e) => setEnteredOTP(e.target.value)}
                maxLength={6}
                required
              />
              <button onClick={onVerifyOTP} className="user-auth-button">
                Verify OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
