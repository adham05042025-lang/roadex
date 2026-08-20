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

  // State للـ Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [carsList, setCarsList] = useState([]);
  const [loadingCars, setLoadingCars] = useState(false);
  const [editForm, setEditForm] = useState({
    car_id: '',
    driver_name: '',
    driver_phone: '',
    customer_phone_extra: '',
    plate_number: '',
    deposit_paid: '',
    remaining_balance: '',
    pickup_at: '',
    return_at: '',
    status: '',
    total_price: '',
  });

  useEffect(() => {
    loadBookings();
    loadCars();
  }, []);

  // 🔥 حساب الأيام بـ 12 ساعة
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

  // 🔥 حساب السعر الشامل (عربية + سواق) بـ 12 ساعة
  const calculateTotalPrice = (carId, pickupAt, returnAt) => {
    if (!carId || !pickupAt || !returnAt) return 0;
    
    const car = carsList.find(c => c.id === carId);
    if (!car) return 0;
    
    const pickup = new Date(pickupAt);
    const returnDate = new Date(returnAt);
    const difference = returnDate - pickup;
    const hours = difference / (1000 * 60 * 60);
    
    if (difference <= 0) return 0;
    
    let days;
    if (hours <= 12) {
      days = 1;
    } else {
      days = Math.ceil(hours / 12);
    }
    
    // 🔥 سعر شامل (عربية + سواق)
    const totalPerDay = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
    return days * totalPerDay;
  };

  // تحميل السيارات
  const loadCars = async () => {
    setLoadingCars(true);
    const { data, error } = await supabase
      .from('cars')
      .select('id, brand, model, year, price_per_day, driver_price_per_day')
      .order('brand', { ascending: true });

    if (!error && data) {
      setCarsList(data);
    }
    setLoadingCars(false);
  };

  const loadBookings = async () => {
    setLoading(true);
    setMessage('');

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        user_id,
        car_id,
        pickup_at,
        return_at,
        status,
        total_price,
        created_at,
        driver_name,
        driver_phone,
        customer_phone_extra,
        plate_number,
        deposit_paid,
        remaining_balance,
        contract_url,
        cars (
          id,
          brand,
          model,
          year,
          price_per_day,
          driver_price_per_day
        )
      `);

    if (bookingError) {
      setMessage(bookingError.message);
      setBookings([]);
      setLoading(false);
      return;
    }

    const bookingRows = bookingData || [];
    const customerIds = [...new Set(bookingRows.map((b) => b.user_id).filter(Boolean))];

    let profileMap = {};

    if (customerIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', customerIds);

      if (profileError) {
        setMessage(`Bookings loaded, but customer details could not be loaded: ${profileError.message}`);
      } else {
        profileMap = Object.fromEntries(
          (profileData || []).map((profile) => [profile.id, profile])
        );
      }

      const { data: emailData, error: emailError } = await supabase
        .rpc('get_users_with_emails');

      if (!emailError && emailData) {
        emailData.forEach((user) => {
          if (profileMap[user.id]) {
            profileMap[user.id] = {
              ...profileMap[user.id],
              email: user.email,
            };
          }
        });
      }
    }

    const combinedBookings = bookingRows.map((booking) => ({
      ...booking,
      customer: profileMap[booking.user_id] || null,
    }));

    setBookings(combinedBookings);
    setLoading(false);
  };

  const updateStatus = async (bookingId, newStatus) => {
    setMessage('');

    if (newStatus === 'cancelled') {
      const confirmed = window.confirm('Are you sure you want to cancel this booking?');
      if (!confirmed) return;
    }

    if (newStatus === 'completed') {
      const confirmed = window.confirm('Are you sure you want to mark this rental as completed?');
      if (!confirmed) return;
    }

    setUpdatingId(bookingId);

    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    const statusMessages = {
      confirmed: 'Booking accepted successfully.',
      completed: 'Rental completed successfully. The car is available again.',
      cancelled: 'Booking cancelled successfully. The car is available again.',
    };
    setMessage(statusMessages[newStatus] || 'Booking updated successfully.');

    await loadBookings();
    setUpdatingId('');
  };

  // توليد العقد
  const handleContract = async (booking) => {
    setMessage('');
    setUpdatingId(booking.id);

    try {
      const { data, error } = await supabase
        .rpc('generate_contract', {
          p_booking_id: booking.id,
        });

      if (error) {
        setMessage(error.message);
        setUpdatingId('');
        return;
      }

      if (data) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(data);
          newWindow.document.close();
        } else {
          setMessage('Please allow popups for this site.');
        }
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUpdatingId('');
    }
  };

  // حساب الباقي لحظياً
  const calculateRemaining = () => {
    const total = Number(editForm.total_price) || 0;
    const deposit = Number(editForm.deposit_paid) || 0;
    return total - deposit;
  };

  // فتح Modal
  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      car_id: booking.car_id || '',
      driver_name: booking.driver_name || '',
      driver_phone: booking.driver_phone || '',
      customer_phone_extra: booking.customer_phone_extra || '',
      plate_number: booking.plate_number || '',
      deposit_paid: booking.deposit_paid || '',
      remaining_balance: booking.remaining_balance || '',
      pickup_at: booking.pickup_at ? booking.pickup_at.slice(0, 16) : '',
      return_at: booking.return_at ? booking.return_at.slice(0, 16) : '',
      status: booking.status || 'pending',
      total_price: booking.total_price || '',
    });
    setShowEditModal(true);
  };

  // إغلاق Modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingBooking(null);
    setEditForm({
      car_id: '',
      driver_name: '',
      driver_phone: '',
      customer_phone_extra: '',
      plate_number: '',
      deposit_paid: '',
      remaining_balance: '',
      pickup_at: '',
      return_at: '',
      status: '',
      total_price: '',
    });
  };

  // حفظ التعديلات
  const saveEdit = async () => {
    if (!editingBooking) return;

    setMessage('');
    setUpdatingId(editingBooking.id);

    if (new Date(editForm.return_at) <= new Date(editForm.pickup_at)) {
      setMessage('Return time must be after pickup time.');
      setUpdatingId('');
      return;
    }

    if (!editForm.car_id) {
      setMessage('Please select a car.');
      setUpdatingId('');
      return;
    }

    // 🔥 حساب السعر الشامل بـ 12 ساعة
    const calculatedTotal = calculateTotalPrice(editForm.car_id, editForm.pickup_at, editForm.return_at);
    const total = calculatedTotal > 0 ? calculatedTotal : Number(editForm.total_price) || 0;
    const deposit = Number(editForm.deposit_paid) || 0;
    const remaining = total - deposit;

    const { error } = await supabase
      .from('bookings')
      .update({
        car_id: editForm.car_id,
        driver_name: editForm.driver_name.trim() || null,
        driver_phone: editForm.driver_phone.trim() || null,
        customer_phone_extra: editForm.customer_phone_extra.trim() || null,
        plate_number: editForm.plate_number.trim() || null,
        deposit_paid: deposit,
        remaining_balance: remaining,
        pickup_at: new Date(editForm.pickup_at).toISOString(),
        return_at: new Date(editForm.return_at).toISOString(),
        status: editForm.status,
        total_price: total,
      })
      .eq('id', editingBooking.id);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    setMessage('Booking updated successfully!');
    closeEditModal();
    await loadBookings();
    setUpdatingId('');
  };

  const visibleBookings = useMemo(() => {
    const normalizedSearch = searchNumber.trim().replace(/^#/, '');

    return [...bookings]
      .filter((booking) => {
        if (!normalizedSearch) return true;
        return String(booking.booking_number || '').includes(normalizedSearch);
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
      });
  }, [bookings, searchNumber, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((current) => (current === 'newest' ? 'oldest' : 'newest'));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // 🔥 حساب السعر الشامل للسيارة
  const getTotalPerDay = (car) => {
    if (!car) return 0;
    return Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
  };

  return (
    <div className="admin-bookings-page">
      <div className="admin-bookings-header">
        <h1>Manage <span>Bookings</span></h1>
        <p>Search reservations, review customer details and manage booking status.</p>
      </div>

      {/* Toolbar */}
      <div className="admin-bookings-toolbar">
        <div className="admin-booking-search">
          <label htmlFor="booking-number-search">Search by Booking Number</label>
          <input
            id="booking-number-search"
            type="text"
            inputMode="numeric"
            placeholder="Example: 25"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value.replace(/[^0-9#]/g, ''))}
          />
        </div>

        <div className="admin-bookings-toolbar-actions">
          <button type="button" className="sort-bookings-button" onClick={toggleSortOrder}>
            {sortOrder === 'newest' ? '📅 Newest First' : '📅 Oldest First'}
          </button>
          <button type="button" className="refresh-bookings-button" onClick={loadBookings} disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="admin-bookings-results">
        <span>📋 {visibleBookings.length} {visibleBookings.length === 1 ? 'booking' : 'bookings'}</span>
        <span>Sorted: {sortOrder === 'newest' ? 'newest first' : 'oldest first'}</span>
      </div>

      {/* Message */}
      {message && <div className="admin-bookings-message">{message}</div>}

      {/* Loading */}
      {loading && <div className="admin-bookings-empty">Loading bookings...</div>}

      {/* Empty */}
      {!loading && visibleBookings.length === 0 && (
        <div className="admin-bookings-empty">
          {searchNumber ? 'No booking matches that number.' : 'No bookings found.'}
        </div>
      )}

      {/* Bookings List */}
      {!loading && (
        <div className="admin-bookings-list">
          {visibleBookings.map((booking) => (
            <div className="admin-booking-card" key={booking.id}>
              {/* Header */}
              <div className="admin-booking-header">
                <div className="admin-booking-title">
                  <span className="booking-number"># {booking.booking_number}</span>
                  <h2>{booking.cars?.brand || 'Unknown'} {booking.cars?.model || 'Car'}</h2>
                </div>
                <span className={`booking-status ${booking.status}`}>{booking.status}</span>
              </div>

              {/* Customer Info */}
              <div className="admin-booking-customer">
                <div className="admin-booking-details-grid">
                  <div className="booking-detail-box">
                    <span>Customer</span>
                    <strong>{booking.customer?.full_name || 'Unknown'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Email</span>
                    <strong className="customer-email">{booking.customer?.email || 'N/A'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Phone</span>
                    <strong>{booking.customer?.phone || 'N/A'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Extra Phone</span>
                    <strong>{booking.customer_phone_extra || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Driver Info */}
              <div className="admin-booking-driver">
                <div className="admin-booking-details-grid">
                  <div className="booking-detail-box">
                    <span>Driver Name</span>
                    <strong>{booking.driver_name || 'Not assigned'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Driver Phone</span>
                    <strong>{booking.driver_phone || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Rental Info */}
              <div className="admin-booking-rental">
                <div className="admin-booking-details-grid">
                  <div className="booking-detail-box">
                    <span>Car</span>
                    <strong>{booking.cars?.brand || 'Unknown'} {booking.cars?.model || 'Car'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Year</span>
                    <strong>{booking.cars?.year || 'N/A'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Pickup</span>
                    <strong>{formatDate(booking.pickup_at)}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Return</span>
                    <strong>{formatDate(booking.return_at)}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Created</span>
                    <strong>{formatDate(booking.created_at)}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Rental Days</span>
                    <strong>
                      {calculateRentalDays(booking.pickup_at, booking.return_at)} days
                      <small style={{ color: '#888', fontSize: '10px', display: 'block' }}>
                        (12h = 1 day)
                      </small>
                    </strong>
                  </div>
                  {/* 🔥 سعر شامل */}
                  <div className="booking-detail-box">
                    <span>Price Per Day</span>
                    <strong>
                      {getTotalPerDay(booking.cars).toLocaleString()} EGP
                      <small style={{ color: '#888', fontSize: '10px', display: 'block' }}>
                        (Car + Driver)
                      </small>
                    </strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Plate Number</span>
                    <strong>{booking.plate_number || 'N/A'}</strong>
                  </div>
                  <div className="booking-detail-box">
                    <span>Deposit</span>
                    <strong>{Number(booking.deposit_paid || 0).toLocaleString()} EGP</strong>
                  </div>
                  <div className="booking-detail-box total-price">
                    <span>Remaining</span>
                    <strong>{Number(booking.remaining_balance || 0).toLocaleString()} EGP</strong>
                  </div>
                  <div className="booking-detail-box total-price">
                    <span>Total</span>
                    <strong>{Number(booking.total_price || 0).toLocaleString()} EGP</strong>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-booking-actions">
                {booking.status === 'pending' && (
                  <button
                    type="button"
                    className="accept-booking"
                    onClick={() => updateStatus(booking.id, 'confirmed')}
                    disabled={updatingId === booking.id}
                  >
                    {updatingId === booking.id ? '⏳' : '✅ Accept'}
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <button
                    type="button"
                    className="complete-booking"
                    onClick={() => updateStatus(booking.id, 'completed')}
                    disabled={updatingId === booking.id}
                  >
                    {updatingId === booking.id ? '⏳' : '✅ Complete'}
                  </button>
                )}

                {(booking.status === 'pending' || booking.status === 'confirmed') && (
                  <button
                    type="button"
                    className="refuse-booking"
                    onClick={() => updateStatus(booking.id, 'cancelled')}
                    disabled={updatingId === booking.id}
                  >
                    {updatingId === booking.id ? '⏳' : '❌ Cancel'}
                  </button>
                )}

                <button
                  type="button"
                  className="contract-booking"
                  onClick={() => handleContract(booking)}
                  disabled={updatingId === booking.id}
                >
                  {updatingId === booking.id ? '⏳' : '📄 Contract'}
                </button>

                <button
                  type="button"
                  className="edit-booking-btn"
                  onClick={() => openEditModal(booking)}
                >
                  ✏️ Edit All
                </button>

                {booking.status === 'completed' && (
                  <div className="booking-final-state">✅ Completed</div>
                )}

                {booking.status === 'cancelled' && (
                  <div className="booking-final-state cancelled">❌ Cancelled</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {showEditModal && editingBooking && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Booking #{editingBooking.booking_number}</h2>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Car Selection */}
              <div className="modal-field">
                <label>Select Car *</label>
                <select
                  value={editForm.car_id}
                  onChange={(e) => setEditForm({ ...editForm, car_id: e.target.value })}
                >
                  <option value="">-- Select Car --</option>
                  {carsList.map((car) => {
                    const totalPerDay = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
                    return (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} ({car.year}) - {totalPerDay.toLocaleString()} EGP/day (Car + Driver)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Driver Name */}
              <div className="modal-field">
                <label>Driver Name</label>
                <input
                  type="text"
                  placeholder="Enter driver name"
                  value={editForm.driver_name}
                  onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })}
                />
              </div>

              {/* Driver Phone */}
              <div className="modal-field">
                <label>Driver Phone</label>
                <input
                  type="text"
                  placeholder="Enter driver phone"
                  value={editForm.driver_phone}
                  onChange={(e) => setEditForm({ ...editForm, driver_phone: e.target.value })}
                />
              </div>

              {/* Customer Extra Phone */}
              <div className="modal-field">
                <label>Customer Extra Phone</label>
                <input
                  type="text"
                  placeholder="Enter extra customer phone"
                  value={editForm.customer_phone_extra}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone_extra: e.target.value })}
                />
              </div>

              {/* Plate Number */}
              <div className="modal-field">
                <label>Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g., ABC 1234"
                  value={editForm.plate_number}
                  onChange={(e) => setEditForm({ ...editForm, plate_number: e.target.value })}
                />
              </div>

              {/* Deposit Paid */}
              <div className="modal-field">
                <label>Deposit Paid (EGP)</label>
                <input
                  type="number"
                  placeholder="Enter deposit amount"
                  value={editForm.deposit_paid}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditForm({ 
                      ...editForm, 
                      deposit_paid: val,
                      remaining_balance: (Number(editForm.total_price) || 0) - (Number(val) || 0)
                    });
                  }}
                />
                <small style={{ color: '#888', fontSize: '11px' }}>
                  Remaining will be calculated automatically
                </small>
              </div>

              {/* Remaining Balance (للقراءة فقط) */}
              <div className="modal-field">
                <label>Remaining Balance (EGP)</label>
                <input
                  type="text"
                  value={calculateRemaining().toLocaleString()}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', background: '#0d0d0d' }}
                />
              </div>

              {/* Pickup Date */}
              <div className="modal-field">
                <label>Pickup Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.pickup_at}
                  onChange={(e) => setEditForm({ ...editForm, pickup_at: e.target.value })}
                />
              </div>

              {/* Return Date */}
              <div className="modal-field">
                <label>Return Date & Time</label>
                <input
                  type="datetime-local"
                  value={editForm.return_at}
                  onChange={(e) => setEditForm({ ...editForm, return_at: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="modal-field">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Total Price */}
              <div className="modal-field">
                <label>Total Price (EGP)</label>
                <input
                  type="number"
                  placeholder="Enter total price"
                  value={editForm.total_price}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditForm({ 
                      ...editForm, 
                      total_price: val,
                      remaining_balance: (Number(val) || 0) - (Number(editForm.deposit_paid) || 0)
                    });
                  }}
                />
                <small style={{ color: '#888', fontSize: '11px' }}>
                  Price will be auto-calculated based on 12h/day
                </small>
              </div>

              {/* Message */}
              {message && <div className="modal-message">{message}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="modal-cancel" onClick={closeEditModal}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-save"
                onClick={saveEdit}
                disabled={updatingId === editingBooking.id}
              >
                {updatingId === editingBooking.id ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;