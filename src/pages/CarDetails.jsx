import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import './CarDetails.css';

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [pickupAt, setPickupAt] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    loadCar();
  }, [id]);

  const loadCar = async () => {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      setMessage('Car not found.');
      setLoading(false);
      return;
    }

    setCar(data);
    setLoading(false);
  };

  const checkAvailability = async () => {
    setMessage('');
    setAvailableQuantity(null);

    if (!pickupAt || !returnAt) {
      setMessage('Please select pickup and return date/time.');
      return;
    }

    if (new Date(returnAt) <= new Date(pickupAt)) {
      setMessage('Return time must be after pickup time.');
      return;
    }

    setChecking(true);

    const { data, error } = await supabase.rpc(
      'get_available_quantity',
      {
        p_car_id: id,
        p_pickup_at: new Date(pickupAt).toISOString(),
        p_return_at: new Date(returnAt).toISOString(),
      }
    );

    if (error) {
      setMessage(error.message);
      setChecking(false);
      return;
    }

    setAvailableQuantity(data);
    setChecking(false);
  };

  const goToBooking = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      navigate('/login');
      return;
    }

    if (!pickupAt || !returnAt) {
      setMessage('Please select pickup and return date/time.');
      return;
    }

    if (availableQuantity === null) {
      setMessage('Please check availability first.');
      return;
    }

    if (availableQuantity <= 0) {
      setMessage('This car is not available for the selected time.');
      return;
    }

    navigate('/booking', {
      state: {
        car,
        pickupAt,
        returnAt,
      },
    });
  };

  if (loading) {
    return (
      <div className="car-details-page">
        <p>Loading car...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="car-details-page">
        <p>{message || 'Car not found.'}</p>
      </div>
    );
  }

  return (
    <div className="car-details-page">

      <div className="car-details-grid">

        {/* Car Image */}
        <div className="car-details-image-area">

          {car.image_url ? (
            <button
              type="button"
              className="car-image-button"
              onClick={() => setImageOpen(true)}
              aria-label={`View larger image of ${car.brand} ${car.model}`}
            >
              <img
                src={car.image_url}
                alt={`${car.brand} ${car.model}`}
                className="car-details-image"
              />

              <div className="car-zoom-overlay">
                <span className="car-zoom-icon">⌕</span>
                <span>View image</span>
              </div>
            </button>
          ) : (
            <div className="car-details-no-image">
              No image available
            </div>
          )}

        </div>

        {/* Car Information */}
        <div className="car-details-content">

          <h1>
            {car.brand} {car.model}
          </h1>

          {/* Year */}
          <p className="car-details-year">
            Year: {car.year}
          </p>

          {/* Category & Type */}
          <div className="car-details-tags">

            {car.category && (
              <span>
                Category: {car.category}
              </span>
            )}

            {car.car_type && (
              <span>
                Type: {car.car_type}
              </span>
            )}

          </div>

          {/* Prices */}
          <div className="car-details-prices">

            <div className="car-details-price-box">
              <span>Rental Price</span>

              <strong>
                {car.price_per_day} EGP
                <small>/day</small>
              </strong>
            </div>

            <div className="car-details-price-box">
              <span>With Driver</span>

              <strong>
                {car.driver_price_per_day != null
                  ? `${car.driver_price_per_day} EGP`
                  : 'Not available'}

                {car.driver_price_per_day != null && (
                  <small>/day</small>
                )}
              </strong>
            </div>

          </div>

          {/* Quantity */}
          <p className="car-details-quantity">
            {availableQuantity === null
              ? `Available cars: ${car.quantity}`
              : `Available cars for selected time: ${availableQuantity}`}
          </p>

          {/* Description */}
          {car.description && (
            <p className="car-details-description">
              {car.description}
            </p>
          )}

          {/* Booking */}
          <div className="booking-date-section">

            <h2>Choose Rental Time</h2>

            <label>
              Pickup Date & Time

              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => {
                  setPickupAt(e.target.value);
                  setAvailableQuantity(null);
                }}
              />
            </label>

            <label>
              Return Date & Time

              <input
                type="datetime-local"
                value={returnAt}
                onChange={(e) => {
                  setReturnAt(e.target.value);
                  setAvailableQuantity(null);
                }}
              />
            </label>

            <button
              type="button"
              className="check-availability-button"
              onClick={checkAvailability}
              disabled={checking}
            >
              {checking
                ? 'Checking...'
                : 'Check Availability'}
            </button>

            {availableQuantity !== null && (
              <div className="availability-result">

                {availableQuantity > 0 ? (
                  <p>
                    Available cars:{' '}
                    <strong>
                      {availableQuantity}
                    </strong>
                  </p>
                ) : (
                  <p>
                    No cars available for this time.
                  </p>
                )}

              </div>
            )}

            {message && (
              <p className="car-details-message">
                {message}
              </p>
            )}

            <button
              type="button"
              className="book-now-button"
              onClick={goToBooking}
            >
              Book This Car
            </button>

          </div>

        </div>

      </div>

      {/* Image Modal */}
      {imageOpen && car.image_url && (
        <div
          className="image-modal"
          onClick={() => setImageOpen(false)}
        >

          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              type="button"
              className="image-modal-close"
              onClick={() => setImageOpen(false)}
              aria-label="Close image"
            >
              ×
            </button>

            <img
              src={car.image_url}
              alt={`${car.brand} ${car.model}`}
              className="image-modal-image"
            />

          </div>

        </div>
      )}

    </div>
  );
}

export default CarDetails;