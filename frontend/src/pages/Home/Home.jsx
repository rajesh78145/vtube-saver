import { useState } from "react";
import InlineVideoPreview from "../../components/InlineVideoPreview/InlineVideoPreview";
import Dialog from "../../components/Dialog/Dialog";
import {
  FaYoutube,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaTwitch,
  FaReddit,
  FaSoundcloud,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
  Search,
  ClipboardPaste,
  ArrowDown,
  Zap,
  Monitor,
  Music,
  Smartphone,
  Shield,
  Globe,
  X,
} from "lucide-react";
import { fetchVideoInfo } from "../../services/api";
import "./Home.css";

const platformList = [
  { name: "YouTube", color: "#FF0000", icon: FaYoutube },
  { name: "Instagram", color: "#E4405F", icon: FaInstagram },
  { name: "Facebook", color: "#1877F2", icon: FaFacebook },
  { name: "TikTok", color: "#000000", icon: FaTiktok },
  { name: "X", color: "#1DA1F2", icon: FaXTwitter },
  { name: "Twitch", color: "#9146FF", icon: FaTwitch },
  { name: "Reddit", color: "#FF4500", icon: FaReddit },
  { name: "SoundCloud", color: "#FF5500", icon: FaSoundcloud },
];

const features = [
  { icon: Zap, label: "Fast", desc: "Lightning fast downloads" },
  { icon: Monitor, label: "HD Quality", desc: "Up to 4K resolution" },
  { icon: Music, label: "Audio", desc: "Extract audio in MP3" },
  { icon: Smartphone, label: "Mobile", desc: "Works on any device" },
  { icon: Shield, label: "Secure", desc: "No data stored" },
  { icon: Globe, label: "1000+ Sites", desc: "Wide platform support" },
];

const Home = () => {
  const [fetchError, setFetchError] = useState(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState("");

  // URL input
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  // Preview
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      // clipboard not available – ignore
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setCurrentUrl(url.trim());
    try {
      const res = await fetchVideoInfo(url.trim());
      setPreviewData(res.data.data);
      setShowPreview(true);
    } catch (err) {
      setFetchErrorMessage(
        err.response?.data?.message || "Failed to fetch video info",
      );
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <img src="/icon.png" alt="VTube Saver" className="hero-logo" />
        <h1 className="hero-title">VTube Saver</h1>
        <p className="hero-subtitle">Fast. Simple. Free.</p>
      </section>

      {/* Download Section (URL input) */}
      <section className="download-section">
        <div className="url-input-group">
          <input
            id="video-url"
            name="url"
            type="text"
            className="url-input"
            placeholder="Paste video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
          />
          <div className="url-actions">
            <button
              className="paste-btn"
              onClick={handlePaste}
              title="Paste from clipboard"
            >
              <ClipboardPaste size={18} />
            </button>
            <button
              className="fetch-btn"
              onClick={handleFetch}
              disabled={!url.trim() || loading}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <Search size={18} /> Download
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Inline Preview Card */}
      {showPreview && previewData && (
        <div className="video-preview-wrapper" key={currentUrl}>
          <InlineVideoPreview
            metadata={previewData}
            url={currentUrl}
            onClose={() => {
              setShowPreview(false);
              setPreviewData(null);
            }}
          />
        </div>
      )}

      {/* Platforms Carousel (hidden when preview is shown) */}
      {!showPreview && (
        <section className="platforms-section">
          <p className="platforms-label">Supported Platforms</p>
          <div className="carousel-viewport">
            <div className="carousel-track">
              {platformList.map((platform, idx) => (
                <div
                  key={`${platform.name}-${idx}`}
                  className="platform-bubble"
                  style={{ backgroundColor: platform.color }}
                >
                  <platform.icon size={28} color="white" />
                </div>
              ))}
              {platformList.map((platform, idx) => (
                <div
                  key={`${platform.name}-dup-${idx}`}
                  className="platform-bubble"
                  style={{ backgroundColor: platform.color }}
                >
                  <platform.icon size={28} color="white" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Help Card (hidden when preview is shown) */}
      {!showPreview && (
        <section className="help-card">
          <h2>💡 How to Download</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-circle">1</div>
              <div className="step-content">
                <p className="step-title">Paste URL</p>
                <p className="step-desc">Copy & paste the video link</p>
              </div>
            </div>
            <div className="step-connector">
              <ArrowDown size={20} />
            </div>
            <div className="step">
              <div className="step-circle">2</div>
              <div className="step-content">
                <p className="step-title">Fetch Video</p>
                <p className="step-desc">Click Download to fetch info</p>
              </div>
            </div>
            <div className="step-connector">
              <ArrowDown size={20} />
            </div>
            <div className="step">
              <div className="step-circle">3</div>
              <div className="step-content">
                <p className="step-title">Select Format</p>
                <p className="step-desc">Choose quality & type</p>
              </div>
            </div>
            <div className="step-connector">
              <ArrowDown size={20} />
            </div>
            <div className="step">
              <div className="step-circle">4</div>
              <div className="step-content">
                <p className="step-title">Download</p>
                <p className="step-desc">Save your video</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <h2>Why VTube Saver?</h2>
        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.label}>
              <feature.icon size={32} />
              <h3>{feature.label}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fetch Error Dialog */}
      <Dialog open={fetchError} onClose={() => setFetchError(false)}>
        <div className="dialog-icon" style={{ background: "var(--danger)" }}>
          <X size={32} color="white" />
        </div>
        <h2 className="dialog-title">Invalid Link</h2>
        <p className="dialog-message">{fetchErrorMessage}</p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--danger)" }}
          onClick={() => setFetchError(false)}
        >
          Close
        </button>
      </Dialog>
    </div>
  );
};

export default Home;
