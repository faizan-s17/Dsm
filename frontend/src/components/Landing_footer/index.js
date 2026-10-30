import React from 'react';
import './footer.css';

const Footer = () => {
    return (
        <footer className="footer" aria-label="Contact Information">
            <div className="footer-content">
                <div className="footer-contact">
                    <h3>Contact Info</h3>
                    <address>
    FAST CFD Campus <br />
    +92-312-4519288 <br />
    <a href="mailto:f219338@cfd.nu.edu.pk">f219338@cfd.nu.edu.pk</a>
</address>

                </div>
                <div className="footer-social">
                    <h3>Follow Us</h3>
                    <div className="social-icons">
                        <a href="#" aria-label="Facebook" className="facebook"></a>
                        <a href="#" aria-label="Twitter" className="twitter"></a>
                        <a href="#" aria-label="Instagram" className="instagram"></a>
                        <a href="#" aria-label="LinkedIn" className="linkedin"></a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} My_Tutor | Designed By Skillsync Innovators</p>
            </div>
        </footer>
    );
};

export default Footer;
