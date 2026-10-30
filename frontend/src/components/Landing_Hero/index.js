import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section id="hero">
      <div className="hero-content">
        <div className="hero-text">
          <span className="badge">Specialization over generalization</span>
          <h1>Personalized Skill Matching & Growth Pathways</h1>
          <p>Equip yourself with data science skills through live, interactive lectures guided by industry expert mentors.</p>
          <p className="highlight">Live Interactive Classes</p>
          <div className="hero-buttons">
            <button className="explore-button">Explore Learning Paths</button>
            <button className="contact-button">Get in Touch</button>
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero.jpeg" alt="Person using laptop" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
