import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './Booking.css';

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { car, pickupAt, returnAt } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [rentalDays, setRentalDays] = useState(1);
  const [rentalHours, setRentalHours] = useState(0);

  useEffect(() => {
    if (car && pickupAt && returnAt) {
      calculateEstimatedPrice();
    }
  }, [car, pickupAt, returnAt]);

  const calculateEstimatedPrice = () => {
    const pickup = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const difference = returnDate - pickup;
    const hours = difference / (1000 * 60 * 60);
    let days;
    if (hours <= 12) {
      days = 1;
    } else {
      days = Math.ceil(hours / 12);
    }
    const totalPerDay = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
    const totalPrice = days * totalPerDay;
    setRentalDays(days);
    setRentalHours(Math.round(hours * 10) / 10);
    setEstimatedPrice(totalPrice);
  };

  const confirmBooking = async () => {
    setMessage('');
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      navigate('/login');
      return;
    }
    if (!car || !pickupAt || !returnAt) {
      setMessage('Booking information is missing.');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc('create_booking', {
      p_car_id: car.id,
      p_pickup_at: new Date(pickupAt).toISOString(),
      p_return_at: new Date(returnAt).toISOString(),
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/my-bookings', {
      state: { bookingCreated: true, bookingId: data },
    });
  };

  if (!car || !pickupAt || !returnAt) {
    return (
      <div className="booking-page">
        <div className="booking-empty">
          <h1>No Car Selected</h1>
          <p>Please choose a car and rental time before continuing.</p>
          <button type="button" onClick={() => navigate('/cars')}>Browse Cars</button>
        </div>
      </div>
    );
  }

  const totalPerDay = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>Confirm Your Booking</h1>
        <p>Review your rental information before confirming.</p>
      </div>

      <div className="booking-layout">
        <div className="booking-car-card">
          {car.image_url ? (
            <img src={car.image_url} alt={`${car.brand} ${car.model}`} className="booking-car-image" />
          ) : (
            <div className="booking-no-image">No image available</div>
          )}
          <div className="booking-car-info">
            <h2>{car.brand} {car.model}</h2>
            <p>Year: {car.year}</p>
            <p className="booking-price">
              {totalPerDay.toLocaleString()} EGP / day
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>(Car + Driver) — 12 hours = 1 day</small>
            </p>
          </div>
        </div>

        <div className="booking-summary">
          <h2>Rental Summary</h2>
          <div className="booking-summary-row">
            <span>Pickup</span>
            <strong>{formatDate24(pickupAt)}</strong>
          </div>
          <div className="booking-summary-row">
            <span>Return</span>
            <strong>{formatDate24(returnAt)}</strong>
          </div>
          <div className="booking-summary-row">
            <span>Total Duration</span>
            <strong>{rentalHours} hours</strong>
          </div>
          <div className="booking-summary-row">
            <span>Rental Days</span>
            <strong>
              {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>(12 hours = 1 day)</small>
            </strong>
          </div>
          <div className="booking-summary-row">
            <span>Price Per Day</span>
            <strong>
              {totalPerDay.toLocaleString()} EGP
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>(Car + Driver)</small>
            </strong>
          </div>
          <div className="booking-summary-row">
            <span>Total Rental</span>
            <strong>{totalPerDay.toLocaleString()} EGP × {rentalDays}</strong>
          </div>
          <div className="booking-summary-row total">
            <span>Estimated Total</span>
            <strong>{estimatedPrice.toLocaleString()} EGP</strong>
          </div>
          <p className="booking-note">
            The final price is calculated securely by the database when the booking is confirmed.
            <br />
            <small style={{ color: '#888' }}>Note: 12 hours = 1 rental day. Price includes Car + Driver.</small>
          </p>
          {message && <p className="booking-message">{message}</p>}
          <button type="button" className="confirm-booking-button" onClick={confirmBooking} disabled={loading}>
            {loading ? 'Confirming Booking...' : 'Confirm Booking'}
          </button>
          <button type="button" className="back-button" onClick={() => navigate(-1)} disabled={loading}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default Booking;