import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
        pickup_at,
        return_at,
        status,
        total_price,
        created_at,
        cars (
          brand,
          model,
          year,
          image_url
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

  if (loading) {
    return (
      <div className="my-bookings-page">
        <h1>My Bookings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <h1>My Bookings</h1>

      {message && <p>{message}</p>}

      {!message && bookings.length === 0 && (
        <p>You don't have any bookings yet.</p>
      )}

      {bookings.map((booking) => (
        <div key={booking.id}>
          <h2>
            {booking.cars?.brand} {booking.cars?.model}
          </h2>

          {booking.cars?.image_url && (
            <img
              src={booking.cars.image_url}
              alt={`${booking.cars.brand} ${booking.cars.model}`}
              width="250"
            />
          )}

          <p>Year: {booking.cars?.year}</p>

          <p>
            Pickup:{' '}
            {new Date(booking.pickup_at).toLocaleString()}
          </p>

          <p>
            Return:{' '}
            {new Date(booking.return_at).toLocaleString()}
          </p>

          <p>Status: {booking.status}</p>

          <p>Total Price: {booking.total_price} EGP</p>
        </div>
      ))}
    </div>
  );
}

export default MyBookings;
