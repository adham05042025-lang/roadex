import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const location = useLocation();

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
  profile?.role === 'admin' ||
  profile?.role === 'super_admin'
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

        setIsAdmin(profile?.role === 'admin');
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
                className={isActive('/login') ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                Login
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

              {isAdmin && (
                <Link
                  to="/admin"
                  className={isActive('/admin') ? 'active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}

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
