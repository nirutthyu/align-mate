<<<<<<< HEAD
import React, { useState } from "react";
import Home from "./Home"; // your old App.js renamed
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("main");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

if (page === "dashboard" && isAdminLoggedIn) {
  return <AdminDashboard />;
}

  // 👉 When student login clicked → go to Home.js (questionnaire)
  if (page === "student") {
    return <Home setPage={setPage} />;
  }

  // 👉 Admin placeholder
  if (page === "admin") {
    return (
      <AdminLogin
        setIsAdminLoggedIn={setIsAdminLoggedIn}
        setPage={setPage}
      />
    );
  }

  // 👉 MAIN UI (your sketch design)
  return (
    <div className="home-container">


    <div className="title-box">
      <h1 className="title">ALIGNMATE</h1>
      <p className="subtitle">
        Find the most compatible roommate for you
      </p>

    <div className="button-group">
      <button className="btn" onClick={() => setPage("student")}>
        Student Login
      </button>

      <button className="btn admin" onClick={() => setPage("admin")}>
        Admin Login
      </button>
    </div>
        </div>

  </div>
  );
}
=======
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

export default function App() {
  const [questionsList, setQuestionsList] = useState(qdata);
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    const isLastQuestion = currentIndex === questionsList.length - 2; // -2 because final "Thanks" question is not an actual question
  
    if (isLastQuestion) {
      // Save answers to backend
      fetch('http://localhost:5000/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          answers: updated.filter(q => q.chosenAnswer !== undefined), // Only answered
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Saved to backend:", data))
        .catch((err) => console.error("Backend error:", err));
    }
  }
  
  function handleLoginSuccess(credentialResponse) {
    const decoded = jwtDecode(credentialResponse.credential);
    setEmail(decoded.email);
    setIsLoggedIn(true);
    setSlide(1); // Move to first question after login
    console.log("Logged in:", decoded.email);

    fetch('http://localhost:5000/api/save-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: decoded.email,
        answers: questionsList,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("Saved to backend:", data))
      .catch((err) => console.error("Backend error:", err));
  
    setSlide(slide + 1);
    // TODO: Store answers/email to MongoDB via backend later
  }

  return (
    <main>
      {/* Show welcome screen initially */}
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
                <button onClick={() => setShowSignIn(true)} style={{ marginTop: '20px' }}>
                  Get Started
                </button>
              </>
            )}

            {showSignIn && !isLoggedIn && (
              <div style={{ marginTop: '20px' }}>
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={() => {
                    console.log('Login Failed');
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Show questions after login */}
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

      {/* Navigation bar */}
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
              <button onClick={() => handleNextSlide(slide - 1)}>&larr;</button>
              <button onClick={() => handleNextSlide(slide + 1)}>&rarr;</button>
            </div>
          </motion.div>
        )}
      </motion.nav>
    </main>
  );
}
>>>>>>> f1ae626ede442b3ffee6de4cac2552bf39e31b23
