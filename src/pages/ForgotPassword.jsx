import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    setMessage('');
    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      'Reset link sent. Please check your email.'
    );

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <h1>Forgot Password</h1>

        <p>
          Enter your email address and we'll send
          you a password reset link.
        </p>

        <form onSubmit={handleReset}>

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Sending...'
              : 'Send Reset Link'}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <Link to="/login">
          Back to Login
        </Link>

      </div>
    </div>
  );
}

export default ForgotPassword;
