// Booking.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './Booking.css';

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { car, pickupAt, returnAt, withDriver, estimatedPrice, rentalDays, selectedPackage } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [contractTemplate, setContractTemplate] = useState('');
  const [bookingNumber, setBookingNumber] = useState(null);
  const [customerData, setCustomerData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (car && pickupAt && returnAt) {
      loadContractFromDB();
      getUserData();
    }
  }, [car, pickupAt, returnAt, withDriver]);

  const getUserData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userData.user.id)
        .single();

      setCustomerData({
        full_name: profile?.full_name || userData.user.email || 'Customer',
        phone: profile?.phone || 'N/A',
      });
    }
  };

  const loadContractFromDB = async () => {
    try {
      const contractId = withDriver 
        ? '8156c90a-288a-4337-8115-71b97bf4c7dd'
        : '2416a926-1eff-470c-a424-539acfff436b';
      
      const { data, error } = await supabase
        .from('contracts')
        .select('name, template_html')
        .eq('id', contractId)
        .single();

      if (error) {
        console.error('❌ Error:', error);
        return;
      }

      if (data && data.template_html) {
        setContractTemplate(data.template_html);
      }
    } catch (err) {
      console.error('❌ Error:', err);
    }
  };

  const renderContract = (template, bookingNum) => {
    if (!template) return '';

    const depositAmount = Math.round(estimatedPrice * 0.3);
    const balanceAmount = Math.round(estimatedPrice * 0.7);
    const now = new Date();
    const signatureDate = now.toLocaleDateString('en-US');

    let contract = template
      .replace(/\{\{booking_number\}\}/g, bookingNum || 'N/A')
      .replace(/\{\{signature_date\}\}/g, signatureDate)
      .replace(/\{\{customer_name\}\}/g, customerData.full_name)
      .replace(/\{\{customer_phone\}\}/g, customerData.phone)
      .replace(/\{\{car_name\}\}/g, `${car?.brand || 'N/A'} ${car?.model || 'N/A'}`)
      .replace(/\{\{plate_number\}\}/g, car?.plate_number || 'N/A')
      .replace(/\{\{driver_name\}\}/g, car?.driver_name || 'N/A')
      .replace(/\{\{driver_phone\}\}/g, car?.driver_phone || 'N/A')
      .replace(/\{\{pickup_at\}\}/g, formatDate24(pickupAt))
      .replace(/\{\{pickup_location\}\}/g, 'Cairo')
      .replace(/\{\{total_price\}\}/g, estimatedPrice)
      .replace(/\{\{deposit_paid\}\}/g, depositAmount)
      .replace(/\{\{remaining_balance\}\}/g, balanceAmount);

    return contract;
  };

  const openContractPopup = () => {
    if (!contractTemplate) {
      setMessage('Contract not available');
      return;
    }

    const contractHtml = renderContract(contractTemplate, bookingNumber);
    const newWindow = window.open('', '_blank', 'width=900,height=800');
    if (newWindow) {
      newWindow.document.write(contractHtml);
      newWindow.document.close();
    } else {
      alert('Please allow popups for this site.');
    }
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
      p_with_driver: withDriver,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setBookingNumber(data);

    const bookingNumber = data;
    const customerName = userData.user.user_metadata?.full_name || userData.user.email || 'Customer';
    const driverText = withDriver ? 'with driver' : 'without driver';

    await supabase
      .from('notifications')
      .insert({
        type: 'new_booking',
        title: `📅 New booking #${bookingNumber}`,
        message: `${car.brand} ${car.model} booked by ${customerName} (${driverText})`,
        link: `/admin/bookings`,
      })
      .select();

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
          <p>Please choose a car and rental time before continuing.</p>
          <button type="button" onClick={() => navigate('/cars')}>Browse Cars</button>
        </div>
      </div>
    );
  }

  const hoursPerDay = withDriver ? 12 : 24;

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
            <div className="booking-driver-info">
              <span className={`driver-badge ${withDriver ? 'with-driver' : 'without-driver'}`}>
                {withDriver ? 'With Driver' : 'Without Driver'}
              </span>
            </div>
            <p className="booking-price">
              {estimatedPrice.toLocaleString()} EGP
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>
                {selectedPackage === 'monthly' ? 'Monthly Package' : 
                 selectedPackage === 'weekly' ? 'Weekly Package' : 'Daily Rate'}
              </small>
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
            <span>Driver</span>
            <strong>{withDriver ? 'Yes (+ driver)' : 'No'}</strong>
          </div>

          <div className="booking-summary-row">
            <span>Rental Days</span>
            <strong>
              {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>
                {hoursPerDay} hours = 1 day
              </small>
            </strong>
          </div>

          <div className="booking-summary-row">
            <span>Package</span>
            <strong>
              {selectedPackage === 'monthly' ? 'Monthly (30 days)' : 
               selectedPackage === 'weekly' ? 'Weekly (7 days)' : 'Daily'}
            </strong>
          </div>

          <div className="booking-summary-row total">
            <span>Total Price</span>
            <strong>{estimatedPrice.toLocaleString()} EGP</strong>
          </div>

          <button
            type="button"
            className="view-contract-btn"
            onClick={openContractPopup}
          >
            📄 View Contract
          </button>

          <p className="booking-note">
            The final price is calculated securely by the database when the booking is confirmed.
          </p>

          {message && <p className="booking-message">{message}</p>}

          <button
            type="button"
            className="confirm-booking-button"
            onClick={confirmBooking}
            disabled={loading}
          >
            {loading ? 'Confirming Booking...' : 'Confirm Booking'}
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