import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import './AdminBookings.css';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [message, setMessage] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');

    const { data: bookingData, error: bookingError } =
      await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
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
        `);

    if (bookingError) {
      setMessage(bookingError.message);
      setBookings([]);
      setLoading(false);
      return;
    }

    const bookingRows = bookingData || [];

    const customerIds = [
      ...new Set(
        bookingRows
          .map((booking) => booking.user_id)
          .filter(Boolean)
      ),
    ];

    let profileMap = {};

    if (customerIds.length > 0) {
      const { data: profileData, error: profileError } =
        await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', customerIds);

      if (profileError) {
        setMessage(
          `Bookings loaded, but customer details could not be loaded: ${profileError.message}`
        );
      } else {
        profileMap = Object.fromEntries(
          (profileData || []).map((profile) => [
            profile.id,
            profile,
          ])
        );
      }
    }

    const combinedBookings = bookingRows.map(
      (booking) => ({
        ...booking,
        customer: profileMap[booking.user_id] || null,
      })
    );

    setBookings(combinedBookings);
    setLoading(false);
  };

  const updateStatus = async (bookingId, newStatus) => {
    setMessage('');

    if (newStatus === 'cancelled') {
      const confirmed = window.confirm(
        'Are you sure you want to cancel this booking?'
      );

      if (!confirmed) {
        return;
      }
    }

    if (newStatus === 'completed') {
      const confirmed = window.confirm(
        'Are you sure you want to mark this rental as completed?'
      );

      if (!confirmed) {
        return;
      }
    }

    setUpdatingId(bookingId);

    const { error } = await supabase
      .from('bookings')
      .update({
        status: newStatus,
      })
      .eq('id', bookingId);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    if (newStatus === 'confirmed') {
      setMessage('Booking accepted successfully.');
    } else if (newStatus === 'completed') {
      setMessage(
        'Rental completed successfully. The car is available again.'
      );
    } else if (newStatus === 'cancelled') {
      setMessage(
        'Booking cancelled successfully. The car is available again.'
      );
    } else {
      setMessage('Booking updated successfully.');
    }

    await loadBookings();

    setUpdatingId('');
  };

  const visibleBookings = useMemo(() => {
    const normalizedSearch =
      searchNumber.trim().replace(/^#/, '');

    return [...bookings]
      .filter((booking) => {
        if (!normalizedSearch) {
          return true;
        }

        return String(
          booking.booking_number || ''
        ).includes(normalizedSearch);
      })
      .sort((firstBooking, secondBooking) => {
        const firstDate = new Date(
          firstBooking.created_at
        ).getTime();

        const secondDate = new Date(
          secondBooking.created_at
        ).getTime();

        if (sortOrder === 'oldest') {
          return firstDate - secondDate;
        }

        return secondDate - firstDate;
      });
  }, [bookings, searchNumber, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((currentOrder) =>
      currentOrder === 'newest'
        ? 'oldest'
        : 'newest'
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return 'N/A';
    }

    return new Date(date).toLocaleString();
  };

  return (
    <div className="admin-bookings-page">

      <div className="admin-bookings-header">
        <h1>Manage Bookings</h1>

        <p>
          Search reservations, review customer details
          and manage booking status.
        </p>
      </div>

      <div className="admin-bookings-toolbar">

        <div className="admin-booking-search">

          <label htmlFor="booking-number-search">
            Search by Booking Number
          </label>

          <input
            id="booking-number-search"
            type="text"
            inputMode="numeric"
            placeholder="Example: 25"
            value={searchNumber}
            onChange={(event) =>
              setSearchNumber(
                event.target.value.replace(
                  /[^0-9#]/g,
                  ''
                )
              )
            }
          />

        </div>

        <div className="admin-bookings-toolbar-actions">

          <button
            type="button"
            className="sort-bookings-button"
            onClick={toggleSortOrder}
          >
            {sortOrder === 'newest'
              ? 'Newest to Oldest'
              : 'Oldest to Newest'}
          </button>

          <button
            type="button"
            className="refresh-bookings-button"
            onClick={loadBookings}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

        </div>

      </div>

      <div className="admin-bookings-results">

        <span>
          {visibleBookings.length}{' '}
          {visibleBookings.length === 1
            ? 'booking'
            : 'bookings'}
        </span>

        <span>
          Sorted:{' '}
          {sortOrder === 'newest'
            ? 'newest first'
            : 'oldest first'}
        </span>

      </div>

      {message && (
        <div className="admin-bookings-message">
          {message}
        </div>
      )}

      {loading && (
        <div className="admin-bookings-empty">
          Loading bookings...
        </div>
      )}

      {!loading && visibleBookings.length === 0 && (
        <div className="admin-bookings-empty">
          {searchNumber
            ? 'No booking matches that number.'
            : 'No bookings found.'}
        </div>
      )}

      {!loading && (
        <div className="admin-bookings-list">

          {visibleBookings.map((booking) => (

            <div
              className="admin-booking-card"
              key={booking.id}
            >

              <div className="admin-booking-info">

                <div className="admin-booking-title">

                  <div>

                    <span className="booking-number">
                      Booking #
                      {booking.booking_number}
                    </span>

                    <h2>
                      {booking.cars?.brand ||
                        'Unknown'}{' '}
                      {booking.cars?.model ||
                        'Car'}
                    </h2>

                  </div>

                  <span
                    className={`booking-status ${booking.status}`}
                  >
                    {booking.status}
                  </span>

                </div>

                <div className="admin-booking-customer">

                  <h3>Customer Information</h3>

                  <div className="admin-booking-details-grid">

                    <div className="booking-detail-box">

                      <span>
                        Customer Name
                      </span>

                      <strong>
                        {booking.customer?.full_name ||
                          'Unknown Customer'}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Phone Number
                      </span>

                      <strong>
                        {booking.customer?.phone ||
                          'Not available'}
                      </strong>

                    </div>

                    <div className="booking-detail-box full-width">

                      <span>
                        Customer Account ID
                      </span>

                      <strong className="booking-user-id">
                        {booking.user_id}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="admin-booking-rental">

                  <h3>Rental Information</h3>

                  <div className="admin-booking-details-grid">

                    <div className="booking-detail-box">

                      <span>
                        Car
                      </span>

                      <strong>
                        {booking.cars?.brand ||
                          'Unknown'}{' '}
                        {booking.cars?.model ||
                          'Car'}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Car Year
                      </span>

                      <strong>
                        {booking.cars?.year ||
                          'N/A'}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Pickup
                      </span>

                      <strong>
                        {formatDate(
                          booking.pickup_at
                        )}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Return
                      </span>

                      <strong>
                        {formatDate(
                          booking.return_at
                        )}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Booking Created
                      </span>

                      <strong>
                        {formatDate(
                          booking.created_at
                        )}
                      </strong>

                    </div>

                    <div className="booking-detail-box">

                      <span>
                        Total Price
                      </span>

                      <strong>
                        {Number(
                          booking.total_price || 0
                        ).toLocaleString()}{' '}
                        EGP
                      </strong>

                    </div>

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
                    disabled={
                      updatingId === booking.id
                    }
                  >
                    {updatingId === booking.id
                      ? 'Updating...'
                      : 'Accept Booking'}
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
                    disabled={
                      updatingId === booking.id
                    }
                  >
                    {updatingId === booking.id
                      ? 'Updating...'
                      : 'Mark Completed'}
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
                    disabled={
                      updatingId === booking.id
                    }
                  >
                    {updatingId === booking.id
                      ? 'Updating...'
                      : 'Refuse Booking'}
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
      )}

    </div>
  );
}

export default AdminBookings;