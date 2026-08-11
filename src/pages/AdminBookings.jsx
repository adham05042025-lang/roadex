import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminBookings.css';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        pickup_at,
        return_at,
        status,
        total_price,
        created_at,
        cars (
          brand,
          model,
          year
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  const updateStatus = async (bookingId, newStatus) => {
    setMessage('');

    const { error } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
      })
      .eq('id', bookingId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              status: newStatus,
            }
          : booking
      )
    );

    setMessage('Booking updated successfully.');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-bookings-page">

      <div className="admin-bookings-header">
        <h1>Manage Bookings</h1>

        <p>
          Review customer reservations and manage their status.
        </p>
      </div>

      {message && (
        <div className="admin-bookings-message">
          {message}
        </div>
      )}

      {loading && (
        <p>Loading bookings...</p>
      )}

      {!loading && bookings.length === 0 && (
        <p>No bookings found.</p>
      )}

      <div className="admin-bookings-list">

        {bookings.map((booking) => (
          <div
            className="admin-booking-card"
            key={booking.id}
          >

            <div className="admin-booking-info">

              <div className="admin-booking-title">

                <h2>
                  {booking.cars?.brand}{' '}
                  {booking.cars?.model}
                </h2>

                <span
                  className={`booking-status ${booking.status}`}
                >
                  {booking.status}
                </span>

              </div>

              <div className="admin-booking-details-grid">

                <div className="booking-detail-box">
                  <span>Year</span>

                  <strong>
                    {booking.cars?.year || 'N/A'}
                  </strong>
                </div>

                <div className="booking-detail-box">
                  <span>Total Price</span>

                  <strong>
                    {Number(
                      booking.total_price
                    ).toLocaleString()}{' '}
                    EGP
                  </strong>
                </div>

                <div className="booking-detail-box">
                  <span>Pickup</span>

                  <strong>
                    {formatDate(
                      booking.pickup_at
                    )}
                  </strong>
                </div>

                <div className="booking-detail-box">
                  <span>Return</span>

                  <strong>
                    {formatDate(
                      booking.return_at
                    )}
                  </strong>
                </div>

              </div>

            </div>

            <div className="admin-booking-actions">

              {booking.status === 'pending' && (
                <button
                  type="button"
                  className="accept-booking"
                  onClick={() =>
                    updateStatus(
                      booking.id,
                      'confirmed'
                    )
                  }
                >
                  Accept Booking
                </button>
              )}

              {booking.status === 'confirmed' && (
                <button
                  type="button"
                  className="complete-booking"
                  onClick={() =>
                    updateStatus(
                      booking.id,
                      'completed'
                    )
                  }
                >
                  Mark Completed
                </button>
              )}

              {(booking.status === 'pending' ||
                booking.status === 'confirmed') && (
                <button
                  type="button"
                  className="refuse-booking"
                  onClick={() =>
                    updateStatus(
                      booking.id,
                      'cancelled'
                    )
                  }
                >
                  Refuse Booking
                </button>
              )}

              {booking.status === 'completed' && (
                <div className="booking-final-state">
                  Rental Completed
                </div>
              )}

              {booking.status === 'cancelled' && (
                <div className="booking-final-state cancelled">
                  Booking Cancelled
                </div>
              )}

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default AdminBookings;
