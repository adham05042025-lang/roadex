import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './MyBookings.css';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [extendingId, setExtendingId] = useState(null);
  const [extensionDate, setExtensionDate] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage('You must be logged in to view your bookings.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        pickup_at,
        return_at,
        status,
        total_price,
        created_at,
        extended_until,
        with_driver,
        driver_price_per_day,
        cars (brand, model, year, image_url, price_per_day, driver_price_per_day)
      `)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    console.log('📋 My bookings:', data);
    setBookings(data || []);
    setLoading(false);
  };

  const isExpired = (returnAt, status) => {
    const now = new Date();
    return (status === 'pending' || status === 'confirmed') && new Date(returnAt) < now;
  };

  const getDriverStatus = (booking) => {
    if (!booking.cars) return 'N/A';
    // استخدام with_driver من الحجز نفسه
    if (booking.with_driver) {
      return 'With Driver';
    }
    return 'Without Driver';
  };

  const getTotalPerDay = (booking) => {
    if (!booking.cars) return 0;
    if (booking.with_driver) {
      return Number(booking.cars.price_per_day || 0) + Number(booking.cars.driver_price_per_day || 0);
    }
    return Number(booking.cars.price_per_day || 0);
  };

  const calculateRentalDays = (pickupAt, returnAt) => {
    if (!pickupAt || !returnAt) return 0;
    const pickup = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const difference = returnDate - pickup;
    const hours = difference / (1000 * 60 * 60);
    if (difference <= 0) return 0;
    if (hours <= 12) return 1;
    return Math.ceil(hours / 12);
  };

  const cancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    setMessage('');
    setCancellingId(bookingId);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage('You must be logged in to cancel a booking.');
      setCancellingId(null);
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', userData.user.id)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      setMessage(error.message);
      setCancellingId(null);
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      )
    );

    setCancellingId(null);
    setMessage('Booking cancelled successfully.');
  };

  const requestExtension = async (bookingId) => {
    if (!extensionDate) {
      setMessage('Please select a new return date.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to request extension until ${formatDate24(extensionDate)}?`);
    if (!confirmed) return;

    setMessage('');
    setExtendingId(bookingId);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage('You must be logged in.');
      setExtendingId(null);
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
      setMessage('Booking not found.');
      setExtendingId(null);
      return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ 
        extended_until: new Date(extensionDate).toISOString(),
        status: 'pending'
      })
      .eq('id', bookingId)
      .eq('user_id', userData.user.id);

    if (error) {
      setMessage(error.message);
      setExtendingId(null);
      return;
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        type: 'extension_request',
        title: `📝 Extension requested for booking #${booking.booking_number}`,
        message: `Customer requested extension until ${formatDate24(extensionDate)}`,
        link: `/admin/bookings`,
      });

    if (notifError) {
      console.error('Extension notification error:', notifError);
    } else {
      console.log('✅ Extension notification sent to admin');
    }

    setMessage('Extension request sent! Waiting for admin approval.');
    setExtendingId(null);
    setExtensionDate('');
    await loadBookings();
  };

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-loading">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-header">
        <div>
          <h1>My Bookings</h1>
          <p>View your Roadex reservations and rental details.</p>
        </div>
        <button type="button" className="my-bookings-refresh" onClick={loadBookings}>Refresh</button>
      </div>

      {message && <div className="my-bookings-message">{message}</div>}

      {!message && bookings.length === 0 && (
        <div className="my-bookings-empty">
          <h2>No Bookings Yet</h2>
          <p>You have not created any reservations.</p>
          <button type="button" onClick={() => navigate('/cars')}>Browse Cars</button>
        </div>
      )}

      <div className="my-bookings-list">
        {bookings.map((booking) => {
          const expired = isExpired(booking.return_at, booking.status);
          const canExtend = expired && (booking.status === 'pending' || booking.status === 'confirmed');
          const driverStatus = getDriverStatus(booking);
          const totalPerDay = getTotalPerDay(booking);
          const rentalDays = calculateRentalDays(booking.pickup_at, booking.return_at);
          
          return (
            <article className={`my-booking-card ${expired ? 'expired' : ''}`} key={booking.id}>
              <div className="my-booking-image-area">
                {booking.cars?.image_url ? (
                  <img src={booking.cars.image_url} alt={`${booking.cars.brand} ${booking.cars.model}`} className="my-booking-image" />
                ) : (
                  <div className="my-booking-no-image">No image available</div>
                )}
              </div>
              <div className="my-booking-content">
                <div className="my-booking-title">
                  <div>
                    <span className="my-booking-number">Booking #{booking.booking_number}</span>
                    <h2>{booking.cars?.brand || 'Unknown'} {booking.cars?.model || 'Car'}</h2>
                  </div>
                  <div className="my-booking-status-group">
                    <span className={`my-booking-status ${booking.status}`}>{booking.status}</span>
                    {expired && <span className="my-booking-status expired">⚠️ Expired</span>}
                  </div>
                </div>

                <div className="my-booking-driver-status">
                  <span className={`driver-badge ${driverStatus === 'With Driver' ? 'with-driver' : 'without-driver'}`}>
                    {driverStatus}
                  </span>
                </div>

                <div className="my-booking-details">
                  <div className="my-booking-detail">
                    <span>Car Year</span>
                    <strong>{booking.cars?.year || 'N/A'}</strong>
                  </div>
                  <div className="my-booking-detail">
                    <span>Booking Created</span>
                    <strong>{formatDate24(booking.created_at)}</strong>
                  </div>
                  <div className="my-booking-detail">
                    <span>Pickup</span>
                    <strong>{formatDate24(booking.pickup_at)}</strong>
                  </div>
                  <div className="my-booking-detail">
                    <span>Return</span>
                    <strong>{formatDate24(booking.return_at)}</strong>
                    {booking.extended_until && (
                      <small style={{ color: '#ffc107' }}>Extension requested: {formatDate24(booking.extended_until)}</small>
                    )}
                  </div>
                  <div className="my-booking-detail">
                    <span>Rental Days</span>
                    <strong>{rentalDays} days <small style={{ color: '#888', fontSize: '10px' }}>(12h = 1 day)</small></strong>
                  </div>
                  <div className="my-booking-detail">
                    <span>Price Per Day</span>
                    <strong>{totalPerDay.toLocaleString()} EGP</strong>
                  </div>
                  <div className="my-booking-detail total">
                    <span>Total Price</span>
                    <strong>{Number(booking.total_price || 0).toLocaleString()} EGP</strong>
                  </div>
                </div>

                {canExtend && (
                  <div className="extension-section">
                    <div className="extension-input-group">
                      <input
                        type="datetime-local"
                        value={extensionDate}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setExtensionDate(e.target.value)}
                        className="extension-input"
                      />
                      <button
                        type="button"
                        className="extend-booking-btn"
                        onClick={() => requestExtension(booking.id)}
                        disabled={extendingId === booking.id}
                      >
                        {extendingId === booking.id ? 'Requesting...' : '📅 Request Extension'}
                      </button>
                    </div>
                    <small style={{ color: '#888', fontSize: '11px' }}>
                      Request a new return date (admin approval required)
                    </small>
                  </div>
                )}

                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button
                    type="button"
                    className="cancel-booking-button"
                    onClick={() => cancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default MyBookings;