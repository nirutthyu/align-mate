import React, { useState } from "react";
import "./adminlogin.css";

export default function AdminLogin({ setIsAdminLoggedIn, setPage }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Store password (temporary - frontend only)
  const [storedPassword, setStoredPassword] = useState("admin123");

  function handleLogin() {
    if (username === "admin" && password === storedPassword) {
      setIsAdminLoggedIn(true);
      setPage("dashboard");
    } else {
      alert("Invalid Credentials");
    }
  }

  function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 4) {
      alert("Password too short");
      return;
    }

    setStoredPassword(newPassword);
    alert("Password updated successfully!");
    
    // Go back to login
    setIsResetMode(false);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="admin-login-container">

      <div className="admin-login-card">

        <h2 className="admin-login-title">
          {isResetMode ? "Reset Password" : "Admin Login"}
        </h2>

        {!isResetMode ? (
          <>
            <input
              className="admin-input"
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              className="admin-input password"
              type={showPassword ? "text" : "password"}
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Show Password */}
            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>

            <button className="admin-login-btn" onClick={handleLogin}>
              Login
            </button>

            <p
              className="forgot-password"
              onClick={() => setIsResetMode(true)}
            >
              Forgot Password?
            </p>
          </>
        ) : (
          <>
            <input
              className="admin-input"
              type="password"
              placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              className="admin-input"
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              className="admin-login-btn"
              onClick={handleResetPassword}
            >
              Set New Password
            </button>

            <p
              className="forgot-password"
              onClick={() => setIsResetMode(false)}
            >
              Back to Login
            </p>
          </>
        )}

      </div>
    </div>
  );
}