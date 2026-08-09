import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/cars', label: 'Fleets' },
    { to: '/booking', label: 'Book Now' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
       <div className="logo">
  <Link to="/" onClick={() => setMenuOpen(false)}>
    <img src="/logo.png" alt="Roadex" />
    <span className="logo-text">
      Roadex <span>Car Rent</span>
    </span>
  </Link>
</div>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to) ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
