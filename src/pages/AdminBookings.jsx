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
          ? { ...booking, status: newStatus }
          : booking
      )
    );

    setMessage('Booking updated successfully.');
  };

  return (
    <div className="admin-bookings-page">

      <div className="admin-bookings-header">
        <h1>Manage Bookings</h1>
        <p>View and manage Roadex reservations.</p>
      </div>

      {message && (
        <p className="admin-bookings-message">
          {message}
        </p>
      )}

      {loading && <p>Loading bookings...</p>}

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

              <h2>
                {booking.cars?.brand}{' '}
                {booking.cars?.model}
              </h2>

              <p>
                <strong>Year:</strong>{' '}
                {booking.cars?.year}
              </p>

              <p>
                <strong>Pickup:</strong>{' '}
                {new Date(
                  booking.pickup_at
                ).toLocaleString()}
              </p>

              <p>
                <strong>Return:</strong>{' '}
                {new Date(
                  booking.return_at
                ).toLocaleString()}
              </p>

              <p>
                <strong>Total:</strong>{' '}
                {booking.total_price} EGP
              </p>

              <p>
                <strong>Status:</strong>{' '}
                <span
                  className={`booking-status ${booking.status}`}
                >
                  {booking.status}
                </span>
              </p>

            </div>

            <div className="admin-booking-actions">

              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    booking.id,
                    'confirmed'
                  )
                }
              >
                Confirm
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    booking.id,
                    'completed'
                  )
                }
              >
                Complete
              </button>

              <button
                type="button"
                className="cancel-booking"
                onClick={() =>
                  updateStatus(
                    booking.id,
                    'cancelled'
                  )
                }
              >
                Cancel
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default AdminBookings;
