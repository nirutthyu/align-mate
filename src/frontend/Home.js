import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Question from './Question';
import './styles.css';
import qdata from './questions-list.js';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const animationVariant = {
  hidden: { opacity: 0, translateY: -100 },
  show: { opacity: 1, translateY: 0 },
};

export default function Home({ setPage }) {
  const [questionsList, setQuestionsList] = useState(qdata);
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

const [roomData, setRoomData] = useState(null);
const [showResult, setShowResult] = useState(false);

  function handleNextSlide(index) {
    const maxIndex = qdata.length - 1;
    if (index > maxIndex || index < 0) return;
    setSlide(index);
  }

  function handleChooseAnswer(qid, answer) {
    const updated = questionsList.map((q) =>
      q.qid === qid ? { ...q, chosenAnswer: answer } : q
    );
    setQuestionsList(updated);

    const currentIndex = questionsList.findIndex(q => q.qid === qid);
    const isLastQuestion = currentIndex === questionsList.length - 2;

    // if (isLastQuestion) {
    //   fetch('http://localhost:5000/api/save-user', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       email,
    //       answers: updated.filter(q => q.chosenAnswer !== undefined),
    //     }),
    //   })
    //     .then((res) => res.json())
    //     .then((data) => console.log("Saved to backend:", data))
    //     .catch((err) => console.error("Backend error:", err));
    // }
    if (isLastQuestion) {
  // Save answers
  fetch('http://localhost:5000/api/save-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      answers: updated.filter(q => q.chosenAnswer !== undefined),
    }),
  })
    .then(() => {
      // 🔥 Assign rooms
      return fetch('http://localhost:5000/api/assign-rooms', {
        method: 'POST'
      });
    })
    .then(() => {
      // 🔥 Get my room
      return fetch(`http://localhost:5000/api/my-room/${email}`);
    })
    .then(res => res.json())
    .then(data => {
      setRoomData(data);
      setShowResult(true);
    })
    .catch(err => console.error(err));
}
  }

  function handleLoginSuccess(credentialResponse) {
    const decoded = jwtDecode(credentialResponse.credential);
    setEmail(decoded.email);
    setIsLoggedIn(true);
    setSlide(1);

    console.log("Logged in:", decoded.email);

    fetch('http://localhost:5000/api/save-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: decoded.email,
        answers: questionsList,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Saved to backend:", data))
      .catch((err) => console.error("Backend error:", err));
  }
  function getNameFromEmail(email) {
  return email.split('@')[0];
}

  return (
    <main>
      {/* 🔙 Back Button */}
      {/* <button
        onClick={() => setPage("main")}
        style={{
          position: "absolute",
          top: "50px",
          left: "20px",
          padding: "8px 15px",
          cursor: "pointer"
        }}
      >
        ⬅ Back
      </button> */}

      {/* Welcome Screen */}
      {slide === 0 && (
        <AnimatePresence>
          <motion.div
            className="welcome-container"
            variants={animationVariant}
            initial="hidden"
            animate="show"
          >
            {!showSignIn && (
              <>
                <h2>
                  We’ll ask some questions to understand your lifestyle and preferences to find the best roommate for you.
                </h2>
                <button
                  onClick={() => setShowSignIn(true)}
                  style={{ marginTop: '20px' }}
                >
                  Get Started
                </button>
              </>
            )}

            {showSignIn && !isLoggedIn && (
              <div style={{ marginTop: '20px' }}>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => console.log('Login Failed')}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Questions */}
      {isLoggedIn &&
        questionsList.map((item, i) => (
          <AnimatePresence key={i}>
            {i === slide && slide > 0 && (
              <Question
                item={item}
                chooseAnswer={handleChooseAnswer}
                nextSlide={() => handleNextSlide(slide + 1)}
              />
            )}
          </AnimatePresence>
        ))}

      {/* Navbar */}
      <motion.nav>
        <div className="logo">Roommate Match</div>

        {isLoggedIn && slide > 0 && (
          <motion.div
            className="right"
            variants={animationVariant}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.5, duration: 1 }}
          >
            <div className="slide">
              {slide}
              <span>/</span>
              {qdata.length - 1}
            </div>

            <div className="buttons">
              <button onClick={() => handleNextSlide(slide - 1)}>
                &larr;
              </button>
              <button onClick={() => handleNextSlide(slide + 1)}>
                &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>
      {showResult && roomData && (
  <div className="result-page">
    <div className="result-card">

      <h1 className="result-title">🎉 Room Assigned</h1>

      <div className="result-info">
        <p><strong>Your Name:</strong> {getNameFromEmail(email)}</p>
        <p><strong>Room Number:</strong> {roomData.roomId}</p>
      </div>

      <div className="roommates">
        <h3>Your Roommates</h3>
        {roomData.roommates.map((mate, index) => (
          <div key={index} className="mate-card">
            👤 {getNameFromEmail(mate.email)}
          </div>
        ))}
      </div>

      <button className="back-home" onClick={() => setPage("main")}>
        Back to Home
      </button>

    </div>
  </div>
)}
    </main>
  );
}