import { useState } from 'react';
import {
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
} from 'react-icons/fa';

import './Contact.css';

function Contact() {
  const [requestType, setRequestType] = useState('inquiry');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    complaint: '',
    inquiry: '',
  });

  const [message, setMessage] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setMessage('Please enter your name and phone number.');
      return;
    }

    if (!formData.email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    if (
      requestType === 'complaint' &&
      !formData.complaint.trim()
    ) {
      setMessage('Please enter your complaint details.');
      return;
    }

    if (
      requestType === 'inquiry' &&
      !formData.inquiry.trim()
    ) {
      setMessage('Please enter your inquiry details.');
      return;
    }

    const subject = encodeURIComponent(
      `Roadex ${requestType}`
    );

    const body = encodeURIComponent(
      [
        `Name: ${formData.fullName}`,
        `Phone: ${formData.phone}`,
        `Email: ${formData.email}`,
        `Address: ${formData.address}`,

        requestType === 'complaint' &&
          `Complaint: ${formData.complaint}`,

        requestType === 'inquiry' &&
          `Inquiry: ${formData.inquiry}`,
      ]
        .filter(Boolean)
        .join('\n')
    );

    window.location.href =
      `mailto:info@roadex-eg.com?subject=${subject}&body=${body}`;

    setMessage('Your email app should open now.');
  };

  return (
    <div className="contact-page">

      <h2
        style={{
          display: 'inline-block',
          fontWeight: '700',
          background:
            'linear-gradient(90deg, #8B6B00 0%, #D4AF37 25%, #FFD700 50%, #F8E58C 75%, #8B6B00 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: '#D4AF37',
        }}
      >
        Contact Us
      </h2>

      <div className="quick-icons">

        <a
          href="https://wa.me/201505516072"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaWhatsapp size={40} color="#25D366" />
        </a>

        <a href="tel:+201505516072">
          <FaPhone size={40} color="#007bff" />
        </a>

        <a href="mailto:info@roadex-eg.com">
          <FaEnvelope size={40} color="#ea4335" />
        </a>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram size={40} color="#E4405F" />
        </a>

        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFacebook size={40} color="#1877F2" />
        </a>

      </div>

      <form
        className="contact-form"
        onSubmit={handleSubmit}
      >

        <label
          className="form-label"
          htmlFor="request-type"
        >
          Request Type
        </label>

        <select
          id="request-type"
          value={requestType}
          onChange={(event) =>
            setRequestType(event.target.value)
          }
        >
          <option value="inquiry">
            Inquiry
          </option>

          <option value="complaint">
            Complaint
          </option>
        </select>

        <label
          className="form-label"
          htmlFor="full-name"
        >
          Full Name
        </label>

        <input
          id="full-name"
          value={formData.fullName}
          onChange={(event) =>
            updateField(
              'fullName',
              event.target.value
            )
          }
          required
        />

        <label
          className="form-label"
          htmlFor="phone"
        >
          Phone Number
        </label>

        <input
          id="phone"
          value={formData.phone}
          onChange={(event) =>
            updateField(
              'phone',
              event.target.value
            )
          }
          required
        />

        <label
          className="form-label"
          htmlFor="email"
        >
          Email Address
        </label>

        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={formData.email}
          onChange={(event) =>
            updateField(
              'email',
              event.target.value
            )
          }
          required
        />

        <label
          className="form-label"
          htmlFor="address"
        >
          Address
        </label>

        <input
          id="address"
          value={formData.address}
          onChange={(event) =>
            updateField(
              'address',
              event.target.value
            )
          }
        />

        {requestType === 'complaint' && (
          <>
            <label
              className="form-label"
              htmlFor="complaint"
            >
              Complaint Details
            </label>

            <textarea
              id="complaint"
              rows="5"
              value={formData.complaint}
              onChange={(event) =>
                updateField(
                  'complaint',
                  event.target.value
                )
              }
            />
          </>
        )}

        {requestType === 'inquiry' && (
          <>
            <label
              className="form-label"
              htmlFor="inquiry"
            >
              Inquiry Details
            </label>

            <textarea
              id="inquiry"
              rows="5"
              value={formData.inquiry}
              onChange={(event) =>
                updateField(
                  'inquiry',
                  event.target.value
                )
              }
            />
          </>
        )}

        <button type="submit">
          Send
        </button>

      </form>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}

    </div>
  );
}

export default Contact; 
