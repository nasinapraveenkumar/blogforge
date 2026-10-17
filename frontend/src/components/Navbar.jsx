
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-brand-icon">B</span>
          <span>BlogForge</span>
        </Link>

        <button
          className="navbar-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="navbar-links"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="navbar-links"
          className={`navbar-links ${menuOpen ? "is-open" : ""}`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <a href="/#community" className="navbar-link" onClick={closeMenu}>
            Community
          </a>

          <NavLink
            to="/login"
            className={({ isActive }) =>
              `navbar-link ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Log in
          </NavLink>

          <NavLink
            to="/register"
            className="navbar-register"
            onClick={closeMenu}
          >
            Get started
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
