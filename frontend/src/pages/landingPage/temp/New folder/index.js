import React from 'react';
import { useNavigate } from 'react-router-dom'; // Ensure useNavigate is imported
import Header from '../../components/Landing_Header';
import Hero from '../../components/Landing_Hero';
import WhyJoin from '../../components/Landing_Whyjoin';
import Testimonials from '../../components/Landing_Testimonials';
import Footer from '../../components/Landing_footer';
import './landing.css';

const LandingPage = () => {
  const navigate = useNavigate();  // Use useNavigate hook

  const handleApplyNowClick = () => {
    console.log("Navigating to Choose Role Page..."); // Debugging log
    navigate('/choose-role'); // Navigate to the choose-role page
  };

  return (
    <div>
      {/* Include Header at the top */}
      <Header />

      {/* Main content with gradient background */}
      <div className="main-content">
        <Hero />
        <WhyJoin />
        <Testimonials />

        
      </div>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
};

export default LandingPage;
