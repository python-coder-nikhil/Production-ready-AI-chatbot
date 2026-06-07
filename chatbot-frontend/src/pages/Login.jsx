import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WebLoader from "../components/Loader";
import ErrorModal from "../components/ErrorModal";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { loginUser } from "../api/ChatbotApis";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleError = (message) => {
    setErrors([message]);
    setShowModal(true);
    setLoading(false);
  };

  const handleSuccess = () => {
    localStorage.setItem("isLoggedIn", "true");
    navigate("/new");
  };

  const validateForm = () => {
    const { email, password } = formData;
    const validationErrors = [];

    if (!email) validationErrors.push("Email is required.");
    else if (!/^\S+@\S+\.\S+$/.test(email))
      validationErrors.push("Invalid email format.");

    if (!password) validationErrors.push("Password is required.");

    return validationErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length) {
      return handleError(validationErrors.join("\n"));
    }

    try {
      const res = await loginUser(
        "password",
        formData.email,
        formData.password
      );

      res?.status === 1
        ? handleSuccess()
        : handleError(res?.error || "Invalid email or password.");
    } catch {
      handleError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);

    try {
      const token = response?.credential;
      if (!token) return handleError("Google login failed.");

      let user;
      try {
        user = jwtDecode(token);
      } catch {
        return handleError("Failed to decode Google credentials.");
      }

      const res = await loginUser("google", null, null, token);

      res?.status === 1
        ? handleSuccess()
        : handleError(res?.error || "Google login failed.");
    } catch (err) {
      handleError("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <title>ChatBot AI - Login</title>

      {loading && <WebLoader />}
      {showModal && (
        <ErrorModal
          errorMessages={errors}
          onClose={() => setShowModal(false)}
        />
      )}

      <div
        className={`auth-container ${loading || showModal ? "blurred" : ""}`}
      >
        <div className="form-wrapper">
          <div className="form-container">
            <div className="form-side login-form">
              <form onSubmit={handleLogin}>
                <div className="form-header">
                  <h1 className="form-title">Welcome to AI Chatbot</h1>
                  <p className="form-subtitle">Open Source AI Assistant</p>
                </div>

                <div className="social-login">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() =>
                      handleError(
                        "Google Login failed. Verify client ID or internet connection."
                      )
                    }
                  />
                </div>

                <div className="form-divider">
                  <span>or sign in with email</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group password-group">
                  <label className="form-label">Password</label>

                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          className="password-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          className="password-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 12v4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
