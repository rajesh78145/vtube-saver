import { useState, useEffect, useCallback, useRef } from "react";
import { cancelDownload } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Clock,
  Film,
  Music,
  Download,
  AlertCircle,
  Monitor,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getHistory, deleteHistoryRecord } from "../../services/api";
import { useActiveDownloads } from "../../context/ActiveDownloadsContext";
import Dialog from "../../components/Dialog/Dialog"
import "./Downloads.css";

const Downloads = () => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const { activeDownloads, removeDownload, updateDownload } =
    useActiveDownloads();
  const removedIds = useRef(new Set());
  const refreshedIds = useRef(new Set());
  const fetchHistory = useCallback(async () => {
    try {
      const res = await getHistory();
      setHistory(res.data.data || []);
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const toRemove = [];
    let shouldRefresh = false;

    activeDownloads.forEach((dl) => {
      if (dl.progress >= 100 && !removedIds.current.has(dl.id)) {
        removedIds.current.add(dl.id);
        toRemove.push(dl.id);
      }

      if (dl.status === "error" && !removedIds.current.has(dl.id)) {
        const now = Date.now();

        if (!dl.errorTimestamp) {
          updateDownload(dl.id, { errorTimestamp: now });
        } else if (now - dl.errorTimestamp > 5000) {
          removedIds.current.add(dl.id);
          toRemove.push(dl.id);
        }
      }
      if (dl.status === "completed" && !refreshedIds.current.has(dl.id)) {
        refreshedIds.current.add(dl.id);
        shouldRefresh = true;
      }
    });

    if (toRemove.length > 0) {
      setTimeout(() => {
        toRemove.forEach((id) => removeDownload(id));
      }, 0);
    }

    if (shouldRefresh) {
      fetchHistory();
    }

    // Cleanup tracking sets
    const currentIds = new Set(activeDownloads.map((dl) => dl.id));
    removedIds.current.forEach((id) => {
      if (!currentIds.has(id)) removedIds.current.delete(id);
    });
    refreshedIds.current.forEach((id) => {
      if (!currentIds.has(id)) refreshedIds.current.delete(id);
    });
  }, [activeDownloads, removeDownload, fetchHistory, updateDownload]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchHistory();
  }, [isAuthenticated, fetchHistory]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteHistoryRecord(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      addToast("History deleted", "success");
    } catch {
      alert("Failed to delete record");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return null;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const handleCancelClick = (downloadId) => {
    setCancelTargetId(downloadId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    try {
      await cancelDownload(cancelTargetId);
      removeDownload(cancelTargetId);
      addToast("Download cancelled", "info");
    } catch (err) {
      if (err.response?.status === 404) {
        removeDownload(cancelTargetId);
      } else {
        removeDownload(cancelTargetId);
        addToast("Failed to cancel download", "error");
      }
    } finally {
      setShowCancelConfirm(false);
      setCancelTargetId(null);
    }
  };
  if (!isAuthenticated) {
    return (
      <div className="downloads-page">
        <div className="empty-state">
          <Download size={48} />
          <p>Please log in to view your downloads.</p>
          <button className="empty-state-btn" onClick={() => navigate("/")}>
            Start Downloading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="downloads-page">
      <h2 className="page-title">Download History</h2>

      {activeDownloads.length > 0 && (
        <>
          <h3 className="section-title">Active Downloads</h3>
          <div className="history-list">
            {activeDownloads.map((dl) => (
              <div
                key={dl.id}
                className="history-card"
                style={{
                  backgroundImage: dl.thumbnail
                    ? `url(${dl.thumbnail})`
                    : "none",
                }}
              >
                <div className="card-overlay" />
                <div className="card-content">
                  <div className="card-top-row">
                    <p className="card-title">{dl.title}</p>
                    <button
                      className="card-action-btn"
                      onClick={() => handleCancelClick(dl.id)}
                      disabled={dl.status === "completed" || dl.progress >= 100}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="badge-rows">
                    <div className="badge-row">
                      <span className="card-badge">
                        <Monitor size={10} /> {dl.platform || "Unknown"}
                      </span>
                      <span className="card-badge">
                        <Clock size={10} /> {formatDuration(dl.duration)}
                      </span>
                    </div>
                    <div className="badge-row">
                      <span className="card-badge">
                        {dl.type === "audio" ? (
                          <Music size={10} />
                        ) : (
                          <Film size={10} />
                        )}
                        {dl.type}
                      </span>
                      <span className="card-badge">{dl.quality}</span>
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${dl.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{dl.progress}%</span>
                    {dl.filesize && (
                      <span className="progress-size">
                        {formatSize(dl.filesize)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && <div className="loading">Loading history...</div>}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!loading &&
        !error &&
        history.length === 0 &&
        activeDownloads.length === 0 && (
          <div className="empty-state">
            <Download size={48} />
            <p>No downloads yet.</p>
            <button className="empty-state-btn" onClick={() => navigate("/")}>
              Start Downloading
            </button>
          </div>
        )}

      <div className="history-list">
        {history.map((item) => (
          <div
            key={item.id}
            className="history-card"
            style={{
              backgroundImage: item.thumbnail
                ? `url(${item.thumbnail})`
                : "none",
            }}
          >
            <div className="card-overlay" />
            <div className="card-content">
              <div className="card-top-row">
                <p className="card-title">{item.title}</p>
                <button
                  className="card-action-btn"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="badge-rows">
                <div className="badge-row">
                  <span className="card-badge">
                    <Monitor size={10} /> {item.platform || "Unknown"}
                  </span>
                  {formatDuration(item.duration) && (
                    <span className="card-badge">
                      <Clock size={10} /> {formatDuration(item.duration)}
                    </span>
                  )}
                </div>
                <div className="badge-row">
                  <span className="card-badge">
                    {item.type === "audio" ? (
                      <Music size={10} />
                    ) : (
                      <Film size={10} />
                    )}
                    {item.type}
                  </span>
                  <span className="card-badge">{item.quality}</span>
                </div>
              </div>

              <div className="card-bottom-row">
                <span className="card-date">
                  {formatDate(item.downloaded_at)}
                </span>
                {item.filesize && (
                  <span className="card-size">{formatSize(item.filesize)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
      >
        <div className="dialog-icon" style={{ background: "var(--danger)" }}>
          <X size={32} color="white" />
        </div>
        <h2 className="dialog-title">Cancel Download</h2>
        <p className="dialog-message">
          Are you sure you want to cancel this download?
        </p>
        <button
          className="dialog-action-btn"
          style={{ background: "var(--danger)" }}
          onClick={handleConfirmCancel}
        >
          Yes, Cancel
        </button>
        <button
          className="dialog-action-btn"
          style={{
            background: "transparent",
            color: "var(--text)",
            border: "2px solid var(--border)",
            marginTop: "0.5rem",
          }}
          onClick={() => setShowCancelConfirm(false)}
        >
          No, Go Back
        </button>
      </Dialog>
    </div>
  );
};

export default Downloads;
