import React, { useState, useEffect, useRef } from "react";
import { fetchChatbotResponse } from "../../utils/geminiAPI";
import "./Chatbot.css";
import { Send, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Chatbot = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    { text: "Hey there! How can I help you today?", type: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState(null); // Store user data

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
    
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          // Fetch user profile
          const profileResponse = await axios.get("http://localhost:5000/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Fetch recommended courses based on user skills
          let recommendedCourses = [];
          if (profileResponse.data.skills && profileResponse.data.skills.length > 0) {
            try {
              const coursesResponse = await axios.get("http://localhost:5000/api/courses/recommended", {
                headers: { Authorization: `Bearer ${token}` },
                params: { skills: profileResponse.data.skills.join(",") }
              });
              recommendedCourses = coursesResponse.data.courses || [];
            } catch (coursesError) {
              console.error("Error fetching recommended courses:", coursesError);
              // Generate fallback courses based on skills
              recommendedCourses = generateFallbackCourses(profileResponse.data.skills);
            }
          }
          
          // Fetch recommended jobs based on user skills
          let recommendedJobs = [];
          if (profileResponse.data.skills && profileResponse.data.skills.length > 0) {
            try {
              const jobsResponse = await axios.get("http://localhost:5000/api/jobs/recommended", {
                headers: { Authorization: `Bearer ${token}` },
                params: { skills: profileResponse.data.skills.join(",") }
              });
              recommendedJobs = jobsResponse.data.jobs || [];
            } catch (jobsError) {
              console.error("Error fetching recommended jobs:", jobsError);
              // Generate fallback jobs based on skills
              recommendedJobs = generateFallbackJobs(profileResponse.data.skills);
            }
          }
          
          // Combine all data
          setUserData({
            ...profileResponse.data,
            recommendedCourses,
            recommendedJobs
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // User might not be logged in, that's OK
      }
    };
    
    // Helper to generate fallback courses
    const generateFallbackCourses = (skills) => {
      const providers = ["Coursera", "Udemy", "edX", "Pluralsight", "LinkedIn Learning"];
      return skills.slice(0, 4).map((skill, index) => ({
        title: `${skill} Fundamentals`,
        provider: providers[index % providers.length],
        description: `Build a solid foundation in ${skill} with this hands-on course covering all the essentials.`,
        skills: [skill]
      }));
    };
    
    // Helper to generate fallback jobs
    const generateFallbackJobs = (skills) => {
      const companies = ["Tech Solutions Inc.", "Digital Innovations", "Global Software", "NextGen Technologies"];
      return skills.slice(0, 4).map((skill, index) => ({
        jobTitle: `${skill} Developer`,
        companyName: companies[index % companies.length],
        location: ["Remote", "New York, NY", "San Francisco, CA", "Austin, TX"][index % 4],
        skills: [skill],
        matchPercentage: Math.floor(60 + Math.random() * 40)
      }));
    };
    
    fetchUserData();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMessage = { text: userText, type: "user" };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const botReply = await fetchChatbotResponse(userText, userData);
      if (botReply) {
        const botMessage = { text: botReply, type: "bot" };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      console.error("Chatbot Error:", err);
      setError("Error communicating with AI service");
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I'm having trouble connecting to the AI service. Please try again later.",
          type: "bot",
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    setError(null);
    setMessages((prev) =>
      prev.filter((msg, index) => !(index === prev.length - 1 && msg.isError))
    );
  };

  return (
    <div className="cb-page">
      {/* ✅ Top Navbar like your reference */}
      <div className="cb-topbar">
        <div className="cb-topbar-inner">
          <div className="cb-brand" onClick={() => navigate("/user-dashboard")} role="button" tabIndex={0}>
            <img className="cb-logo" src={`${process.env.PUBLIC_URL}/logo-2.svg`} alt="DSM" />
            <span className="cb-brand-text">DSM</span>
          </div>

          <button className="cb-backbtn" onClick={() => navigate("/user-dashboard")}>
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* ✅ Single professional card (no square-in-square) */}
      <div className="cb-shell">
        <div className="cb-card">
          <div className="cb-card-header">
            <h1>AI Chatbot Assistant</h1>
            <p>Ask me anything about job searching, resume building, or career advice!</p>
          </div>

          <div className="cb-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`cb-msg ${message.type} ${message.isError ? "error" : ""}`}
              >
                <div className="cb-bubble">
                  {message.type === "bot" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="cb-msg bot">
                <div className="cb-bubble typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="cb-error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={handleRetry} className="cb-retry">
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          <div className="cb-inputbar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              disabled={isLoading}
              ref={inputRef}
            />

            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className={isLoading ? "loading" : ""}
              aria-label="Send message"
            >
              {isLoading ? "Sending..." : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
