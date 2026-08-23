import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { FaSun, FaMoon } from 'react-icons/fa';
import Notifications from './Notifications'; // 🔥 استيراد الإشعارات
import './Navbar.css';

function Navbar({ toggleTheme, theme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();

  // تأثير التمرير
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // تحميل المستخدم
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      setIsAdmin(
        profile?.role === 'admin' || profile?.role === 'super_admin'
      );
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (!currentUser) {
          setIsAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        setIsAdmin(
          profile?.role === 'admin' || profile?.role === 'super_admin'
        );
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setMenuOpen(false);
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="nav-container">

        {/* ===== LOGO ===== */}
        <div className="logo">
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="Roadex" />
            <span className="logo-text">
              Roadex <span>Car Rent</span>
            </span>
          </Link>
        </div>

        {/* ===== NAV LINKS ===== */}
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>

          <Link
            to="/"
            className={isActive('/') ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/cars"
            className={isActive('/cars') ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            Fleets
          </Link>

          <Link
            to="/booking"
            className={isActive('/booking') ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            Book Now
          </Link>

          <Link
            to="/contact"
            className={isActive('/contact') ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>

          {/* Dashboard - يظهر للأدمن بس */}
          {user && isAdmin && (
            <Link
              to="/admin"
              className={isActive('/admin') ? 'active admin-link' : 'admin-link'}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          )}

          {/* روابط المستخدم */}
          {!user && (
            <>
              <Link
                to="/register"
                className={isActive('/register') ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>

              <Link
                to="/login"
                className={isActive('/login') ? 'active nav-login-link' : 'nav-login-link'}
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to="/my-bookings"
                className={isActive('/my-bookings') ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                My Bookings
              </Link>

              <button
                type="button"
                className="nav-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}

        </div>

        {/* ===== ACTIONS ===== */}
        <div className="nav-actions">
          
          {/* 🔥 الإشعارات - تظهر لكل المستخدمين */}
          <Notifications />

          {/* Theme Toggle */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <FaSun className="theme-icon" />
            ) : (
              <FaMoon className="theme-icon" />
            )}
          </button>

          {/* Hamburger */}
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

      </div>
    </nav>
  );
}

export default Navbar;