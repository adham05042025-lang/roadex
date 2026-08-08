import { useState } from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaSun, FaMoon } from 'react-icons/fa';
import './Contact.css';

function Contact() {
  const [isLight, setIsLight] = useState(false);

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
        <a href="https://wa.me/+201505516072 " target="_blank" rel="noopener noreferrer">
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
    </div>
  );
}

export default Contact;