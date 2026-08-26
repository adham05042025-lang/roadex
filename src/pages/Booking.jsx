// Booking.jsx - النسخة الأصلية الكاملة
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './Booking.css';

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { car, pickupAt, returnAt, withDriver, estimatedPrice, rentalDays, selectedPackage, isManual, manualDays } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [contractTemplate, setContractTemplate] = useState('');
  const [bookingNumber, setBookingNumber] = useState(null);
  const [customerData, setCustomerData] = useState({
    full_name: '',
    phone: '',
    national_id: '',
  });
  const [insuranceAmount, setInsuranceAmount] = useState(0);
  const [pickupFee, setPickupFee] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(estimatedPrice || 0);

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
        .select('full_name, phone, national_id')
        .eq('id', userData.user.id)
        .single();

      setCustomerData({
        full_name: profile?.full_name || userData.user.email || 'Customer',
        phone: profile?.phone || 'N/A',
        national_id: profile?.national_id || '',
      });
    }
  };

  const loadContractFromDB = async () => {
    try {
      const contractName = withDriver ? 'With Driver Contract' : 'Without Driver Contract';
      
      const { data, error } = await supabase
        .from('contracts')
        .select('template_html')
        .eq('name', contractName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading contract:', error);
        const { data: fallbackData } = await supabase
          .from('contracts')
          .select('template_html')
          .eq('is_active', true)
          .limit(1)
          .single();
        
        if (fallbackData) {
          setContractTemplate(fallbackData.template_html);
        }
        return;
      }

      if (data && data.template_html) {
        setContractTemplate(data.template_html);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const renderContract = (template, bookingNum) => {
    if (!template) return '';

    const depositAmount = Math.round(totalPrice * 0.3);
    const balanceAmount = Math.round(totalPrice * 0.7);
    const now = new Date();
    const signatureDate = now.toLocaleDateString('en-US');

    let contractHtml = template
      .replace(/\{\{contract_number\}\}/g, bookingNum || 'N/A')
      .replace(/\{\{signature_date\}\}/g, signatureDate)
      .replace(/\{\{customer_name\}\}/g, customerData.full_name || 'Customer')
      .replace(/\{\{customer_phone\}\}/g, customerData.phone || 'N/A')
      .replace(/\{\{national_id\}\}/g, customerData.national_id || 'N/A')
      .replace(/\{\{car_model\}\}/g, `${car?.brand || 'N/A'} ${car?.model || 'N/A'}`)
      .replace(/\{\{plate_number\}\}/g, car?.plate_number || 'N/A')
      .replace(/\{\{pickup_location\}\}/g, 'Cairo')
      .replace(/\{\{pickup_at\}\}/g, formatDate24(pickupAt))
      .replace(/\{\{return_at\}\}/g, formatDate24(returnAt))
      .replace(/\{\{rental_days\}\}/g, rentalDays || 0)
      .replace(/\{\{with_driver\}\}/g, withDriver ? 'With Driver' : 'Without Driver')
      .replace(/\{\{total_price\}\}/g, totalPrice)
      .replace(/\{\{security_deposit\}\}/g, depositAmount)
      .replace(/\{\{insurance_amount\}\}/g, insuranceAmount || 0)
      .replace(/\{\{pickup_fee\}\}/g, pickupFee || 0)
      .replace(/\{\{delivery_fee\}\}/g, deliveryFee || 0)
      .replace(/\{\{remaining_balance\}\}/g, balanceAmount);

    return contractHtml;
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
      p_national_id: customerData.national_id || null,
      p_insurance_amount: insuranceAmount || 0,
      p_pickup_fee: pickupFee || 0,
      p_delivery_fee: deliveryFee || 0,
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
              {totalPrice.toLocaleString()} EGP
              <small style={{ fontSize: '11px', color: '#888', display: 'block' }}>
                {selectedPackage === 'monthly' ? 'Monthly Package' : 
                 selectedPackage === 'weekly' ? 'Weekly Package' : 
                 isManual ? 'Manual Days' : 'Daily Rate'}
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
               selectedPackage === 'weekly' ? 'Weekly (7 days)' : 
               isManual ? 'Manual Days' : 'Daily'}
            </strong>
          </div>

          <div className="booking-summary-row">
            <span>Insurance</span>
            <strong>{insuranceAmount.toLocaleString()} EGP</strong>
          </div>

          <div className="booking-summary-row">
            <span>Pickup Fee</span>
            <strong>{pickupFee.toLocaleString()} EGP</strong>
          </div>

          <div className="booking-summary-row">
            <span>Delivery Fee</span>
            <strong>{deliveryFee.toLocaleString()} EGP</strong>
          </div>

          <div className="booking-summary-row total">
            <span>Total Price</span>
            <strong>{totalPrice.toLocaleString()} EGP</strong>
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