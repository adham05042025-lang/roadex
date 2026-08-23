import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './AdminAddBooking.css';

function AdminAddBooking() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [carId, setCarId] = useState('');
  const [pickupAt, setPickupAt] = useState('');
  const [returnAt, setReturnAt] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [customerExtraPhone, setCustomerExtraPhone] = useState('');
  const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(-1);
  const driverInputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (driverName.trim().length > 0) {
      const filtered = drivers.filter((driver) =>
        driver.name.toLowerCase().includes(driverName.toLowerCase())
      );
      setFilteredDrivers(filtered);
      setShowDriverSuggestions(filtered.length > 0);
      setSelectedDriverIndex(-1);
    } else {
      setFilteredDrivers([]);
      setShowDriverSuggestions(false);
      if (driverPhone) setDriverPhone('');
    }
  }, [driverName, drivers]);

  const selectDriver = (driver) => {
    setDriverName(driver.name);
    setDriverPhone(driver.phone);
    setShowDriverSuggestions(false);
    setFilteredDrivers([]);
    if (driverInputRef.current) {
      driverInputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!showDriverSuggestions || filteredDrivers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedDriverIndex((prev) => prev < filteredDrivers.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedDriverIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedDriverIndex >= 0) {
      e.preventDefault();
      selectDriver(filteredDrivers[selectedDriverIndex]);
    } else if (e.key === 'Escape') {
      setShowDriverSuggestions(false);
    }
  };

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const loadPageData = async () => {
    setLoadingData(true);
    setMessage('');
    const [customersResult, carsResult, driversResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, role').eq('role', 'user').order('full_name', { ascending: true }),
      supabase.from('cars').select('id, brand, model, year, price_per_day, driver_price_per_day, quantity, image_url').gt('quantity', 0).order('brand', { ascending: true }),
      supabase.from('drivers').select('id, name, phone').order('name', { ascending: true }),
    ]);
    if (customersResult.error) {
      showMessage(`Could not load customers: ${customersResult.error.message}`, true);
      setCustomers([]);
      setCars(carsResult.data || []);
      setDrivers(driversResult.data || []);
      setLoadingData(false);
      return;
    }
    if (carsResult.error) {
      showMessage(`Could not load cars: ${carsResult.error.message}`, true);
      setCustomers(customersResult.data || []);
      setCars([]);
      setDrivers(driversResult.data || []);
      setLoadingData(false);
      return;
    }
    setCustomers(customersResult.data || []);
    setCars(carsResult.data || []);
    setDrivers(driversResult.data || []);
    setLoadingData(false);
  };

  const saveDriverIfNew = async (name, phone) => {
    if (!name.trim() || !phone.trim()) return null;
    const existing = drivers.find((d) => d.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;
    const { data, error } = await supabase
      .from('drivers')
      .insert({ name: name.trim(), phone: phone.trim() })
      .select()
      .single();
    if (error) {
      console.error('Error saving driver:', error);
      return null;
    }
    setDrivers((prev) => [...prev, data]);
    return data;
  };

  const selectedCustomer = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const selectedCar = useMemo(() => cars.find((c) => c.id === carId), [cars, carId]);

  const estimatedDays = useMemo(() => {
    if (!pickupAt || !returnAt) return 0;
    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const difference = returnDate.getTime() - pickupDate.getTime();
    const hours = difference / (1000 * 60 * 60);
    if (difference <= 0) return 0;
    if (hours <= 12) return 1;
    return Math.ceil(hours / 12);
  }, [pickupAt, returnAt]);

  const estimatedPrice = useMemo(() => {
    if (!selectedCar || estimatedDays === 0) return 0;
    const totalPerDay = Number(selectedCar.price_per_day) + Number(selectedCar.driver_price_per_day || 0);
    return estimatedDays * totalPerDay;
  }, [selectedCar, estimatedDays]);

  const totalPerDay = useMemo(() => {
    if (!selectedCar) return 0;
    return Number(selectedCar.price_per_day) + Number(selectedCar.driver_price_per_day || 0);
  }, [selectedCar]);

  const minimumDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const handleCreateBooking = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);
    if (!customerId || !carId || !pickupAt || !returnAt) {
      showMessage('Please select a customer, car, pickup time and return time.', true);
      return;
    }
    const pickupDate = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    if (Number.isNaN(pickupDate.getTime()) || Number.isNaN(returnDate.getTime())) {
      showMessage('Please enter valid pickup and return times.', true);
      return;
    }
    if (returnDate <= pickupDate) {
      showMessage('Return time must be after pickup time.', true);
      return;
    }
    if (pickupDate < new Date()) {
      showMessage('Pickup time cannot be in the past.', true);
      return;
    }
    let driverId = null;
    if (driverName.trim() && driverPhone.trim()) {
      const savedDriver = await saveDriverIfNew(driverName, driverPhone);
      if (savedDriver) driverId = savedDriver.id;
    }
    const confirmed = window.confirm(
      `Create this booking?\n\nCustomer: ${selectedCustomer?.full_name || 'Selected customer'}\nCar: ${selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'Selected car'}\nDriver: ${driverName || 'Not assigned'}\nEstimated total: ${estimatedPrice.toLocaleString()} EGP`
    );
    if (!confirmed) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc('admin_create_booking', {
      p_user_id: customerId,
      p_car_id: carId,
      p_pickup_at: pickupDate.toISOString(),
      p_return_at: returnDate.toISOString(),
      p_driver_name: driverName.trim() || null,
      p_driver_phone: driverPhone.trim() || null,
      p_customer_extra_phone: customerExtraPhone.trim() || null,
    });
    if (error) {
      showMessage(error.message, true);
      setSubmitting(false);
      return;
    }
    showMessage(`Booking created successfully. Booking ID: ${data}`);
    setCustomerId('');
    setCarId('');
    setPickupAt('');
    setReturnAt('');
    setDriverName('');
    setDriverPhone('');
    setCustomerExtraPhone('');
    setShowDriverSuggestions(false);
    setSubmitting(false);
  };

  if (loadingData) {
    return (
      <div className="admin-add-booking-page">
        <div className="admin-add-booking-loading">Loading customers and cars...</div>
      </div>
    );
  }

  return (
    <div className="admin-add-booking-page">
      <div className="admin-add-booking-header">
        <div>
          <h1>Add Booking</h1>
          <p>Create a new car reservation for a customer.</p>
        </div>
        <div className="admin-add-booking-actions">
          <button type="button" className="admin-booking-secondary-button" onClick={loadPageData} disabled={submitting}>Refresh</button>
          <button type="button" className="admin-booking-secondary-button" onClick={() => navigate('/admin')} disabled={submitting}>Back to Dashboard</button>
        </div>
      </div>

      {message && (
        <div className={isError ? 'admin-add-booking-message error' : 'admin-add-booking-message success'}>
          {message}
        </div>
      )}

      <div className="admin-add-booking-layout">
        <form className="admin-add-booking-card" onSubmit={handleCreateBooking}>
          <h2>Booking Information</h2>

          <div className="admin-booking-field">
            <label htmlFor="booking-customer">Customer</label>
            <select id="booking-customer" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setMessage(''); }} required>
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name || 'Unnamed Customer'}{customer.phone ? ` — ${customer.phone}` : ''}
                </option>
              ))}
            </select>
            {customers.length === 0 && <small className="admin-booking-warning">No customer accounts were found. Add a customer from Manage Users first.</small>}
          </div>

          <div className="admin-booking-field">
            <label htmlFor="booking-car">Car</label>
            <select id="booking-car" value={carId} onChange={(e) => { setCarId(e.target.value); setMessage(''); }} required>
              <option value="">Select a car</option>
              {cars.map((car) => {
                const total = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
                return (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} — {total.toLocaleString()} EGP/day (Car + Driver) — Qty: {car.quantity}
                  </option>
                );
              })}
            </select>
            {cars.length === 0 && <small className="admin-booking-warning">No cars with available stock were found.</small>}
          </div>

          <div className="admin-booking-field driver-field">
            <label htmlFor="driver-name">Driver Name</label>
            <div className="driver-input-wrapper">
              <input
                id="driver-name"
                ref={driverInputRef}
                type="text"
                placeholder="Start typing driver name..."
                value={driverName}
                onChange={(e) => { setDriverName(e.target.value); setMessage(''); }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (driverName.trim().length > 0) {
                    const filtered = drivers.filter((d) => d.name.toLowerCase().includes(driverName.toLowerCase()));
                    if (filtered.length > 0) { setFilteredDrivers(filtered); setShowDriverSuggestions(true); }
                  }
                }}
                onBlur={() => setTimeout(() => setShowDriverSuggestions(false), 200)}
                autoComplete="off"
              />
              {showDriverSuggestions && filteredDrivers.length > 0 && (
                <div className="driver-suggestions">
                  {filteredDrivers.map((driver, index) => (
                    <div
                      key={driver.id}
                      ref={(el) => (suggestionRefs.current[index] = el)}
                      className={`driver-suggestion-item ${index === selectedDriverIndex ? 'active' : ''}`}
                      onMouseDown={(e) => { e.preventDefault(); selectDriver(driver); }}
                      onMouseEnter={() => setSelectedDriverIndex(index)}
                    >
                      <span className="driver-suggestion-name">{driver.name}</span>
                      <span className="driver-suggestion-phone">{driver.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <small className="admin-booking-hint">Type to search existing drivers. New drivers will be saved automatically.</small>
          </div>

          <div className="admin-booking-field">
            <label htmlFor="driver-phone">Driver Phone</label>
            <input id="driver-phone" type="text" placeholder="Enter driver phone number" value={driverPhone} onChange={(e) => { setDriverPhone(e.target.value); setMessage(''); }} />
          </div>

          <div className="admin-booking-field">
            <label htmlFor="customer-extra-phone">Customer Extra Phone</label>
            <input id="customer-extra-phone" type="text" placeholder="Enter extra customer phone" value={customerExtraPhone} onChange={(e) => { setCustomerExtraPhone(e.target.value); setMessage(''); }} />
          </div>

          <div className="admin-booking-date-grid">
            <div className="admin-booking-field">
              <label htmlFor="admin-pickup-at">Pickup Date and Time</label>
              <input id="admin-pickup-at" type="datetime-local" value={pickupAt} min={minimumDateTime} onChange={(e) => { setPickupAt(e.target.value); setMessage(''); }} required />
            </div>
            <div className="admin-booking-field">
              <label htmlFor="admin-return-at">Return Date and Time</label>
              <input id="admin-return-at" type="datetime-local" value={returnAt} min={pickupAt || minimumDateTime} onChange={(e) => { setReturnAt(e.target.value); setMessage(''); }} required />
            </div>
          </div>

          <button type="submit" className="admin-create-booking-button" disabled={submitting || customers.length === 0 || cars.length === 0}>
            {submitting ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>

        <section className="admin-add-booking-card admin-booking-summary">
          <h2>Booking Summary</h2>
          {selectedCar?.image_url ? (
            <img src={selectedCar.image_url} alt={`${selectedCar.brand} ${selectedCar.model}`} className="admin-booking-car-image" />
          ) : (
            <div className="admin-booking-no-image">{selectedCar ? 'No image available' : 'Select a car'}</div>
          )}
          <div className="admin-booking-summary-row">
            <span>Customer</span>
            <strong>{selectedCustomer?.full_name || 'Not selected'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Phone</span>
            <strong>{selectedCustomer?.phone || 'Not available'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Extra Phone</span>
            <strong>{customerExtraPhone || 'Not added'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Car</span>
            <strong>{selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'Not selected'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Price Per Day</span>
            <strong>
              {totalPerDay > 0 ? totalPerDay.toLocaleString() : '—'} EGP
              <small style={{ fontSize: '10px', color: '#888', display: 'block' }}>(Car + Driver)</small>
            </strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Driver</span>
            <strong>{driverName || 'Not assigned'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Driver Phone</span>
            <strong>{driverPhone || 'N/A'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Pickup</span>
            <strong>{pickupAt ? formatDate24(pickupAt) : 'Not selected'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Return</span>
            <strong>{returnAt ? formatDate24(returnAt) : 'Not selected'}</strong>
          </div>
          <div className="admin-booking-summary-row">
            <span>Rental Days</span>
            <strong>
              {estimatedDays || 0}
              <small style={{ fontSize: '10px', color: '#888', display: 'block' }}>(12 hours = 1 day)</small>
            </strong>
          </div>
          <div className="admin-booking-summary-row total">
            <span>Estimated Total</span>
            <strong>{estimatedPrice.toLocaleString()} EGP</strong>
          </div>
          <p className="admin-booking-note">Availability and the final price are checked securely by the database when the booking is created.</p>
        </section>
      </div>
    </div>
  );
}

export default AdminAddBooking;