import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './AdminAddBooking.css';

function AdminAddBooking() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);

  const [customerId, setCustomerId] = useState('');
  const [carId, setCarId] = useState('');
  const [pickupAt, setPickupAt] = useState('');
  const [returnAt, setReturnAt] = useState('');

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const loadPageData = async () => {
    setLoadingData(true);
    setMessage('');

    const [customersResult, carsResult] =
      await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            phone,
            role
          `)
          .eq('role', 'user')
          .order('full_name', {
            ascending: true,
          }),

        supabase
          .from('cars')
          .select(`
            id,
            brand,
            model,
            year,
            price_per_day,
            quantity,
            image_url
          `)
          .gt('quantity', 0)
          .order('brand', {
            ascending: true,
          }),
      ]);

    if (customersResult.error) {
      showMessage(
        `Could not load customers: ${
          customersResult.error.message
        }`,
        true
      );

      setCustomers([]);
      setCars(carsResult.data || []);
      setLoadingData(false);
      return;
    }

    if (carsResult.error) {
      showMessage(
        `Could not load cars: ${
          carsResult.error.message
        }`,
        true
      );

      setCustomers(customersResult.data || []);
      setCars([]);
      setLoadingData(false);
      return;
    }

    setCustomers(customersResult.data || []);
    setCars(carsResult.data || []);
    setLoadingData(false);
  };

  const selectedCustomer = useMemo(() => {
    return customers.find(
      (customer) => customer.id === customerId
    );
  }, [customers, customerId]);

  const selectedCar = useMemo(() => {
    return cars.find(
      (car) => car.id === carId
    );
  }, [cars, carId]);

  const estimatedDays = useMemo(() => {
    if (!pickupAt || !returnAt) {
      return 0;
    }

    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);

    const difference =
      returnDate.getTime() - pickupDate.getTime();

    if (difference <= 0) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil(
        difference / (1000 * 60 * 60 * 24)
      )
    );
  }, [pickupAt, returnAt]);

  const estimatedPrice = useMemo(() => {
    if (!selectedCar || estimatedDays === 0) {
      return 0;
    }

    return (
      estimatedDays *
      Number(selectedCar.price_per_day || 0)
    );
  }, [selectedCar, estimatedDays]);

  const minimumDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(
      now.getMinutes() - now.getTimezoneOffset()
    );

    return now.toISOString().slice(0, 16);
  }, []);

  const handleCreateBooking = async (event) => {
    event.preventDefault();

    setMessage('');
    setIsError(false);

    if (
      !customerId ||
      !carId ||
      !pickupAt ||
      !returnAt
    ) {
      showMessage(
        'Please select a customer, car, pickup time and return time.',
        true
      );
      return;
    }

    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);

    if (
      Number.isNaN(pickupDate.getTime()) ||
      Number.isNaN(returnDate.getTime())
    ) {
      showMessage(
        'Please enter valid pickup and return times.',
        true
      );
      return;
    }

    if (returnDate <= pickupDate) {
      showMessage(
        'Return time must be after pickup time.',
        true
      );
      return;
    }

    if (pickupDate < new Date()) {
      showMessage(
        'Pickup time cannot be in the past.',
        true
      );
      return;
    }

    const confirmed = window.confirm(
      `Create this booking?\n\n` +
        `Customer: ${
          selectedCustomer?.full_name ||
          'Selected customer'
        }\n` +
        `Car: ${
          selectedCar
            ? `${selectedCar.brand} ${selectedCar.model}`
            : 'Selected car'
        }\n` +
        `Estimated total: ${estimatedPrice.toLocaleString()} EGP`
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc(
      'admin_create_booking',
      {
        p_user_id: customerId,
        p_car_id: carId,
        p_pickup_at: pickupDate.toISOString(),
        p_return_at: returnDate.toISOString(),
      }
    );

    if (error) {
      showMessage(error.message, true);
      setSubmitting(false);
      return;
    }

    showMessage(
      `Booking created successfully. Booking ID: ${data}`
    );

    setCustomerId('');
    setCarId('');
    setPickupAt('');
    setReturnAt('');

    setSubmitting(false);
  };

  if (loadingData) {
    return (
      <div className="admin-add-booking-page">
        <div className="admin-add-booking-loading">
          Loading customers and cars...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-add-booking-page">
      <div className="admin-add-booking-header">
        <div>
          <h1>Add Booking</h1>

          <p>
            Create a new car reservation for a
            customer.
          </p>
        </div>

        <div className="admin-add-booking-actions">
          <button
            type="button"
            className="admin-booking-secondary-button"
            onClick={loadPageData}
            disabled={submitting}
          >
            Refresh
          </button>

          <button
            type="button"
            className="admin-booking-secondary-button"
            onClick={() => navigate('/admin')}
            disabled={submitting}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message && (
        <div
          className={
            isError
              ? 'admin-add-booking-message error'
              : 'admin-add-booking-message success'
          }
        >
          {message}
        </div>
      )}

      <div className="admin-add-booking-layout">
        <form
          className="admin-add-booking-card"
          onSubmit={handleCreateBooking}
        >
          <h2>Booking Information</h2>

          <div className="admin-booking-field">
            <label htmlFor="booking-customer">
              Customer
            </label>

            <select
              id="booking-customer"
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setMessage('');
              }}
              required
            >
              <option value="">
                Select a customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.full_name ||
                    'Unnamed Customer'}
                  {customer.phone
                    ? ` — ${customer.phone}`
                    : ''}
                </option>
              ))}
            </select>

            {customers.length === 0 && (
              <small className="admin-booking-warning">
                No customer accounts were found. Add
                a customer from Manage Users first.
              </small>
            )}
          </div>

          <div className="admin-booking-field">
            <label htmlFor="booking-car">
              Car
            </label>

            <select
              id="booking-car"
              value={carId}
              onChange={(event) => {
                setCarId(event.target.value);
                setMessage('');
              }}
              required
            >
              <option value="">
                Select a car
              </option>

              {cars.map((car) => (
                <option
                  key={car.id}
                  value={car.id}
                >
                  {car.brand} {car.model}
                  {' — '}
                  {Number(
                    car.price_per_day
                  ).toLocaleString()}{' '}
                  EGP/day
                  {' — '}
                  Quantity: {car.quantity}
                </option>
              ))}
            </select>

            {cars.length === 0 && (
              <small className="admin-booking-warning">
                No cars with available stock were
                found.
              </small>
            )}
          </div>

          <div className="admin-booking-date-grid">
            <div className="admin-booking-field">
              <label htmlFor="admin-pickup-at">
                Pickup Date and Time
              </label>

              <input
                id="admin-pickup-at"
                type="datetime-local"
                value={pickupAt}
                min={minimumDateTime}
                onChange={(event) => {
                  setPickupAt(event.target.value);
                  setMessage('');
                }}
                required
              />
            </div>

            <div className="admin-booking-field">
              <label htmlFor="admin-return-at">
                Return Date and Time
              </label>

              <input
                id="admin-return-at"
                type="datetime-local"
                value={returnAt}
                min={pickupAt || minimumDateTime}
                onChange={(event) => {
                  setReturnAt(event.target.value);
                  setMessage('');
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="admin-create-booking-button"
            disabled={
              submitting ||
              customers.length === 0 ||
              cars.length === 0
            }
          >
            {submitting
              ? 'Creating Booking...'
              : 'Create Booking'}
          </button>
        </form>

        <section className="admin-add-booking-card admin-booking-summary">
          <h2>Booking Summary</h2>

          {selectedCar?.image_url ? (
            <img
              src={selectedCar.image_url}
              alt={`${selectedCar.brand} ${selectedCar.model}`}
              className="admin-booking-car-image"
            />
          ) : (
            <div className="admin-booking-no-image">
              {selectedCar
                ? 'No image available'
                : 'Select a car'}
            </div>
          )}

          <div className="admin-booking-summary-row">
            <span>Customer</span>

            <strong>
              {selectedCustomer?.full_name ||
                'Not selected'}
            </strong>
          </div>

          <div className="admin-booking-summary-row">
            <span>Phone</span>

            <strong>
              {selectedCustomer?.phone ||
                'Not available'}
            </strong>
          </div>

          <div className="admin-booking-summary-row">
            <span>Car</span>

            <strong>
              {selectedCar
                ? `${selectedCar.brand} ${selectedCar.model}`
                : 'Not selected'}
            </strong>
          </div>

          <div className="admin-booking-summary-row">
            <span>Pickup</span>

            <strong>
              {pickupAt
                ? new Date(
                    pickupAt
                  ).toLocaleString()
                : 'Not selected'}
            </strong>
          </div>

          <div className="admin-booking-summary-row">
            <span>Return</span>

            <strong>
              {returnAt
                ? new Date(
                    returnAt
                  ).toLocaleString()
                : 'Not selected'}
            </strong>
          </div>

          <div className="admin-booking-summary-row">
            <span>Rental Days</span>

            <strong>
              {estimatedDays || 0}
            </strong>
          </div>

          <div className="admin-booking-summary-row total">
            <span>Estimated Total</span>

            <strong>
              {estimatedPrice.toLocaleString()} EGP
            </strong>
          </div>

          <p className="admin-booking-note">
            Availability and the final price are
            checked securely by the database when the
            booking is created.
          </p>
        </section>
      </div>
    </div>
  );
}

export default AdminAddBooking;
