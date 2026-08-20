import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = '/';
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <h1>Welcome <span>Back</span></h1>
          <p>Sign in to your Roadex account</p>
        </div>

        <div className="login-divider">
          <span>Sign in</span>
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <FaEnvelope className="input-icon" />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <FaLock className="input-icon" />
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>

        </form>

        {message && (
          <div className="login-message">
            {message}
          </div>
        )}

        <div className="login-register">
          <span>Don't have an account?</span>
          <Link to="/register">Create Account</Link>
        </div>

      </div>
    </div>
  );
}

export default Login;