import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Booking.css';

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const { car, pickupAt, returnAt } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  useEffect(() => {
    if (car && pickupAt && returnAt) {
      calculateEstimatedPrice();
    }
  }, [car, pickupAt, returnAt]);

  const calculateEstimatedPrice = () => {
    const pickup = new Date(pickupAt);
    const returnDate = new Date(returnAt);

    const difference = returnDate - pickup;

    const days = Math.max(
      1,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );

    setEstimatedPrice(days * Number(car.price_per_day));
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
      state: {
        bookingCreated: true,
        bookingId: data,
      },
    });
  };

  if (!car || !pickupAt || !returnAt) {
    return (
      <div className="booking-page">
        <div className="booking-empty">
          <h1>No Car Selected</h1>

          <p>
            Please choose a car and rental time before continuing.
          </p>

          <button
            type="button"
            onClick={() => navigate('/cars')}
          >
            Browse Cars
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">

      <div className="booking-header">
        <h1>Confirm Your Booking</h1>

        <p>
          Review your rental information before confirming.
        </p>
      </div>

      <div className="booking-layout">

        <div className="booking-car-card">

          {car.image_url ? (
            <img
              src={car.image_url}
              alt={`${car.brand} ${car.model}`}
              className="booking-car-image"
            />
          ) : (
            <div className="booking-no-image">
              No image available
            </div>
          )}

          <div className="booking-car-info">
            <h2>
              {car.brand} {car.model}
            </h2>

            <p>Year: {car.year}</p>

            <p className="booking-price">
              {car.price_per_day} EGP / day
            </p>
          </div>

        </div>

        <div className="booking-summary">

          <h2>Rental Summary</h2>

          <div className="booking-summary-row">
            <span>Pickup</span>

            <strong>
              {new Date(pickupAt).toLocaleString()}
            </strong>
          </div>

          <div className="booking-summary-row">
            <span>Return</span>

            <strong>
              {new Date(returnAt).toLocaleString()}
            </strong>
          </div>

          <div className="booking-summary-row total">
            <span>Estimated Total</span>

            <strong>
              {estimatedPrice} EGP
            </strong>
          </div>

          <p className="booking-note">
            The final price is calculated securely by the database
            when the booking is confirmed.
          </p>

          {message && (
            <p className="booking-message">
              {message}
            </p>
          )}

          <button
            type="button"
            className="confirm-booking-button"
            onClick={confirmBooking}
            disabled={loading}
          >
            {loading
              ? 'Confirming Booking...'
              : 'Confirm Booking'}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Go Back
          </button>

        </div>

      </div>

    </div>
  );
}

export default Booking;
