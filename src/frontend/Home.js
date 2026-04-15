import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Question from './Question';
import './Home.css';
import qdata from './questions-list.js';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const slideUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.2 } },
};

function getNameFromEmail(email) {
  return email ? email.split('@')[0] : '';
}

export default function Home({ setPage }) {
  const [questionsList, setQuestionsList] = useState(qdata);
  const [slide, setSlide]                 = useState(0);
  const [email, setEmail]                 = useState(null);
  const [showSignIn, setShowSignIn]       = useState(false);
  const [isLoggedIn, setIsLoggedIn]       = useState(false);

  // whether this student has already submitted answers (fetched from backend)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [checkingStatus, setCheckingStatus]   = useState(false);

  const [submitted, setSubmitted]       = useState(false);
  const [loadingRoom, setLoadingRoom]   = useState(false);
  const [notPublished, setNotPublished] = useState(false);
  const [roomData, setRoomData]         = useState(null);
  const [showResult, setShowResult]     = useState(false);

  // After login, check whether this student has already answered
  useEffect(() => {
    if (!email) return;
    setCheckingStatus(true);

    fetch(`http://localhost:5000/api/check-answered/${email}`)
      .then(res => res.json())
      .then(data => {
        if (data.answered) {
          setAlreadyAnswered(true);
          setSubmitted(true);   // treat as submitted so View Room works
        } else {
          setSlide(1);          // go straight to questions
        }
        setCheckingStatus(false);
      })
      .catch(() => {
        setSlide(1);
        setCheckingStatus(false);
      });
  }, [email]);

  function handleNextSlide(index) {
    const maxIndex = qdata.length - 1;
    if (index > maxIndex || index < 0) return;
    setSlide(index);
  }

  function handleChooseAnswer(qid, answer) {
    const updated = questionsList.map(q =>
      q.qid === qid ? { ...q, chosenAnswer: answer } : q
    );
    setQuestionsList(updated);

    const currentIndex  = questionsList.findIndex(q => q.qid === qid);
    const isLastQuestion = currentIndex === questionsList.length - 2;

    if (isLastQuestion) {
      fetch('http://localhost:5000/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          answers: updated.filter(q => q.chosenAnswer !== undefined),
        }),
      })
        .then(() => fetch('http://localhost:5000/api/assign-rooms', { method: 'POST' }))
        .then(() => setSubmitted(true))
        .catch(err => console.error(err));
    }
  }

  function handleViewRoom() {
    if (!email) return;
    setLoadingRoom(true);
    setNotPublished(false);

    fetch(`http://localhost:5000/api/my-room/${email}`)
      .then(res => {
        if (res.status === 403) {
          setNotPublished(true);
          setLoadingRoom(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setRoomData(data);
        setShowResult(true);
        setLoadingRoom(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingRoom(false);
      });
  }

  function handleLoginSuccess(credentialResponse) {
    const decoded = jwtDecode(credentialResponse.credential);
    setEmail(decoded.email);
    setIsLoggedIn(true);
    // useEffect above handles the rest after email is set
  }

  const totalQuestions  = qdata.length - 1;
  const showQuestions   = isLoggedIn && !alreadyAnswered && !submitted && !showResult;
  const showSubmitted   = isLoggedIn && (submitted || alreadyAnswered) && !showResult;
  const showViewRoomBtn = isLoggedIn && (submitted || alreadyAnswered) && !showResult;

  return (
    <div className="hm-root">

      {/* ── Navbar ── */}
      <nav className="hm-nav">
        <div className="hm-nav-logo">
          <div className="hm-nav-logo-mark">🏠</div>
          <div className="hm-nav-logo-name">AlignMate</div>
        </div>

        <div className="hm-nav-right">
          {/* Progress counter — only during active questionnaire */}
          {showQuestions && slide > 0 && (
            <motion.div
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="hm-nav-progress">
                {slide} / {totalQuestions}
              </span>
              <div className="hm-nav-arrows">
                <button className="hm-nav-btn" onClick={() => handleNextSlide(slide - 1)}>←</button>
                <button className="hm-nav-btn" onClick={() => handleNextSlide(slide + 1)}>→</button>
              </div>
            </motion.div>
          )}

          {/* View Room Allotment — persistent once answered/submitted */}
          {showViewRoomBtn && (
            <motion.button
              className="hm-nav-room-btn"
              onClick={handleViewRoom}
              disabled={loadingRoom}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {loadingRoom ? '⏳ Loading…' : '🏠 View Room Allotment'}
            </motion.button>
          )}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="hm-body">
        <AnimatePresence mode="wait">

          {/* ── Result screen ── */}
          {showResult && roomData && (
            <motion.div key="result" className="hm-result"
              variants={slideUp} initial="hidden" animate="show" exit="exit"
            >
              <div className="hm-result-icon">🎉</div>
              <div className="hm-result-title">You're all set!</div>
              <div className="hm-result-sub">Room assignment complete</div>

              <div className="hm-result-card">
                <div className="hm-result-card-header">
                  <span className="hm-result-room-label">Room Number</span>
                  <span className="hm-result-room-id">{roomData.roomId}</span>
                </div>
                <div className="hm-result-card-body">
                  <div className="hm-result-you">
                    <div className="hm-result-avatar">👤</div>
                    <div>
                      <div className="hm-result-name">{getNameFromEmail(email)}</div>
                      <div className="hm-result-tag">You</div>
                    </div>
                  </div>
                  <div className="hm-result-mates-label">Your Roommates</div>
                  <div className="hm-result-mates">
                    {roomData.roommates.map((mate, i) => (
                      <div key={i} className="hm-result-mate-row">
                        <div className="hm-result-avatar mate">🙂</div>
                        <div>
                          <div className="hm-result-name">{getNameFromEmail(mate.email)}</div>
                          <div className="hm-result-tag">{mate.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="hm-back-btn" onClick={() => setPage('main')}>
                ← Back to Home
              </button>
            </motion.div>
          )}

          {/* ── Submitted / Already answered screen ── */}
          {showSubmitted && (
            <motion.div key="submitted" className="hm-already-answered"
              variants={slideUp} initial="hidden" animate="show" exit="exit"
            >
              <div className="hm-already-icon">✅</div>
              <h1 className="hm-already-title">
                {alreadyAnswered && !submitted
                  ? 'Already submitted!'
                  : 'Responses saved!'}
              </h1>
              <p className="hm-already-desc">
                {alreadyAnswered && !submitted
                  ? "You've already completed the questionnaire. Once the admin publishes room assignments, click the button above to view your room."
                  : "Your answers have been saved. Once all students complete the questionnaire, your room allotment is visible in the View Room Allotment section."}
              </p>

              {/* Status card */}
              <div className="hm-status-card">
                <div className="hm-status-row">
                  <span className="hm-status-label">Questionnaire</span>
                  <span className="hm-status-badge done">✓ Completed</span>
                </div>
                <div className="hm-status-row">
                  <span className="hm-status-label">Signed in as</span>
                  <span className="hm-status-value">{getNameFromEmail(email)}</span>
                </div>
              </div>

              {/* Not published notice */}
              {notPublished && (
                <motion.div className="hm-not-published"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                >
                  ⏳ Results haven't been published yet — check back soon!
                </motion.div>
              )}

              {/* Step pills */}
              <div className="hm-welcome-steps">
                {[
                  { label: 'Answers saved',        done: true  },
                  { label: 'Admin publishes rooms', done: false },
                  { label: 'View your room',        done: false },
                ].map((s, i) => (
                  <div key={i} className="hm-step-pill">
                    <span className="hm-step-dot"
                      style={{ background: s.done ? 'var(--green)' : 'var(--accent)' }}
                    />
                    {s.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Checking status loader ── */}
          {isLoggedIn && checkingStatus && (
            <motion.div key="checking" className="hm-welcome"
              variants={slideUp} initial="hidden" animate="show" exit="exit"
            >
              <div className="hm-welcome-icon" style={{ background: 'var(--surface-2)' }}>⏳</div>
              <h1 className="hm-welcome-title">Checking your status…</h1>
              <p className="hm-welcome-desc">Just a moment while we look up your account.</p>
            </motion.div>
          )}

          {/* ── Welcome / Sign-in screen ── */}
          {!isLoggedIn && slide === 0 && (
            <motion.div key="welcome" className="hm-welcome"
              variants={slideUp} initial="hidden" animate="show" exit="exit"
            >
              <div className="hm-welcome-icon">🏠</div>

              {!showSignIn && (
                <>
                  <h1 className="hm-welcome-title">Let's find your perfect roommate</h1>
                  <p className="hm-welcome-desc">
                    Answer a few questions about your lifestyle and preferences.
                    We'll match you with the most compatible roommate in your hostel.
                  </p>
                  <div className="hm-welcome-steps">
                    {['Answer questions', 'AI matching', 'Room assigned'].map((s, i) => (
                      <div key={i} className="hm-step-pill">
                        <span className="hm-step-dot" />
                        {s}
                      </div>
                    ))}
                  </div>
                  <button className="hm-start-btn" onClick={() => setShowSignIn(true)}>
                    Get Started →
                  </button>
                </>
              )}

              {showSignIn && (
                <motion.div className="hm-google-wrap"
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                >
                  <p className="hm-welcome-desc">
                    Sign in with your college Google account to continue.
                  </p>
                  <span className="hm-google-label">Continue with</span>
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={() => console.log('Login Failed')}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Questions ── */}
          {showQuestions &&
            questionsList.map((item, i) =>
              i === slide && slide > 0 ? (
                <motion.div key={`q-${i}`} className="hm-question"
                  variants={slideUp} initial="hidden" animate="show" exit="exit"
                >
                  <div className="hm-q-chip">Question {slide} of {totalQuestions}</div>
                  <Question
                    item={item}
                    chooseAnswer={handleChooseAnswer}
                    nextSlide={() => handleNextSlide(slide + 1)}
                  />
                </motion.div>
              ) : null
            )}

        </AnimatePresence>
      </div>
    </div>
  );
}