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

      <div className="contact-header">
        <h2>Contact Us</h2>

        <p>
          Have a question or need assistance?
          Get in touch with Roadex.
        </p>
      </div>

      {/* Quick Contact */}
      <div className="quick-icons">

        <a
          href="https://wa.me/201505516072"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
        >
          <FaWhatsapp />
        </a>

        <a
          href="tel:+201505516072"
          aria-label="Phone"
        >
          <FaPhone />
        </a>

        <a
          href="mailto:info@roadex-eg.com"
          aria-label="Email"
        >
          <FaEnvelope />
        </a>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <FaInstagram />
        </a>

        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <FaFacebook />
        </a>

      </div>

      {/* Contact Form */}
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

        {/* Name + Phone */}
        <div className="form-grid">

          <div>
            <label
              className="form-label"
              htmlFor="full-name"
            >
              Full Name
            </label>

            <input
              id="full-name"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(event) =>
                updateField(
                  'fullName',
                  event.target.value
                )
              }
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label
              className="form-label"
              htmlFor="phone"
            >
              Phone Number
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value
                )
              }
              autoComplete="tel"
              required
            />
          </div>

        </div>

        {/* Email + Address */}
        <div className="form-grid">

          <div>
            <label
              className="form-label"
              htmlFor="email"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
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
          </div>

          <div>
            <label
              className="form-label"
              htmlFor="address"
            >
              Address
            </label>

            <input
              id="address"
              type="text"
              placeholder="Enter your address"
              value={formData.address}
              onChange={(event) =>
                updateField(
                  'address',
                  event.target.value
                )
              }
              autoComplete="street-address"
            />
          </div>

        </div>

        {/* Complaint */}
        {requestType === 'complaint' && (
          <div>

            <label
              className="form-label"
              htmlFor="complaint"
            >
              Complaint Details
            </label>

            <textarea
              id="complaint"
              rows="5"
              placeholder="Tell us about your complaint..."
              value={formData.complaint}
              onChange={(event) =>
                updateField(
                  'complaint',
                  event.target.value
                )
              }
            />

          </div>
        )}

        {/* Inquiry */}
        {requestType === 'inquiry' && (
          <div>

            <label
              className="form-label"
              htmlFor="inquiry"
            >
              Inquiry Details
            </label>

            <textarea
              id="inquiry"
              rows="5"
              placeholder="How can we help you?"
              value={formData.inquiry}
              onChange={(event) =>
                updateField(
                  'inquiry',
                  event.target.value
                )
              }
            />

          </div>
        )}

        <button type="submit">
          Send Message
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