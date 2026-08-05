import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Crown,
  Lock,
  LogOut,
  Edit3,
  Camera,
  AlertCircle,
  Info,
  Zap,
  ChevronRight,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getProfile,
  updateProfile,
  changePassword,
  changeEmailRequest,
  verifyEmailChange,
  updateAvatar,
  requestSetPasswordOTP,
  setPassword,
} from "../../services/api";
import Dialog from "../../components/Dialog/Dialog";
import AboutDialog from "../../components/AboutDialog/AboutDialog";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false); // for Change Password
  const [showSetPwd, setShowSetPwd] = useState(false); // for Set Password
  const [showEmailPwd, setShowEmailPwd] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newSetPassword, setNewSetPassword] = useState("");
  const [confirmSetPassword, setConfirmSetPassword] = useState("");
  const [setPasswordStep, setSetPasswordStep] = useState(1); // 1 = enter new pass, 2 = enter OTP
  const [setPasswordOtp, setSetPasswordOtp] = useState("");
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [emailStep, setEmailStep] = useState(1);
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.data);
    } catch{
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate, fetchProfile]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditName = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const res = await updateProfile({ name: newName });
      setProfile((prev) => ({ ...prev, ...res.data.data }));
      setShowEditName(false);
      setFormSuccess("Name updated!");
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Update failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await changePassword({ currentPassword, newPassword });
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setFormSuccess("Password changed!");
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Change failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEmailStep1 = (e) => {
    e.preventDefault();
    if (!emailCurrentPassword) return;
    setEmailStep(2);
  };

  const handleEmailStep2 = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    setFormLoading(true);
    setFormError("");
    try {
      const res = await changeEmailRequest({
        newEmail,
        currentPassword: emailCurrentPassword,
      });
      setEmailStep(3);
      setFormSuccess(res.data.data.message);
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Request failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEmailStep3 = async (e) => {
    e.preventDefault();
    if (emailOtp.length !== 6) return;
    setFormLoading(true);
    setFormError("");
    try {
      const res = await verifyEmailChange({ newEmail, otp: emailOtp });
      setProfile((prev) => ({ ...prev, ...res.data.data }));
      setShowChangeEmail(false);
      resetEmailDialog();
      setFormSuccess("Email updated!");
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Verification failed");
    } finally {
      setFormLoading(false);
    }
  };

  const resetEmailDialog = () => {
    setEmailStep(1);
    setEmailCurrentPassword("");
    setNewEmail("");
    setEmailOtp("");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await updateAvatar(formData);
      setProfile((prev) => ({ ...prev, ...res.data.data }));
      updateUser({ avatar_url: res.data.data.avatar_url });
      setFormSuccess("Profile picture updated!");
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };
  const handleSetPasswordRequestOTP = async (e) => {
    e.preventDefault();
    if (newSetPassword !== confirmSetPassword) {
      setFormError("Passwords do not match");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      await requestSetPasswordOTP();
      setSetPasswordStep(2);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (setPasswordOtp.length !== 6) return;
    setFormLoading(true);
    setFormError("");
    try {
      await setPassword({ newPassword: newSetPassword, otp: setPasswordOtp });
      setShowSetPassword(false);
      resetSetPasswordDialog();
      setFormSuccess("Password set successfully!");
      setTimeout(() => setFormSuccess(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to set password");
    } finally {
      setFormLoading(false);
    }
  };

  const resetSetPasswordDialog = () => {
    setSetPasswordStep(1);
    setNewSetPassword("");
    setConfirmSetPassword("");
    setSetPasswordOtp("");
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading)
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading...</div>
      </div>
    );
  if (!profile)
    return (
      <div className="profile-page">
        <div className="profile-error">
          <AlertCircle size={48} />
          <p>{error || "Profile not available"}</p>
        </div>
      </div>
    );

  const planName = profile.plans?.name || "Free";
  const dailyLimit = profile.plans?.daily_limit || 0;
  const downloadsToday = profile.today_download_count || 0;
  const planExpire = profile.plan_expire
    ? new Date(profile.plan_expire).toLocaleDateString()
    : "Never";

  return (
    <div className="profile-page">
      {formSuccess && <div className="toast-success">{formSuccess}</div>}

      {/* User Card */}
      <div className="profile-card user-card">
        <div className="user-card-accent" />
        <div className="profile-avatar-section">
          <div
            className="profile-avatar"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : (
              <span className="profile-initials">
                {getInitials(profile.name)}
              </span>
            )}
            <div className="avatar-overlay">
              <Camera size={20} color="white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
          <h2>{profile.name}</h2>
          <p className="profile-email">{profile.email}</p>
          <span className="profile-plan-badge">
            <Crown size={14} /> {planName} Plan
          </span>
        </div>
      </div>

      {/* Downloads Card */}
      <div className="profile-card downloads-card">
        <div className="downloads-card-accent" />
        <h3 className="card-title-pp">Downloads</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-number">
              {downloadsToday} / {dailyLimit}
            </span>
            <span className="stat-desc">Today's Downloads</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">
              {planExpire === "Never" ? "∞" : planExpire}
            </span>
            <span className="stat-desc">Plan Expires</span>
          </div>
        </div>
      </div>

      {/* Account Card */}
      <div className="profile-card account-card">
        <div className="account-card-accent" />
        <h3 className="card-title-pp">Account</h3>
        <div className="actions-list">
          <button
            className="action-btn"
            onClick={() => {
              setNewName(profile.name);
              setShowEditName(true);
            }}
          >
            <Edit3 size={18} /> Edit Profile <ChevronRight size={16} />
          </button>
          {profile.has_password ? (
            <button
              className="action-btn"
              onClick={() => setShowChangePassword(true)}
            >
              <Lock size={18} /> Change Password <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="action-btn"
              onClick={() => {
                resetSetPasswordDialog();
                setShowSetPassword(true);
              }}
            >
              <Lock size={18} /> Set Password <ChevronRight size={16} />
            </button>
          )}
          <button
            className="action-btn"
            onClick={() => {
              resetEmailDialog();
              setShowChangeEmail(true);
            }}
          >
            <Mail size={18} /> Change Email <ChevronRight size={16} />
          </button>
          <button
            className="action-btn logout"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <LogOut size={18} /> Logout <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* App Card */}
      <div className="profile-card app-card">
        <div className="app-card-accent" />
        <h3 className="card-title-pp">App</h3>
        <div className="actions-list">
          <button className="action-btn" onClick={() => navigate("/plans")}>
            <Zap size={18} /> Plans <ChevronRight size={16} />
          </button>
          <button className="action-btn" onClick={() => setShowAbout(true)}>
            <Info size={18} /> About App <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={showEditName} onClose={() => setShowEditName(false)}>
        <h2 className="dialog-title">Edit Name</h2>
        <form onSubmit={handleEditName}>
          <div className="floating-group">
            <User size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <label htmlFor="edit-name">Name</label>
          </div>
          {formError && <p className="field-error">{formError}</p>}
          <button
            type="submit"
            className="dialog-action-btn"
            disabled={formLoading}
          >
            {formLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      >
        <h2 className="dialog-title">Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="floating-group">
            <Lock size={18} className="input-icon" />
            <input
              id="current-password"
              name="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <label htmlFor="current-password">Current password</label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="floating-group">
            <Lock size={18} className="input-icon" />
            <input
              id="new-password"
              name="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <label htmlFor="new-password">New password</label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowNewPassword(!showNewPassword)}
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formError && <p className="field-error">{formError}</p>}
          <button
            type="submit"
            className="dialog-action-btn"
            disabled={formLoading}
          >
            {formLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </Dialog>

      {/* Change Email Dialog */}
      <Dialog
        open={showChangeEmail}
        onClose={() => {
          setShowChangeEmail(false);
          resetEmailDialog();
        }}
      >
        <h2 className="dialog-title">Change Email</h2>
        {emailStep === 1 && (
          <form onSubmit={handleEmailStep1}>
            <p className="dialog-message">
              Enter your current password to continue.
            </p>
            <div className="floating-group">
              <Lock size={18} className="input-icon" />
              <input
                type={showEmailPwd ? "text" : "password"}
                placeholder="Current password"
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                required
              />
              <label htmlFor="email-current-password">Current password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowEmailPwd(!showEmailPwd)}
                tabIndex={-1}
              >
                {showEmailPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              className="dialog-action-btn"
              disabled={!emailCurrentPassword}
            >
              Continue
            </button>
          </form>
        )}
        {emailStep === 2 && (
          <form onSubmit={handleEmailStep2}>
            <p className="dialog-message">Enter your new email address.</p>
            <div className="floating-group">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <label htmlFor="new-email">New email</label>
            </div>
            {formError && <p className="field-error">{formError}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="dialog-action-btn"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "2px solid var(--border)",
                }}
                onClick={() => setEmailStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="dialog-action-btn"
                disabled={formLoading || !newEmail}
              >
                {formLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          </form>
        )}
        {emailStep === 3 && (
          <form onSubmit={handleEmailStep3}>
            <p className="dialog-message">
              Enter the OTP sent to <strong>{newEmail}</strong>.
            </p>
            <div className="floating-group">
              <Check size={18} className="input-icon" />
              <input
                type="text"
                placeholder="6-digit OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                required
                maxLength={6}
                minLength={6}
                inputMode="numeric"
              />
              <label htmlFor="email-otp">OTP</label>
            </div>
            {formError && <p className="field-error">{formError}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="dialog-action-btn"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "2px solid var(--border)",
                }}
                onClick={() => setEmailStep(2)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="dialog-action-btn"
                disabled={formLoading || emailOtp.length < 6}
              >
                {formLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
      {/* Set Password Dialog */}
      <Dialog
        open={showSetPassword}
        onClose={() => {
          setShowSetPassword(false);
          resetSetPasswordDialog();
        }}
      >
        <h2 className="dialog-title">Set Password</h2>
        {setPasswordStep === 1 && (
          <form onSubmit={handleSetPasswordRequestOTP}>
            <p className="dialog-message">
              Create a new password for your account.
            </p>
            <div className="floating-group">
              <Lock size={18} className="input-icon" />
              <input
                type={showSetPwd ? "text" : "password"}
                placeholder="New password"
                value={newSetPassword}
                onChange={(e) => setNewSetPassword(e.target.value)}
                required
                minLength={8}
                id="new-set-password"
              />
              <label htmlFor="new-set-password">New password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSetPwd(!showSetPwd)}
                tabIndex={-1}
              >
                {showSetPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="floating-group">
              <Lock size={18} className="input-icon" />
              <input
                type={showSetPwd ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmSetPassword}
                onChange={(e) => setConfirmSetPassword(e.target.value)}
                required
                minLength={8}
                id="confirm-set-password"
              />
              <label htmlFor="confirm-set-password">Confirm password</label>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowSetPwd(!showSetPwd)}
                tabIndex={-1}
              >
                {showSetPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formError && <p className="field-error">{formError}</p>}
            <button
              type="submit"
              className="dialog-action-btn"
              disabled={formLoading || !newSetPassword || !confirmSetPassword}
            >
              {formLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}
        {setPasswordStep === 2 && (
          <form onSubmit={handleSetPassword}>
            <p className="dialog-message">Enter the OTP sent to your email.</p>
            <div className="floating-group">
              <Check size={18} className="input-icon" />
              <input
                type="text"
                placeholder="6-digit OTP"
                value={setPasswordOtp}
                onChange={(e) =>
                  setSetPasswordOtp(e.target.value.replace(/\D/g, ""))
                }
                required
                maxLength={6}
                minLength={6}
                inputMode="numeric"
                id="set-password-otp"
              />
              <label htmlFor="set-password-otp">OTP</label>
            </div>
            {formError && <p className="field-error">{formError}</p>}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="dialog-action-btn"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "2px solid var(--border)",
                }}
                onClick={() => setSetPasswordStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="dialog-action-btn"
                disabled={formLoading || setPasswordOtp.length < 6}
              >
                {formLoading ? "Setting..." : "Set Password"}
              </button>
            </div>
          </form>
        )}
      </Dialog>
      {/* Logout Dialog */}
      <Dialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
      >
        <div className="dialog-icon" style={{ background: "var(--danger)" }}>
          <LogOut size={32} color="white" />
        </div>
        <h2 className="dialog-title">Logout</h2>
        <p className="dialog-message">Are you sure you want to logout?</p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--danger)" }}
          onClick={handleLogout}
        >
          Yes, Logout
        </button>
        <button
          className="dialog-action-btn"
          style={{
            background: "transparent",
            color: "var(--text)",
            border: "2px solid var(--border)",
            marginTop: "0.5rem",
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          Cancel
        </button>
      </Dialog>

      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
};

export default Profile;
