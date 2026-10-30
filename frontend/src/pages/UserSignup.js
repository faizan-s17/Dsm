import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';
import UserAuthForm from "./UserSignup/index";

// Simple wrapper component to resolve ESLint errors
const UserSignup = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  
  // This component simply renders the actual UserSignup component
  return <UserAuthForm />;
};

export default UserSignup; 