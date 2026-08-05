import { useState, useRef, useEffect } from "react";
import "../VideoPreview/VideoPreview.css";
import { useToast } from "../../context/ToastContext";
import { useActiveDownloads } from "../../context/ActiveDownloadsContext";
import {
  X,
  Download,
  Clock,
  Film,
  Music,
  Monitor,
  ChevronDown,
  Lock,
  Crown,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { downloadVideo } from "../../services/api";
import Dialog from "../Dialog/Dialog";
import { useNavigate } from "react-router-dom";

const formatDuration = (seconds) => {
  if (!seconds) return "?";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const InlineVideoPreview = ({ metadata, url, onClose }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const formats = metadata?.formats || [];
  const videoFormats = formats.filter((f) => f.type === "video");
  const audioFormats = formats.filter((f) => f.type === "audio");

  const [selectedType, setSelectedType] = useState("video");
  const [selectedFormatId, setSelectedFormatId] = useState(() => {
    const list = videoFormats.length > 0 ? videoFormats : audioFormats;
    return list.length > 0 ? list[0].format_id : null;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const downloadTimeoutRef = useRef(null);
  const buttonReleaseRef = useRef(null);

  const currentList = selectedType === "video" ? videoFormats : audioFormats;
  const selectedFormat = formats.find((f) => f.format_id === selectedFormatId);
  // Get all needed functions and state from context
  const { addDownload, updateDownload, removeDownload, activeDownloads } =
    useActiveDownloads();

  // If selectedFormat is not in currentList, pick first
  if (
    selectedFormatId &&
    !currentList.some((f) => f.format_id === selectedFormatId)
  ) {
    const firstId = currentList.length > 0 ? currentList[0].format_id : null;
    if (firstId !== selectedFormatId) {
      setSelectedFormatId(firstId);
    }
  }

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setDropdownOpen(false);
    const newList = type === "video" ? videoFormats : audioFormats;
    if (newList.length > 0) {
      setSelectedFormatId(newList[0].format_id);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat) return;

    const downloadId = crypto.randomUUID();
    const newDownload = {
      id: downloadId,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      platform: metadata.platform,
      type: selectedFormat.type,
      quality: selectedFormat.resolution || selectedFormat.label,
      duration: metadata.duration,
      progress: 0,
      status: "preparing",
      filesize: selectedFormat.filesize,
    };

    // 1. Add to active downloads immediately so the card appears
    addDownload(newDownload);
    addToast("Download started", "info");

    setDownloading(true);

    if (buttonReleaseRef.current) clearTimeout(buttonReleaseRef.current);
    buttonReleaseRef.current = setTimeout(() => setDownloading(false), 2000);

    if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
    downloadTimeoutRef.current = setTimeout(() => {
      setDownloading(false);
      updateDownload(downloadId, { status: "error" });
      addToast("Download failed", "error");
    }, 60000);

    let realProgress = 0;
    let realDone = false;
    let currentProgress = 0;
    let progressTimer = null;

    const updateBar = () => {
      if (realDone) {
        // Animate from wherever we are to 100% quickly
        currentProgress += (100 - currentProgress) * 0.3;
        if (currentProgress > 99.5) currentProgress = 100;
      } else {
        // Chance to pause for this tick (gives stop‑points)
        const skipThisTick = Math.random() < 0.3; // 30% pause chance
        if (!skipThisTick) {
          if (currentProgress < 2) {
            currentProgress = Math.random() * 2 + 1; // start at 1‑3%
          } else if (currentProgress < 50) {
            currentProgress += Math.random() * 1.5 + 0.3; // 0.3‑1.8% per tick (very slow)
          } else if (currentProgress < 70) {
            currentProgress += Math.random() * 0.8 + 0.2; // 0.2‑1.0%
          } else if (currentProgress < 85) {
            currentProgress += Math.random() * 0.4 + 0.1; // 0.1‑0.5%
          } else if (currentProgress < 95) {
            currentProgress += Math.random() * 0.2 + 0.05; // 0.05‑0.25%
          } else {
            currentProgress += 0.03; // barely crawl
          }
        }

        // Real progress always takes priority
        if (realProgress > currentProgress) {
          currentProgress = realProgress;
        }

        // Cap at 95% until realDone
        if (currentProgress > 95) currentProgress = 95;
      }

      updateDownload(downloadId, { progress: Math.round(currentProgress) });

      if (currentProgress >= 100) {
        clearInterval(progressTimer);
        updateDownload(downloadId, { progress: 100, status: "completed" });
        addToast("Download finished", "success");
      }
    };

    progressTimer = setInterval(updateBar, 150);

    try {
      updateDownload(downloadId, { status: "downloading" });

      const response = await downloadVideo(
        url,
        selectedFormat.format_id,
        downloadId,
        (percent) => {
          realProgress = percent;
          if (realProgress > currentProgress) currentProgress = realProgress;
        },
      );

      // Download finished – begin the finishing animation
      realDone = true;
      realProgress = 100;

      // Wait for the finishing animation to complete
      await new Promise((resolve) => {
        const check = () => {
          if (currentProgress >= 100) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });

      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${metadata.title}.${selectedFormat.ext || "mp4"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      onClose();
    } catch (err) {
      clearInterval(progressTimer);
      updateDownload(downloadId, { status: "error" });

      const status = err.response?.status;
      if (status === 401) {
        setShowLoginPrompt(true);
      } else if (status === 429) {
        addToast(
          err.response?.data?.message || "Download limit reached",
          "error",
        );
        removeDownload(downloadId);
      } else {
        if (!activeDownloads.some((d) => d.id === downloadId)) return;
        setErrorMessage(err.response?.data?.message || "Download failed");
        setShowError(true);
      }
    } finally {
      if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
      if (buttonReleaseRef.current) clearTimeout(buttonReleaseRef.current);
      setDownloading(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
      if (buttonReleaseRef.current) clearTimeout(buttonReleaseRef.current);
    };
  }, []);

  return (
    <>
      <div className="video-preview-card">
        <button className="preview-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div
          className="preview-hero"
          style={{ backgroundImage: `url(${metadata.thumbnail})` }}
        >
          <div className="preview-hero-overlay">
            <h2 className="preview-title">{metadata.title}</h2>
          </div>
        </div>

        <div className="preview-meta-row">
          <span className="preview-badge">
            <Monitor size={14} /> {metadata.platform}
          </span>
          <span className="preview-badge">
            <Clock size={14} /> {formatDuration(metadata.duration)}
          </span>
        </div>

        <div className="preview-type-toggle">
          <button
            className={`type-btn ${selectedType === "video" ? "active" : ""}`}
            onClick={() => handleTypeChange("video")}
            disabled={videoFormats.length === 0}
          >
            <Film size={16} /> Video
          </button>
          <button
            className={`type-btn ${selectedType === "audio" ? "active" : ""}`}
            onClick={() => handleTypeChange("audio")}
            disabled={audioFormats.length === 0}
          >
            <Music size={16} /> Audio
          </button>
        </div>

        <div className="preview-quality-section">
          <p className="preview-quality-label">Select Quality</p>
          <button
            className="quality-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="quality-trigger-text">
              {selectedFormat ? (
                <>
                  {selectedFormat.type === "audio"
                    ? selectedFormat.label || "Audio"
                    : selectedFormat.resolution}
                  {selectedFormat.fps && selectedFormat.fps > 30
                    ? ` ${selectedFormat.fps}fps`
                    : ""}
                </>
              ) : (
                "Choose quality"
              )}
            </span>
            <ChevronDown
              size={18}
              className={`quality-chevron ${dropdownOpen ? "open" : ""}`}
            />
          </button>
          <div
            className={`quality-options-wrapper ${dropdownOpen ? "open" : ""}`}
          >
            <div className="quality-options-inner">
              {currentList.map((f) => (
                <button
                  key={f.format_id}
                  className={`quality-option ${f.format_id === selectedFormatId ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedFormatId(f.format_id);
                    setDropdownOpen(false);
                  }}
                >
                  <div className="quality-option-left">
                    <span className="quality-option-res">
                      {f.type === "audio" ? f.label || "Audio" : f.resolution}
                    </span>
                    {f.fps && f.fps > 30 && (
                      <span className="quality-option-fps">{f.fps}fps</span>
                    )}
                  </div>
                  <div className="quality-option-right">
                    <span className="quality-option-size">
                      {formatSize(f.filesize)}
                    </span>
                    {f.format_id === selectedFormatId && (
                      <span className="quality-check">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="preview-download-btn"
          onClick={handleDownload}
          disabled={downloading || !selectedFormat}
        >
          {downloading ? (
            "Downloading..."
          ) : (
            <>
              <Download size={18} /> Download
            </>
          )}
        </button>
      </div>

      {/* Login prompt dialog */}
      <Dialog open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
        <div className="dialog-icon" style={{ background: "var(--primary)" }}>
          <Lock size={32} color="white" />
        </div>
        <h2 className="dialog-title">Login Required</h2>
        <p className="dialog-message">
          You need to be logged in to download videos. It only takes a moment!
        </p>
        <button
          className="dialog-action-btn"
          onClick={() => {
            setShowLoginPrompt(false);
            navigate("/login");
          }}
        >
          <LogIn size={18} /> Log in
        </button>
      </Dialog>

      {/* Upgrade prompt dialog */}
      <Dialog
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      >
        <div className="dialog-icon" style={{ background: "var(--secondary)" }}>
          <Crown size={32} color="white" />
        </div>
        <h2 className="dialog-title">Daily Limit Reached</h2>
        <p className="dialog-message">
          You've reached your daily download limit. Upgrade your plan for more
          downloads.
        </p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--secondary)" }}
          onClick={() => {
            setShowUpgradePrompt(false);
            navigate("/plans");
          }}
        >
          View Plans <ArrowRight size={18} />
        </button>
      </Dialog>

      {/* Error dialog */}
      <Dialog open={showError} onClose={() => setShowError(false)}>
        <div className="dialog-icon" style={{ background: "var(--danger)" }}>
          <X size={32} color="white" />
        </div>
        <h2 className="dialog-title">Oops!</h2>
        <p className="dialog-message">{errorMessage}</p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--danger)" }}
          onClick={() => setShowError(false)}
        >
          Close
        </button>
      </Dialog>
    </>
  );
};

export default InlineVideoPreview;
