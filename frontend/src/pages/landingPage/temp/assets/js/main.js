import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Landing_Header';
import Hero from '../../components/Landing_Hero';
import WhyJoin from '../../components/Landing_Whyjoin';
import Testimonials from '../../components/Landing_Testimonials';
import Footer from '../../components/Landing_footer';
import GLightbox from 'glightbox';
import counterUp from 'counterup2';
import WOW from 'wowjs';
import 'particles.js';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

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

    // Sticky Header
    const handleScroll = () => {
      const header_navbar = document.querySelector(".navbar-area");
      const sticky = header_navbar?.offsetTop || 0;
      const logo = document.querySelector(".navbar-brand img");
      const backToTop = document.querySelector(".back-to-top");

      if (window.pageYOffset > sticky) {
        header_navbar?.classList.add("sticky");
        if (logo) logo.src = "assets/images/logo/logo-2.svg";
      } else {
        header_navbar?.classList.remove("sticky");
        if (logo) logo.src = "assets/images/logo/logo.svg";
      }

      // Back to top button
      if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
        if (backToTop) backToTop.style.display = "flex";
      } else {
        if (backToTop) backToTop.style.display = "none";
      }

      // Section menu active
      const sections = document.querySelectorAll(".page-scroll");
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

      sections.forEach((currLink) => {
        const val = currLink.getAttribute("href");
        const refElement = document.querySelector(val);
        const scrollTopMinus = scrollPos + 73;
        
        if (refElement && 
            refElement.offsetTop <= scrollTopMinus &&
            refElement.offsetTop + refElement.offsetHeight > scrollTopMinus) {
          document.querySelector(".page-scroll")?.classList.remove("active");
          currLink.classList.add("active");
        } else {
          currLink.classList.remove("active");
        }
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Page scroll
    const pageLinks = document.querySelectorAll(".page-scroll");
    pageLinks.forEach((elem) => {
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        const href = elem.getAttribute("href");
        const targetElem = document.querySelector(href);
        if (targetElem) {
          targetElem.scrollIntoView({
            behavior: "smooth",
            offsetTop: 1 - 60,
          });
        }
      });
    });

    // Navbar toggler
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    const handlePageScroll = () => {
      navbarToggler?.classList.remove("active");
      navbarCollapse?.classList.remove("show");
    };

    document.querySelectorAll(".page-scroll").forEach((e) =>
      e.addEventListener("click", handlePageScroll)
    );

    navbarToggler?.addEventListener("click", function () {
      navbarToggler.classList.toggle("active");
    });

    // Initialize GLightbox
    const myGallery = GLightbox({
      href: "https://www.youtube.com/watch?v=r44RKWyfcFw",
      type: "video",
      source: "youtube",
      width: 900,
      autoplayVideos: true,
    });

    // Initialize Counter
    const cu = new counterUp({
      start: 0,
      duration: 2000,
      intvalues: true,
      interval: 100,
      append: "k",
    });
    cu.start();

    // Initialize WOW.js
    new WOW.WOW().init();

    // Initialize Particles
    if (document.getElementById("particles-1")) {
      window.particlesJS("particles-1", {
        particles: {
          number: {
            value: 40,
            density: {
              enable: true,
              value_area: 4000,
            },
          },
          color: {
            value: ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#fff",
            },
            polygon: {
              nb_sides: 5,
            },
            image: {
              src: "img/github.svg",
              width: 33,
              height: 33,
            },
          },
          opacity: {
            value: 0.15,
            random: true,
            anim: {
              enable: true,
              speed: 0.2,
              opacity_min: 0.15,
              sync: false,
            },
          },
          size: {
            value: 50,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 5,
              sync: false,
            },
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
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 600,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: false,
              mode: "bubble",
            },
            onclick: {
              enable: false,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 250,
              size: 0,
              duration: 2,
              opacity: 0,
              speed: 3,
            },
            repulse: {
              distance: 400,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
      });
    }

    // Same particles config for particles-2
    if (document.getElementById("particles-2")) {
      window.particlesJS("particles-2", {
        // ... same configuration as particles-1
        particles: {
          number: {
            value: 40,
            density: {
              enable: true,
              value_area: 4000,
            },
          },
          color: {
            value: ["#FFFFFF", "#FFFFFF", "#FFFFFF"],
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#fff",
            },
            polygon: {
              nb_sides: 5,
            },
            image: {
              src: "img/github.svg",
              width: 33,
              height: 33,
            },
          },
          opacity: {
            value: 0.15,
            random: true,
            anim: {
              enable: true,
              speed: 0.2,
              opacity_min: 0.15,
              sync: false,
            },
          },
          size: {
            value: 50,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 5,
              sync: false,
            },
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
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 600,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: false,
              mode: "bubble",
            },
            onclick: {
              enable: false,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 250,
              size: 0,
              duration: 2,
              opacity: 0,
              speed: 3,
            },
            repulse: {
              distance: 400,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      pageLinks.forEach((elem) => {
        elem.removeEventListener("click", (e) => {
          e.preventDefault();
          document.querySelector(elem.getAttribute("href")).scrollIntoView({
            behavior: "smooth",
            offsetTop: 1 - 60,
          });
        });
      });
    };
  }, []);

  const handleApplyNowClick = () => {
    console.log("Navigating to Choose Role Page...");
    navigate('/choose-role');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="main-content">
          <Hero onApplyClick={handleApplyNowClick} />
          <WhyJoin />
          <Testimonials />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;