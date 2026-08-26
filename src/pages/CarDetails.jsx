import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
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
  const [withDriver, setWithDriver] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [rentalDays, setRentalDays] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const [manualDays, setManualDays] = useState(1);
  const [dateError, setDateError] = useState('');
  const [driverNote, setDriverNote] = useState('');
  
  const packages = [
    { key: '0-1', label: '0-1 days', minDays: 0, maxDays: 1 },
    { key: '2-3', label: '2-3 days', minDays: 2, maxDays: 3 },
    { key: '4-6', label: '4-6 days', minDays: 4, maxDays: 6 },
    { key: '7-13', label: '7-13 days', minDays: 7, maxDays: 13 },
    { key: '14-20', label: '14-20 days', minDays: 14, maxDays: 20 },
    { key: '21-60', label: '21-60 days', minDays: 21, maxDays: 60 },
    { key: '61-356', label: '61-356 days', minDays: 61, maxDays: 356 },
  ];

  const [selectedPackage, setSelectedPackage] = useState('0-1');

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

  const calculateDaysBetween = (pickup, returnDate) => {
    if (!pickup || !returnDate) return 0;
    const pickupDate = new Date(pickup);
    const returnDateTime = new Date(returnDate);
    const diffHours = Math.abs(returnDateTime - pickupDate) / (1000 * 60 * 60);
    if (diffHours <= 0) return 0;
    return Math.ceil(diffHours / 24);
  };

  const getDailyPrice = (pkgKey) => {
    if (!car) return 0;
    const type = withDriver ? 'with_driver' : 'without_driver';
    
    if (car.package_prices && car.package_prices[pkgKey]) {
      const price = car.package_prices[pkgKey]?.[type];
      if (price && price > 0) {
        return price;
      }
    }

    return withDriver 
      ? Number(car.price_per_day) + Number(car.driver_price_per_day || 0)
      : Number(car.price_per_day);
  };

  const calculateTotalPrice = () => {
    if (!car) return 0;
    
    let days = 0;
    if (isManual) {
      days = manualDays;
    } else if (pickupAt && returnAt) {
      days = calculateDaysBetween(pickupAt, returnAt);
    } else {
      const pkg = packages.find(p => p.key === selectedPackage);
      days = pkg?.days || 1;
    }
    
    const dailyPrice = getDailyPrice(selectedPackage);
    return dailyPrice * days;
  };

  const isPackageFit = (days, pkgKey) => {
    const pkg = packages.find(p => p.key === pkgKey);
    if (!pkg) return false;
    return days >= pkg.minDays && days <= pkg.maxDays;
  };

  const getValidPackage = (days) => {
    if (days <= 0) return '0-1';
    for (const pkg of packages) {
      if (days >= pkg.minDays && days <= pkg.maxDays) {
        return pkg.key;
      }
    }
    return '61-356';
  };

  useEffect(() => {
    if (!car) return;
    
    setDateError('');
    setDriverNote('');
    
    if (!pickupAt || !returnAt) {
      setRentalDays(0);
      setEstimatedPrice(0);
      return;
    }

    const days = calculateDaysBetween(pickupAt, returnAt);
    setRentalDays(days);

    if (withDriver) {
      setDriverNote('ℹ️ Driver working hours: 12 hours per day. Extra hours may be charged.');
    }

    if (!isManual && !isPackageFit(days, selectedPackage)) {
      const validPackage = getValidPackage(days);
      if (validPackage !== selectedPackage) {
        setSelectedPackage(validPackage);
      }
    }

    const price = calculateTotalPrice();
    setEstimatedPrice(price);
    
  }, [car, pickupAt, returnAt, withDriver, selectedPackage, isManual, manualDays]);

  const fetchAvailability = async () => {
    if (!pickupAt || !returnAt) {
      setAvailableQuantity(null);
      return;
    }
    
    if (new Date(returnAt) <= new Date(pickupAt)) {
      setAvailableQuantity(null);
      return;
    }
    
    setChecking(true);
    const { data, error } = await supabase.rpc('get_available_quantity', {
      p_car_id: id,
      p_pickup_at: new Date(pickupAt).toISOString(),
      p_return_at: new Date(returnAt).toISOString(),
    });
    if (error) {
      console.error('Error checking availability:', error);
      setAvailableQuantity(null);
    } else {
      setAvailableQuantity(data);
    }
    setChecking(false);
  };

  useEffect(() => {
    if (pickupAt && returnAt) {
      fetchAvailability();
    } else {
      setAvailableQuantity(null);
    }
  }, [pickupAt, returnAt]);

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
        withDriver,
        estimatedPrice,
        rentalDays,
        selectedPackage,
        isManual,
        manualDays,
      },
    });
  };

  if (loading) {
    return (
      <div className="car-details-page">
        <div className="loading-spinner">Loading...</div>
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

  const getPackageLabel = () => {
    return packages.find(p => p.key === selectedPackage)?.label || 'Daily';
  };

  const displayDailyPrice = getDailyPrice(selectedPackage);
  const currentFit = isPackageFit(rentalDays, selectedPackage);

  return (
    <div className="car-details-page">
      <div className="car-details-grid">
        {/* ===== LEFT COLUMN: IMAGE + PACKAGES ===== */}
        <div className="car-details-left">
          
          {/* Image */}
          <div className="car-details-image-area">
            {car.image_url ? (
              <button type="button" className="car-image-button" onClick={() => setImageOpen(true)}>
                <img src={car.image_url} alt={`${car.brand} ${car.model}`} className="car-details-image" />
                <div className="car-zoom-overlay">
                  <span className="car-zoom-icon">⌕</span>
                  <span>View image</span>
                </div>
              </button>
            ) : (
              <div className="car-details-no-image">No image available</div>
            )}
          </div>

          {/* ===== PACKAGES UNDER IMAGE ===== */}
          <div className="packages-section">
            <div className="packages-header">
              <h3>Choose Package</h3>
              <div className="manual-toggle">
                <label className="manual-toggle-label">
                  <input
                    type="checkbox"
                    checked={isManual}
                    onChange={() => {
                      setIsManual(!isManual);
                      if (!isManual) setManualDays(1);
                      setDateError('');
                      setDriverNote('');
                    }}
                  />
                  <span>Manual Days</span>
                </label>
              </div>
            </div>

            {pickupAt && returnAt && !isManual && (
              <div className={`auto-fit-message ${currentFit ? 'fit' : 'changing'}`}>
                {currentFit ? '✅ Package fits your dates' : '🔄 Auto-selecting best package...'}
              </div>
            )}

            <div className="days-grid">
              {packages.map((pkg) => {
                const dailyPrice = getDailyPrice(pkg.key);
                const totalPrice = dailyPrice * pkg.days;
                const isActive = selectedPackage === pkg.key;
                const isFit = pickupAt && returnAt && isPackageFit(rentalDays, pkg.key);
                
                return (
                  <div 
                    key={pkg.key}
                    className={`day-card ${isActive ? 'active' : ''} ${!isFit && pickupAt && returnAt ? 'not-fit' : ''}`}
                    onClick={() => {
                      if (!isManual) {
                        setSelectedPackage(pkg.key);
                        setDateError('');
                      }
                    }}
                  >
                    <h4>{pkg.label}</h4>
                    <p className="day-price">
                      {dailyPrice > 0 ? dailyPrice.toLocaleString() : '—'} EGP
                    </p>
                    <small>per day</small>
                    {totalPrice > 0 && (
                      <p className="day-total">Total: {totalPrice.toLocaleString()} EGP</p>
                    )}
                    {pickupAt && returnAt && !isManual && (
                      <small className={`package-fit ${isFit ? 'fit' : 'unfit'}`}>
                        {isFit ? '✅ Fit' : '❌ Not fit'}
                      </small>
                    )}
                    {isActive && (
                      <small className="selected-badge">Selected</small>
                    )}
                  </div>
                );
              })}
            </div>

            {isManual && (
              <div className="manual-days-input">
                <label>
                  Number of Days
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={manualDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setManualDays(val);
                    }}
                  />
                </label>
                <p className="manual-price-info">
                  Daily Rate: {displayDailyPrice.toLocaleString()} EGP/day
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ===== RIGHT COLUMN: INFO + PRICE + DATES ===== */}
        <div className="car-details-right">

          <h1>{car.brand} {car.model}</h1>
          <p className="car-details-year">Year: {car.year}</p>
          
          <div className="car-details-tags">
            {car.category && <span>{car.category}</span>}
            {car.car_type && <span>{car.car_type}</span>}
          </div>

          {/* ===== DRIVER TOGGLE - GOLD STYLE ===== */}
          <div className="driver-toggle-section">
            <label className="driver-toggle-label">
              <div className="driver-toggle-switch">
                <input
                  type="checkbox"
                  checked={withDriver}
                  onChange={() => {
                    setWithDriver(!withDriver);
                    setSelectedPackage('0-1');
                    setPickupAt('');
                    setReturnAt('');
                    setDateError('');
                    setDriverNote('');
                    setAvailableQuantity(null);
                  }}
                />
                <span className="driver-toggle-slider"></span>
              </div>
              <span className={`label-text ${withDriver ? 'active' : ''}`}>
                {withDriver && <span className="gold-star">✦</span>}
                With Driver
              </span>
            </label>
            <div className="driver-price-info">
              <span className="driver-price-text">
                <span className={`status ${withDriver ? 'active' : 'inactive'}`}>
                  {withDriver ? '✅ With Driver' : '❌ Without Driver'}
                </span>
                <small>{withDriver ? '12 hours/day' : '24 hours/day'}</small>
              </span>
            </div>
          </div>

          {/* Driver Note */}
          {driverNote && (
            <div className="driver-note">
              ℹ️ {driverNote}
            </div>
          )}

          {/* Price Display */}
          <div className="car-details-prices">
            <div className="car-details-price-box">
              <span>Total Price</span>
              <strong>
                {estimatedPrice > 0 && !dateError ? estimatedPrice.toLocaleString() : '—'} EGP
                <small style={{ display: 'block', fontSize: '10px', color: '#888' }}>
                  {rentalDays > 0 && !dateError ? `${rentalDays} day(s) - ${isManual ? 'Manual' : getPackageLabel()}` : 'Select dates'}
                  {withDriver && rentalDays > 0 && ' (With Driver)'}
                </small>
                <small style={{ display: 'block', fontSize: '10px', color: '#888' }}>
                  24 hours = 1 day
                </small>
              </strong>
            </div>
          </div>

          {/* Availability */}
          {availableQuantity !== null && availableQuantity > 0 && car.show_availability && (
            <p className="car-details-quantity">✅ Available: <strong>{availableQuantity}</strong> cars</p>
          )}
          {availableQuantity !== null && availableQuantity <= 0 && (
            <p className="car-details-unavailable">❌ No cars available for this time.</p>
          )}

          {car.description && (
            <p className="car-details-description">{car.description}</p>
          )}

          {/* Booking Dates */}
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
                  setDateError('');
                  setDriverNote('');
                }} 
              />
            </label>
            <label>
              Return Date & Time
              <input 
                type="datetime-local" 
                value={returnAt} 
                min={pickupAt}
                onChange={(e) => {
                  setReturnAt(e.target.value);
                  setAvailableQuantity(null);
                  setDateError('');
                  setDriverNote('');
                }} 
              />
            </label>

            {pickupAt && returnAt && !dateError && (
              <div className="selected-dates-summary">
                <p><span>Pickup:</span> <strong>{formatDate24(pickupAt)}</strong></p>
                <p><span>Return:</span> <strong>{formatDate24(returnAt)}</strong></p>
                <p><span>Days:</span> <strong>{rentalDays}</strong></p>
                <p><span>Package:</span> <strong>{isManual ? 'Manual' : getPackageLabel()}</strong></p>
                <p><span>Driver:</span> <strong>{withDriver ? '✅ With Driver' : '❌ Without Driver'}</strong></p>
              </div>
            )}

            {dateError && (
              <div className="date-error-message">⚠️ {dateError}</div>
            )}
            
            {message && <p className="car-details-message">{message}</p>}
            
            <button 
              type="button" 
              className="book-now-button" 
              onClick={goToBooking}
              disabled={!!dateError || estimatedPrice === 0 || (availableQuantity !== null && availableQuantity <= 0)}
            >
              Book This Car
            </button>
          </div>

        </div>
      </div>

      {/* Image Modal */}
      {imageOpen && car.image_url && (
        <div className="image-modal" onClick={() => setImageOpen(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setImageOpen(false)}>×</button>
            <img src={car.image_url} alt={`${car.brand} ${car.model}`} className="image-modal-image" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetails;