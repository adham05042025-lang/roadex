import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './Register.css';

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (!fullName.trim()) {
      showMessage('Full name is required.', true);
      return;
    }

    if (!email.trim()) {
      showMessage('Email is required.', true);
      return;
    }

    if (!phone) {
      showMessage('Phone number is required.', true);
      return;
    }

    if (phone.length < 10) {
      showMessage('Please enter a complete phone number with country code.', true);
      return;
    }

    if (!password) {
      showMessage('Password is required.', true);
      return;
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.', true);
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', true);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone,
        },
      },
    });

    if (error) {
      showMessage(error.message, true);
      setLoading(false);
      return;
    }

    if (data.user) {
      // تحديث الـ Profile بالرقم
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ phone: phone })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // 🔥 إشعار ترحيبي للعميل
      const { error: welcomeError } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user.id,
          type: 'welcome',
          title: `👋 Welcome to Roadex, ${fullName.trim()}!`,
          message: `Thank you for joining us! 🚗 Start exploring our premium fleet and book your dream car today.`,
          link: `/cars`,
        });

      if (welcomeError) {
        console.error('Welcome notification error:', welcomeError);
      }

      // 🔥 إشعار للأدمن (حساب جديد)
      const { error: adminNotifError } = await supabase
        .from('notifications')
        .insert({
          type: 'new_user',
          title: `👤 New user registered: ${fullName.trim()}`,
          message: `${fullName.trim()} (${email.trim()}) created a new account`,
          link: `/admin/manage-users`,
        });

      if (adminNotifError) {
        console.error('Admin notification error:', adminNotifError);
      }
    }

    showMessage('Account created successfully! Please check your email to confirm.', false);

    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');

    setLoading(false);

    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <div className="register-page">
      <div className="register-card">

        <div className="register-header">
          <h1>Create <span>Account</span></h1>
          <p>Join Roadex and start your journey</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>

          <div className="register-field">
            <label htmlFor="full-name">Full Name</label>
            <input
              id="full-name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="phone">Phone Number</label>
            <PhoneInput
              id="phone"
              international
              defaultCountry="EG"
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
              className="phone-input"
            />
            <small className="register-hint">
              Include your country code (e.g., +20 for Egypt)
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <div className={`register-message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        <div className="register-login">
          <span>Already have an account?</span>
          <Link to="/login">Sign In</Link>
        </div>

      </div>
    </div>
  );
}

export default Register;