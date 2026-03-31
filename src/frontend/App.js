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