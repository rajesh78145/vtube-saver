import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../services/api";
import Dialog from "../../components/Dialog/Dialog";
import "../Register/Register.css"; // if not already imported
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [showInvalidLogin, setShowInvalidLogin] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const validateForm = () => {
    const errors = { email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      addToast("Login successful", "success");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      if (err.response?.status === 401 || err.response?.status === 403) {
        setLoginErrorMessage(message);
        setShowInvalidLogin(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleResponse = useCallback(
    async (response) => {
      const { credential } = response;
      setLoading(true);
      try {
        const res = await api.post("/auth/google", {
          credential,
          isAccessToken: response.isAccessToken || false,
        });
        const { token, user } = res.data.data;
        login(token, user);
        addToast("Login successful", "success");
        navigate("/");
      } catch (err) {
        if (err.response?.status === 409) {
          setError(
            "This email is already registered with a password. Please log in with your password.",
          );
        } else {
          setError(err.response?.data?.message || "Google login failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, addToast],
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/icon.png" alt="VTube Saver" className="auth-logo" />
          <h1>Welcome Back</h1>
          <p>Log in to start downloading</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="floating-group">
            <Mail size={20} className="input-icon" />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors({ ...fieldErrors, email: "" });
              }}
              required
              autoComplete="email"
            />
            <label htmlFor="email">Email</label>
          </div>
          {fieldErrors.email && (
            <p className="field-error">{fieldErrors.email}</p>
          )}

          <div className="floating-group">
            <Lock size={20} className="input-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors({ ...fieldErrors, password: "" });
              }}
              required
              autoComplete="current-password"
            />
            <label htmlFor="password">Password</label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="field-error">{fieldErrors.password}</p>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn primary" disabled={loading}>
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <LogIn size={18} /> Log In
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleResponse}
            onError={() => setError("Google login failed")}
            useOneTap={false}
          />
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>

      <Dialog
        open={showInvalidLogin}
        onClose={() => setShowInvalidLogin(false)}
      >
        <div className="dialog-icon" style={{ background: "var(--danger)" }}>
          <X size={32} color="white" />
        </div>
        <h2 className="dialog-title">Login Failed</h2>
        <p className="dialog-message">
          {loginErrorMessage || "Invalid email or password. Please try again."}
        </p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--primary)" }}
          onClick={() => {
            setShowInvalidLogin(false);
            navigate("/register");
          }}
        >
          Create an Account
        </button>
        <button
          className="dialog-action-btn"
          style={{
            background: "transparent",
            color: "var(--text)",
            border: "2px solid var(--border)",
            marginTop: "0.5rem",
          }}
          onClick={() => setShowInvalidLogin(false)}
        >
          Try Again
        </button>
      </Dialog>
    </div>
  );
};

export default Login;
