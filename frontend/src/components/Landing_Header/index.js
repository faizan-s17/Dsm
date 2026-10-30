import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleApplyNowClick = (e) => {
    e.preventDefault();
    navigate('/choose-role');
  };

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <a href="/" className="logo">DSM</a>
      <nav className="nav">
        <div className="nav-links">
          <a href="#features" className="active">Features</a>
          <a href="#mentorship">Mentorship</a>
          <a href="#contact">Contact</a>
          <a href="#apply" className="apply-now-link" onClick={handleApplyNowClick}>
            Apply Now
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
