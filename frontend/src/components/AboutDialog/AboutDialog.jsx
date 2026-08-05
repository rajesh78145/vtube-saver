import {
  X,
  Monitor,
  Server,
  Database,
  Wrench,
  Heart,
  Code2,
  Palette,
  Terminal,
  Cpu,
} from "lucide-react";
import "./AboutDialog.css";

const AboutDialog = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-card" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="about-header">
          <img src="/icon.png" alt="VTube Saver" className="about-logo" />
          <h2>VTube Saver</h2>
          <p className="about-version">Version 1.0.0</p>
        </div>

        <div className="about-section">
          <div className="about-section-title">
            <div className="about-icon-wrapper dev-icon">
              <Code2 size={20} />
            </div>
            <span>Developer</span>
          </div>
          <p className="about-dev-name">Rajesh Kumar</p>
          <p className="about-dev-role">BCA Student</p>
        </div>

        <div className="about-section">
          <div className="about-section-title">
            <div className="about-icon-wrapper frontend-icon">
              <Monitor size={20} />
            </div>
            <span>Frontend</span>
          </div>
          <div className="about-tech-list">
            <span className="tech-tag">
              <Palette size={14} /> React
            </span>
            <span className="tech-tag">
              <Cpu size={14} /> Vite
            </span>
            <span className="tech-tag">
              <Code2 size={14} /> HTML
            </span>
            <span className="tech-tag">
              <Palette size={14} /> CSS
            </span>
            <span className="tech-tag">
              <Terminal size={14} /> JavaScript
            </span>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">
            <div className="about-icon-wrapper backend-icon">
              <Server size={20} />
            </div>
            <span>Backend</span>
          </div>
          <div className="about-tech-list">
            <span className="tech-tag">
              <Terminal size={14} /> Node.js
            </span>
            <span className="tech-tag">
              <Server size={14} /> Express.js
            </span>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">
            <div className="about-icon-wrapper database-icon">
              <Database size={20} />
            </div>
            <span>Database</span>
          </div>
          <div className="about-tech-list">
            <span className="tech-tag">
              <Database size={14} /> Supabase PostgreSQL
            </span>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">
            <div className="about-icon-wrapper tools-icon">
              <Wrench size={20} />
            </div>
            <span>Tools</span>
          </div>
          <div className="about-tech-list">
            <span className="tech-tag">
              <Terminal size={14} /> yt‑dlp
            </span>
            <span className="tech-tag">
              <Cpu size={14} /> FFmpeg
            </span>
          </div>
        </div>

        <div className="about-footer">
          <Heart size={16} className="about-heart" />
          <p>Thank you for using VTube Saver</p>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;
