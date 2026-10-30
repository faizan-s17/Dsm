// src/components/Landing_Whyjoin/index.js
import React from 'react';
import './Whyjoin.css';

const WhyJoin = () => {
    return (
        <section id="why-join">
            <h2>Why Join this Program?</h2>
            <ul className="features-list">
                <li>
                    <img src="/AI-Driven Skill Assessment.jpeg" alt="AI Assessment Icon" />
                    <p>AI-Driven Skill Assessment</p>
                </li>
                <li>
                    <img src="/AI-Driven Skill Assessment.jpeg" alt="Learning Paths Icon" />
                    <p>Interactive Learning Paths</p>
                </li>
                <li>
                    <img src="/AI-Driven Skill Assessment.jpeg" alt="Career Guidance Icon" />
                    <p>Career Guidance</p>
                </li>
            </ul>
        </section>
    );
};

export default WhyJoin;
