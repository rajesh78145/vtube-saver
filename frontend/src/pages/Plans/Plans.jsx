import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, Zap, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPlans, upgradePlan, getProfile } from "../../services/api";
import Dialog from "../../components/Dialog/Dialog";
import "./Plans.css";

const Plans = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradingId, setUpgradingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const scrollRef = useRef(null);

  const fetchPlans = async () => {
    try {
      const res = await getPlans();
      setPlans(res.data.data || []);
    } catch (err) {
      setError("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated]);

  // Auto-scroll to the popular (Gold) plan on mobile
  useEffect(() => {
    if (plans.length > 0 && scrollRef.current && window.innerWidth < 768) {
      const goldIndex = plans.findIndex((p) => p.name === "Gold");
      if (goldIndex !== -1) {
        const card = scrollRef.current.children[0]?.children[goldIndex];
        if (card) {
          card.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [plans]);

  const handleUpgrade = async (planId) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setUpgradingId(planId);
    try {
      await upgradePlan(planId);
      setShowSuccess(true);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Upgrade failed");
    } finally {
      setUpgradingId(null);
    }
  };

  const currentPlanId = profile?.plan_id;
  const currentPlanName = profile?.plans?.name || "Free";

  const getDailyLimitLabel = (limit) => {
    if (limit >= 999999) return "Unlimited";
    return `${limit} downloads/day`;
  };

  if (loading) {
    return (
      <div className="plans-page">
        <div className="loading">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="plans-page">
      <div className="plans-header">
        <h1>Choose Your Plan</h1>
        <p>Upgrade for more daily downloads</p>
        {isAuthenticated && profile && (
          <span className="current-plan-badge">
            <Crown size={14} /> Current: {currentPlanName}
          </span>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="plans-scroll-container" ref={scrollRef}>
        <div className="plans-grid">
          {plans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPopular = plan.name === "Gold";
            const dailyLimitLabel = getDailyLimitLabel(plan.daily_limit);
            const features = [
              dailyLimitLabel,
              plan.name === "Free"
                ? "Basic access"
                : `${plan.duration_days} days validity`,
              "All platforms supported",
              plan.name !== "Free" && "HD quality available",
              plan.name !== "Free" && "Audio extraction",
            ].filter(Boolean);

            return (
              <div
                key={plan.id}
                className={`plan-card ${isCurrent ? "current" : ""} ${isPopular ? "featured" : ""} ${plan.name.toLowerCase()}`}
              >
                {isCurrent && <span className="current-tag">Current</span>}
                {isPopular && !isCurrent && (
                  <span className="featured-tag">Most Popular</span>
                )}

                <div className="plan-name">{plan.name}</div>

                <div className="plan-price">
                  {plan.price === 0 ? (
                    <span className="free">Free</span>
                  ) : (
                    <>
                      <span className="currency">₹</span>
                      <span className="amount">{plan.price}</span>
                    </>
                  )}
                </div>

                {plan.original_price && plan.original_price > plan.price && (
                  <div className="plan-discount-row">
                    <span className="original-price">
                      ₹{plan.original_price}
                    </span>
                    <span className="discount-badge">
                      -{plan.discount_percent}%
                    </span>
                  </div>
                )}

                <p className="plan-subtitle">
                  {plan.price === 0 ? "Basic access" : dailyLimitLabel}
                </p>

                <ul className="plan-features">
                  {features.map((feat, idx) => (
                    <li key={idx}>
                      <Check size={16} /> {feat}
                    </li>
                  ))}
                </ul>

                <button
                  className={`plan-btn ${isCurrent ? "current-btn" : ""}`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || upgradingId === plan.id}
                >
                  {isCurrent ? (
                    "Your Plan"
                  ) : upgradingId === plan.id ? (
                    "Upgrading..."
                  ) : (
                    <>
                      {plan.price === 0 ? "Get Started" : "Upgrade"}{" "}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login prompt dialog */}
      <Dialog open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
        <div className="dialog-icon" style={{ background: "var(--primary)" }}>
          <Zap size={32} color="white" />
        </div>
        <h2 className="dialog-title">Login Required</h2>
        <p className="dialog-message">
          You need to be logged in to upgrade your plan.
        </p>
        <button
          className="dialog-action-btn"
          onClick={() => {
            setShowLoginPrompt(false);
            navigate("/login");
          }}
        >
          Go to Login
        </button>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={showSuccess} onClose={() => setShowSuccess(false)}>
        <div className="dialog-icon" style={{ background: "var(--success)" }}>
          <Check size={32} color="white" />
        </div>
        <h2 className="dialog-title">Plan Upgraded!</h2>
        <p className="dialog-message">
          Your plan has been updated successfully. Enjoy your new limits!
        </p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--success)" }}
          onClick={() => setShowSuccess(false)}
        >
          Great!
        </button>
      </Dialog>
    </div>
  );
};

export default Plans;
