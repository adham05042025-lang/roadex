import { useState } from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaInstagram, FaFacebook, FaSun, FaMoon } from 'react-icons/fa';
import './Contact.css';

const carTypes = ['Luxury', 'Economy', 'Van', 'SUV', 'Limousine'];

function Contact() {
  const [isLight, setIsLight] = useState(false);
  const [requestType, setRequestType] = useState('booking');
  const [sameDestination, setSameDestination] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    carType: '',
    carName: '',
    startLocation: '',
    endLocation: '',
    date: '',
    time: '',
    complaint: '',
    inquiry: '',
  });
  const [message, setMessage] = useState('');

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (message) setMessage('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setMessage('Please enter your name and phone number.');
      return;
    }

    if (requestType === 'booking') {
      if (!formData.carType || !formData.carName || !formData.startLocation || !formData.date || !formData.time) {
        setMessage('Please complete all booking fields.');
        return;
      }
    }

    if (requestType === 'complaint') {
      if (!formData.email.trim() || !formData.complaint.trim()) {
        setMessage('Please enter your email and complaint details.');
        return;
      }
    }

    if (requestType === 'inquiry') {
      if (!formData.email.trim() || !formData.inquiry.trim()) {
        setMessage('Please enter your email and inquiry details.');
        return;
      }
    }

    const subject = encodeURIComponent(`Roadex ${requestType}`);
    const body = encodeURIComponent(
      [
        `Name: ${formData.fullName}`,
        `Phone: ${formData.phone}`,
        `Email: ${formData.email}`,
        `Address: ${formData.address}`,
        requestType === 'booking' && `Car Type: ${formData.carType}`,
        requestType === 'booking' && `Car Name: ${formData.carName}`,
        requestType === 'booking' && `Start: ${formData.startLocation}`,
        requestType === 'booking' && `End: ${sameDestination ? formData.startLocation : formData.endLocation}`,
        requestType === 'booking' && `Date: ${formData.date}`,
        requestType === 'booking' && `Time: ${formData.time}`,
        requestType === 'complaint' && `Complaint: ${formData.complaint}`,
        requestType === 'inquiry' && `Inquiry: ${formData.inquiry}`,
      ]
        .filter(Boolean)
        .join('\n')
    );

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
        <label className="form-label" htmlFor="request-type">
          Request Type
        </label>
        <select id="request-type" value={requestType} onChange={(event) => setRequestType(event.target.value)}>
          <option value="booking">Booking</option>
          <option value="inquiry">Inquiry</option>
          <option value="complaint">Complaint</option>
        </select>

        <label className="form-label" htmlFor="full-name">
          Full Name
        </label>
        <input id="full-name" value={formData.fullName} onChange={(event) => updateField('fullName', event.target.value)} required />

        <label className="form-label" htmlFor="phone">
          Phone Number
        </label>
        <input id="phone" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} required />

        <label className="form-label" htmlFor="email">
          Email Address
        </label>
        <input id="email" type="email" inputMode="email" autoComplete="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} />

        <label className="form-label" htmlFor="address">
          Address
        </label>
        <input id="address" value={formData.address} onChange={(event) => updateField('address', event.target.value)} />

        {requestType === 'booking' ? (
          <>
            <label className="form-label" htmlFor="car-type">
              Car Type
            </label>
            <select id="car-type" value={formData.carType} onChange={(event) => updateField('carType', event.target.value)}>
              <option value="">Select</option>
              {carTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="form-label" htmlFor="car-name">
              Car Name
            </label>
            <input id="car-name" value={formData.carName} onChange={(event) => updateField('carName', event.target.value)} placeholder="Write the car name manually" />

            <label className="form-label" htmlFor="start-location">
              Start Point
            </label>
            <input id="start-location" value={formData.startLocation} onChange={(event) => updateField('startLocation', event.target.value)} />

            <label className="form-checkbox">
              <input type="checkbox" checked={sameDestination} onChange={(event) => setSameDestination(event.target.checked)} />
              <span>End point is the same as the start point</span>
            </label>

            {!sameDestination ? (
              <>
                <label className="form-label" htmlFor="end-location">
                  End Point
                </label>
                <input id="end-location" value={formData.endLocation} onChange={(event) => updateField('endLocation', event.target.value)} />
              </>
            ) : null}

            <div className="form-grid">
              <div>
                <label className="form-label" htmlFor="date">
                  Date
                </label>
                <input id="date" type="date" value={formData.date} onChange={(event) => updateField('date', event.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="time">
                  Time
                </label>
                <input id="time" type="time" value={formData.time} onChange={(event) => updateField('time', event.target.value)} />
              </div>
            </div>
          </>
        ) : null}

        {requestType === 'complaint' ? (
          <>
            <label className="form-label" htmlFor="complaint">
              Complaint Details
            </label>
            <textarea id="complaint" rows="4" value={formData.complaint} onChange={(event) => updateField('complaint', event.target.value)} />
          </>
        ) : null}

        {requestType === 'inquiry' ? (
          <>
            <label className="form-label" htmlFor="inquiry">
              Inquiry Details
            </label>
            <textarea id="inquiry" rows="4" value={formData.inquiry} onChange={(event) => updateField('inquiry', event.target.value)} />
          </>
        ) : null}

        <button type="submit">Send</button>
      </form>

      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}

export default Contact;