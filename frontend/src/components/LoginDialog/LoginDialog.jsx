import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import Dialog from "../Dialog/Dialog";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const LoginDialog = ({ open, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      onLoginSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <h2 className="dialog-title">Login to Download</h2>
      <p className="dialog-message">You need an account to download videos.</p>
      <form onSubmit={handleSubmit}>
        <div className="floating-group">
          <Mail size={18} className="input-icon" />
          <input
            id="login-dialog-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="login-dialog-email">Email</label>
        </div>
        <div className="floating-group">
          <Lock size={18} className="input-icon" />
          <input
            id="login-dialog-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="login-dialog-password">Password</label>
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" className="dialog-action-btn" disabled={loading}>
          {loading ? (
            "Logging in..."
          ) : (
            <>
              <LogIn size={18} /> Login
            </>
          )}
        </button>
      </form>
      <p
        style={{
          marginTop: "1rem",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
        }}
      >
        Don't have an account?{" "}
        <Link to="/register" onClick={onClose}>
          Register
        </Link>
      </p>
    </Dialog>
  );
};

export default LoginDialog;
