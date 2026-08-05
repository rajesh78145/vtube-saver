import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Download,
  Crown,
  User,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  Info,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import AboutDialog from "../AboutDialog/AboutDialog";
import "./Navbar.css";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Downloads", path: "/downloads", icon: Download },
  { label: "Plans", path: "/plans", icon: Crown },
  { label: "Profile", path: "/profile", icon: User },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
      <header className="navbar">
        <Link to="/" className="navbar-brand">
          <img src="/icon.png" alt="VTube Saver" className="navbar-logo" />
          <span className="navbar-name">VTube Saver</span>
        </Link>

        {/* Desktop center links */}
        <div className="desktop-nav-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "desktop-link active" : "desktop-link"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/downloads"
            className={({ isActive }) =>
              isActive ? "desktop-link active" : "desktop-link"
            }
          >
            Downloads
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              isActive ? "desktop-link active" : "desktop-link"
            }
          >
            Plans
          </NavLink>
        </div>

        <div className="navbar-actions">
          <button className="navbar-btn" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="navbar-menu" ref={menuRef}>
            <button
              className="navbar-btn"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                {isAuthenticated && user && (
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user.avatar_url ? (
                        <img
                          key={user.avatar_url}
                          src={user.avatar_url}
                          alt={user.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="avatar-initials"
                        style={{ display: user.avatar_url ? "none" : "flex" }}
                      >
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <span className="dropdown-user-name">{user.name}</span>
                  </div>
                )}

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={18} /> Profile
                    </Link>
                    <Link
                      to="/plans"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Crown size={18} /> Upgrade Plan
                    </Link>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setAboutOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      <Info size={18} /> About App
                    </button>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item" onClick={handleLogout}>
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={18} /> Login
                    </Link>
                    <Link
                      to="/plans"
                      className="dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Crown size={18} /> Plans
                    </Link>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setAboutOpen(true);
                        setMenuOpen(false);
                      }}
                    >
                      <Info size={18} /> About App
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= FLOATING BOTTOM NAV (mobile) ================= */}
      <nav className="floating-nav">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

export default Navbar;
