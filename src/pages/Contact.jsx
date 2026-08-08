import { useState } from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaSun, FaMoon } from 'react-icons/fa';
import './Contact.css';

function Contact() {
  const [isLight, setIsLight] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    const subject = encodeURIComponent('Roadex Inquiry');
    const body = encodeURIComponent(`Hello Roadex,\n\nI would like to contact you.\nEmail: ${email}`);

    window.location.href = `mailto:info@roadex-eg.com?subject=${subject}&body=${body}`;
    setMessage('Your email app should open now.');
  };

  return (
    <div className={`contact-page ${isLight ? 'light' : 'dark'}`}>
      <button className="theme-toggle" onClick={() => setIsLight(!isLight)}>
        {isLight ? <FaMoon /> : <FaSun />}
      </button>

      <h2
        style={{
          display: 'inline-block',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #8B6B00 0%, #D4AF37 25%, #FFD700 50%, #F8E58C 75%, #8B6B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: '#D4AF37',
        }}
      >
        Contact Us
      </h2>

      <div className="quick-icons">
        <a href="https://wa.me/+201505516072" target="_blank" rel="noopener noreferrer">
          <FaWhatsapp size={40} color="#25D366" />
        </a>
        <a href="tel:+201505516072">
          <FaPhone size={40} color="#007bff" />
        </a>
        <a href="mailto:info@roadex-eg.com">
          <FaEnvelope size={40} color="#ea4335" />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram size={40} color="#E4405F" />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebook size={40} color="#1877F2" />
        </a>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label htmlFor="contact-email" className="form-label">
          Email Address
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (message) setMessage('');
          }}
          required
        />
        <button type="submit">Send</button>
      </form>

      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}

export default Contact;