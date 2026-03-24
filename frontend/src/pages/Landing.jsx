import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import charlotteLogo from '../assets/homepage/charlotteLogoWhite.png';
import homeBackground3 from '../assets/homepage/homeBackground3.jpg';

const getInitialHeroReady = () => {
  const image = new Image();
  image.src = homeBackground3;
  return image.complete;
};

const Landing = () => {
  const detailsSectionRef = useRef(null);
  const aboutGridRef = useRef(null);
  const [heroReady, setHeroReady] = useState(getInitialHeroReady);

  useEffect(() => {
    if (heroReady) {
      return;
    }

    const image = new Image();
    image.src = homeBackground3;

    const handleLoad = () => setHeroReady(true);
    const handleError = () => setHeroReady(true);

    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);

    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [heroReady]);

  useEffect(() => {
    const gridElement = aboutGridRef.current;

    if (!gridElement) {
      return;
    }

    const blocks = Array.from(
      gridElement.querySelectorAll('.about-text-block')
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const revealIndex = Number(entry.target.dataset.revealIndex || 0);
            window.setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, revealIndex * 90);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -12% 0px',
      }
    );

    blocks.forEach((block) => observer.observe(block));

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToDetails = () => {
    if (!detailsSectionRef.current) {
      return;
    }

    detailsSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="landing-page">
      <section
        className={`landing-container layout-cinematic-left ${heroReady ? 'hero-ready' : 'hero-loading'}`}
        style={{ '--hero-bg-image': `url(${homeBackground3})` }}
      >
        <nav className="landing-nav">
          <div className="nav-left">
            <img
              src={charlotteLogo}
              alt="UNC Charlotte logo"
              className="charlotte-logo"
            />
          </div>
          <div className="nav-right">
            <Link to="/login" className="nav-btn nav-btn-login">Log In</Link>
            <Link to="/signup" className="nav-btn nav-btn-signup">Sign Up</Link>
          </div>
        </nav>

        <div className="landing-content">
          <h1>Norm&apos;s Bucket List</h1>
          <p>The official UNC Charlotte traditions checklist</p>
          <button type="button" className="explore-btn" onClick={scrollToDetails}>
            Explore
          </button>
        </div>
      </section>

      <section className="about-app-section" ref={detailsSectionRef}>
        <h2>Why students use Norm&apos;s Bucket List</h2>
        <p className="about-summary">
          Norm&apos;s Bucket List helps UNC Charlotte students discover campus traditions, complete them with friends,
          and track every milestone in one place. It is built to grow school spirit and make your college memories visible.
        </p>

        <div className="about-grid" ref={aboutGridRef}>
          <article className="about-text-block" data-reveal-index="0">
            <span className="about-icon" aria-hidden="true">🧭</span>
            <h3>Discover Traditions</h3>
            <p>Find iconic UNC Charlotte experiences and pick what you want to complete next.</p>
          </article>

          <article className="about-text-block" data-reveal-index="1">
            <span className="about-icon" aria-hidden="true">📸</span>
            <h3>Capture Moments</h3>
            <p>Upload photo proof of each tradition so your best campus memories are all in one place.</p>
          </article>

          <article className="about-text-block" data-reveal-index="2">
            <span className="about-icon" aria-hidden="true">📈</span>
            <h3>Track Progress</h3>
            <p>See how much of your bucket list you have finished and keep your momentum going.</p>
          </article>

          <article className="about-text-block" data-reveal-index="3">
            <span className="about-icon" aria-hidden="true">🔔</span>
            <h3>Get Status Updates</h3>
            <p>View approval or rejection updates and know exactly where every submission stands.</p>
          </article>

          <article className="about-text-block" data-reveal-index="4">
            <span className="about-icon" aria-hidden="true">💚</span>
            <h3>Build School Spirit</h3>
            <p>Celebrate the traditions that connect students and strengthen the Niner community.</p>
          </article>

          <article className="about-text-block" data-reveal-index="5">
            <span className="about-icon" aria-hidden="true">🏁</span>
            <h3>Leave Your Legacy</h3>
            <p>Graduate with a complete record of the campus experiences that defined your time at Charlotte.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Landing;
