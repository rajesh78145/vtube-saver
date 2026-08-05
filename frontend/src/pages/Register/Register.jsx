import { useState, useEffect, useCallback } from "react";
import { FaGoogle } from "react-icons/fa";
import { useToast } from "../../context/ToastContext";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Dialog from "../../components/Dialog/Dialog";
import "../Login/Login.css";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showEmailExists, setShowEmailExists] = useState(false);

  const validateStep1 = () => {
    const errors = { name: "", email: "", password: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!name.trim()) {
      errors.name = "Name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Invalid email format";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      errors.password =
        "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (@$!%*?&)";
    }

    setFieldErrors(errors);
    return !errors.name && !errors.email && !errors.password;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      setSuccessMsg(res.data.data.message || "OTP sent to your email");
      setStep(2);
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      if (err.response?.status === 409) {
        setShowEmailExists(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      const { token, user } = res.data.data;
      login(token, user);
      addToast("Account created successfully", "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/resend-otp", { email });
      setSuccessMsg(res.data.data.message || "OTP resent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
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
        addToast("Account created successfully", "success");
        navigate("/");
      } catch (err) {
        if (err.response?.status === 409) {
          setError("This email is already registered. Please log in.");
        } else {
          setError(err.response?.data?.message || "Google sign-up failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [login, navigate, addToast],
  );
  const { triggerGoogleLogin } = useGoogleAuth(handleGoogleResponse);
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/icon.png" alt="VTube Saver" className="auth-logo" />
          <h1>Create Account</h1>
          <p>
            {step === 1
              ? "Sign up to start downloading"
              : "Enter the OTP sent to your email"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleRegister} className="auth-form" noValidate>
            <div className="floating-group">
              <User size={20} className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors({ ...fieldErrors, name: "" });
                }}
                required
                autoComplete="name"
              />
              <label htmlFor="name">Full Name</label>
            </div>
            {fieldErrors.name && (
              <p className="field-error">{fieldErrors.name}</p>
            )}

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
                id="new-password"
                name="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors({ ...fieldErrors, password: "" });
                }}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <label htmlFor="new-password">Password</label>
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

            <button
              type="submit"
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? (
                "Sending OTP..."
              ) : (
                <>
                  <Mail size={18} /> Send OTP
                </>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            {successMsg && <p className="auth-success">{successMsg}</p>}

            <div className="floating-group">
              <CheckCircle size={20} className="input-icon" />
              <input
                id="otp"
                name="otp"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                maxLength={6}
                minLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <label htmlFor="otp">OTP</label>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-btn primary"
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <CheckCircle size={18} /> Verify & Login
                </>
              )}
            </button>

            <button
              type="button"
              className="auth-btn secondary"
              onClick={handleResendOTP}
              disabled={loading}
            >
              {loading ? "Resending..." : "Resend OTP"}
            </button>

            <button
              type="button"
              className="auth-btn secondary"
              onClick={() => setStep(1)}
            >
              <ArrowRight size={18} /> Change Email
            </button>
          </form>
        )}
        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-btn google" onClick={triggerGoogleLogin}>
          <FaGoogle size={18} /> Continue with Google
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>

      <Dialog open={showEmailExists} onClose={() => setShowEmailExists(false)}>
        <div className="dialog-icon" style={{ background: "var(--warning)" }}>
          <Mail size={32} color="white" />
        </div>
        <h2 className="dialog-title">Already Registered</h2>
        <p className="dialog-message">
          An account with this email already exists. Please log in instead.
        </p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--primary)" }}
          onClick={() => {
            setShowEmailExists(false);
            navigate("/login");
          }}
        >
          Go to Login
        </button>
      </Dialog>
    </div>
  );
};

export default Register;
