import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WOW from "wowjs";
import GLightbox from "glightbox";
import counterUp from "counterup2";
import "particles.js";
import logo1 from "./assets/images/logo/logo-2.svg";
import logo2 from "./assets/images/logo/logo.svg";
import headerHero from "./assets/images/header/header-hero.png";
import { useNavigate } from "react-router-dom";

// Import your CSS files
import "animate.css";
import "glightbox/dist/css/glightbox.min.css";
import "./assets/css/lineicons.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/style.css";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Preloader
    const fadeout = () => {
      const preloader = document.querySelector(".preloader");
      if (preloader) {
        preloader.style.opacity = "0";
        preloader.style.display = "none";
      }
    };
    window.setTimeout(fadeout, 500);

    // Initialize WOW
    new WOW.WOW().init();

    // Initialize GLightbox
    GLightbox({
      href: "https://www.youtube.com/watch?v=r44RKWyfcFw",
      type: "video",
      source: "youtube",
      width: 900,
      autoplayVideos: true,
    });

    // Initialize CounterUp
    const counters = document.querySelectorAll(".count");
    counters.forEach((counter) => {
      const cu = new counterUp(counter, {
        start: 0,
        duration: 2000,
        intvalues: true,
        interval: 100,
        append: "k",
      });
      cu.start();
    });

    // Sticky Header
    const handleScroll = () => {
      const header_navbar = document.querySelector(".navbar-area");
      const sticky = header_navbar?.offsetTop || 0;
      const logo = document.querySelector(".navbar-brand img");
      const backToTop = document.querySelector(".back-to-top");

      if (window.pageYOffset > sticky) {
        header_navbar?.classList.add("sticky");
        if (logo) logo.src = logo1;
      } else {
        header_navbar?.classList.remove("sticky");
        if (logo) logo.src = logo2;
      }

      if (
        document.body.scrollTop > 50 ||
        document.documentElement.scrollTop > 50
      ) {
        if (backToTop) backToTop.style.display = "flex";
      } else {
        if (backToTop) backToTop.style.display = "none";
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Initialize particles for both particle divs
    if (document.getElementById("particles-1")) {
      window.particlesJS("particles-1", {
        particles: {
          number: { value: 40, density: { enable: true, value_area: 4000 } },
          color: { value: ["#FFFFFF", "#FFFFFF", "#FFFFFF"] },
          shape: {
            type: "circle",
            stroke: { width: 0, color: "#fff" },
            polygon: { nb_sides: 5 },
            image: { src: "img/github.svg", width: 33, height: 33 },
          },
          opacity: {
            value: 0.15,
            random: true,
            anim: { enable: true, speed: 0.2, opacity_min: 0.15, sync: false },
          },
          size: {
            value: 50,
            random: true,
            anim: { enable: true, speed: 2, size_min: 5, sync: false },
          },
          line_linked: {
            enable: false,
            distance: 150,
            color: "#ffffff",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: "top",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false, rotateX: 600, rotateY: 600 },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: false, mode: "bubble" },
            onclick: { enable: false, mode: "repulse" },
            resize: true,
          },
          modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: {
              distance: 250,
              size: 0,
              duration: 2,
              opacity: 0,
              speed: 3,
            },
            repulse: { distance: 400, duration: 0.4 },
            push: { particles_nb: 4 },
            remove: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleApplyNowClick = (e) => {
    e.preventDefault();
    navigate("/choose-role");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log("Subscribing email:", email);
    // Add your subscription logic here
  };

  return (
    <>
      {/* Preloader */}
      <div className="preloader">
        <div className="loader">
          <div className="spinner">
            <div className="spinner-container">
              <div className="spinner-rotator">
                <div className="spinner-left">
                  <div className="spinner-circle"></div>
                </div>
                <div className="spinner-right">
                  <div className="spinner-circle"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <header className="header-area">
          <div className="navbar-area">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <nav className="navbar navbar-expand-lg">
                    <Link className="navbar-brand" to="/">
                      <img src={logo2} alt="Logo" />
                    </Link>
                    <button
                      className="navbar-toggler"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#navbarSupportedContent"
                      aria-controls="navbarSupportedContent"
                      aria-expanded="false"
                      aria-label="Toggle navigation"
                    >
                      <span className="toggler-icon"></span>
                      <span className="toggler-icon"></span>
                      <span className="toggler-icon"></span>
                    </button>

                    <div
                      className="collapse navbar-collapse sub-menu-bar"
                      id="navbarSupportedContent"
                    >
                      <ul id="nav" className="navbar-nav ms-auto">
                        <li className="nav-item">
                          <a className="page-scroll active" href="#home">
                            Home
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#features">
                            Features
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#about">
                            About
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="page-scroll" href="#facts">
                            Why
                          </a>
                        </li>
                        <li className="nav-item">
                          <a href="javascript:void(0)">Team</a>
                        </li>
                        <li className="nav-item">
                          <a href="javascript:void(0)">Blog</a>
                        </li>
                      </ul>
                    </div>

                    <div className="navbar-btn d-none d-sm-inline-block">
                      <a
                        className="main-btn"
                        data-scroll-nav="0"
                        href="#apply"
                        rel="nofollow"
                        onClick={handleApplyNowClick}
                      >
                        Apply Now
                      </a>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>

          <div
            id="home"
            className="header-hero bg_cover"
            style={{
              backgroundImage: "url(./assets/images/header/banner-bg.svg)",
            }}
          >
            <div className="container">
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="header-hero-content text-center">
                    <h3
                      className="header-sub-title wow fadeInUp"
                      data-wow-duration="1.3s"
                      data-wow-delay="0.2s"
                    >
                      Basic - SaaS Landing Page
                    </h3>
                    <h2
                      className="header-title wow fadeInUp"
                      data-wow-duration="1.3s"
                      data-wow-delay="0.5s"
                    >
                      Kickstart Your SaaS or App Site
                    </h2>
                    <p
                      className="text wow fadeInUp"
                      data-wow-duration="1.3s"
                      data-wow-delay="0.8s"
                    >
                      Lorem ipsum dolor sit amet, consetetur sadipscing elitr,
                      sed diam nonumy eirmod tempor
                    </p>
                    <a
                      href="javascript:void(0)"
                      className="main-btn wow fadeInUp"
                      data-wow-duration="1.3s"
                      data-wow-delay="1.1s"
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <div
                    className="header-hero-image text-center wow fadeIn"
                    data-wow-duration="1.3s"
                    data-wow-delay="1.4s"
                  >
                    <img src={headerHero} alt="hero" />
                  </div>
                </div>
              </div>
            </div>
            <div id="particles-1" className="particles"></div>
          </div>
        </header>
      </div>

      <>
        <section className="features-area pt-120 pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-4 col-md-6 col-sm-12">
                <div
                  className="feature-item wow fadeIn"
                  data-wow-duration="1s"
                  data-wow-delay="0.2s"
                >
                  <div className="icon">
                    <i className="lni lni-rocket"></i>
                  </div>
                  <h4 className="title">Fast and Reliable</h4>
                  <p>
                    Our platform offers the fastest and most reliable services
                    for all your needs, ensuring a seamless experience.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div
                  className="feature-item wow fadeIn"
                  data-wow-duration="1s"
                  data-wow-delay="0.4s"
                >
                  <div className="icon">
                    <i className="lni lni-cogs"></i>
                  </div>
                  <h4 className="title">Advanced Technology</h4>
                  <p>
                    We use the latest and most advanced technology to provide
                    cutting-edge solutions to our users.
                  </p>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 col-sm-12">
                <div
                  className="feature-item wow fadeIn"
                  data-wow-duration="1s"
                  data-wow-delay="0.6s"
                >
                  <div className="icon">
                    <i className="lni lni-shield"></i>
                  </div>
                  <h4 className="title">Secure and Protected</h4>
                  <p>
                    Security is our top priority, and we ensure that your data
                    and transactions are always secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>

      {/* Footer */}
      <footer id="footer" className="footer-area pt-120">
        <div className="container">
          <div
            className="subscribe-area wow fadeIn"
            data-wow-duration="1s"
            data-wow-delay="0.5s"
          >
            <div className="row">
              <div className="col-lg-6">
                <div className="subscribe-content mt-45">
                  <h2 className="subscribe-title">
                    Subscribe Our Newsletter <span>get reguler updates</span>
                  </h2>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="subscribe-form mt-50">
                  <form onSubmit={handleSubscribe}>
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="main-btn">
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-widget pb-100">
            <div className="row">
              <div className="col-lg-4 col-md-6 col-sm-8">
                <div
                  className="footer-about mt-50 wow fadeIn"
                  data-wow-duration="1s"
                  data-wow-delay="0.2s"
                >
                  <Link className="logo" to="/">
                    <img src={logo1} alt="logo" />
                  </Link>
                  <p className="text">
                    Lorem ipsum dolor sit amet consetetur sadipscing elitr,
                    sederfs diam nonumy eirmod tempor invidunt ut labore et
                    dolore magna aliquyam.
                  </p>
                  <ul className="social">
                    <li>
                      <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="lni lni-facebook-filled"></i>
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="lni lni-twitter-filled"></i>
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="lni lni-instagram-filled"></i>
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="lni lni-linkedin-original"></i>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-5 col-md-7 col-sm-12">
                <div className="footer-link d-flex mt-50 justify-content-sm-between">
                  <div
                    className="link-wrapper wow fadeIn"
                    data-wow-duration="1s"
                    data-wow-delay="0.4s"
                  >
                    <div className="footer-title">
                      <h4 className="title">Quick Link</h4>
                    </div>
                    <ul className="link">
                      <li>
                        <Link to="/roadmap">Road Map</Link>
                      </li>
                      <li>
                        <Link to="/privacy">Privacy Policy</Link>
                      </li>
                      <li>
                        <Link to="/refund">Refund Policy</Link>
                      </li>
                      <li>
                        <Link to="/terms">Terms of Service</Link>
                      </li>
                      <li>
                        <Link to="/pricing">Pricing</Link>
                      </li>
                    </ul>
                  </div>

                  <div
                    className="link-wrapper wow fadeIn"
                    data-wow-duration="1s"
                    data-wow-delay="0.6s"
                  >
                    <div className="footer-title">
                      <h4 className="title">Resources</h4>
                    </div>
                    <ul className="link">
                      <li>
                        <Link to="/">Home</Link>
                      </li>
                      <li>
                        <Link to="/page">Page</Link>
                      </li>
                      <li>
                        <Link to="/portfolio">Portfolio</Link>
                      </li>
                      <li>
                        <Link to="/blog">Blog</Link>
                      </li>
                      <li>
                        <Link to="/contact">Contact</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-5 col-sm-12">
                <div
                  className="footer-contact mt-50 wow fadeIn"
                  data-wow-duration="1s"
                  data-wow-delay="0.8s"
                >
                  <div className="footer-title">
                    <h4 className="title">Contact Us</h4>
                  </div>
                  <ul className="contact">
                    <li>+809272561823</li>
                    <li>info@gmail.com</li>
                    <li>www.yourweb.com</li>
                    <li>
                      123 Stree New York City , United <br />
                      States Of America 750.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-copyright">
            <div className="row">
              <div className="col-lg-12">
                <div className="copyright d-sm-flex justify-content-between">
                  <div className="copyright-content">
                    <p className="text">
                      Designed and Developed by
                      <a href="https://uideck.com" rel="nofollow">
                        UIdeck
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="particles-2"></div>
      </footer>

      {/* Back to top button */}
      <a href="#" className="back-to-top">
        <i className="lni lni-chevron-up"></i>
      </a>
    </>
  );
};

export default LandingPage;
