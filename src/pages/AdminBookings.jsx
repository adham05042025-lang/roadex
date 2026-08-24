import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { formatDate24 } from '../utils/formatDate';
import './AdminBookings.css';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [message, setMessage] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('All');

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
    with_driver: false,
  });

  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState(null);
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  useEffect(() => {
    loadBookings();
    loadCars();
  }, []);

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

  const calculateExtraDays = (oldDate, newDate) => {
    const diff = newDate - oldDate;
    const hours = diff / (1000 * 60 * 60);
    if (hours <= 0) return 0;
    if (hours <= 12) return 1;
    return Math.ceil(hours / 12);
  };

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
    const totalPerDay = Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
    return days * totalPerDay;
  };

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
        extended_until,
        extension_reason,
        with_driver,
        driver_price_per_day,
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

  const isExpired = (returnAt, status) => {
    const now = new Date();
    return (status === 'pending' || status === 'confirmed') && new Date(returnAt) < now;
  };

  const deleteBooking = async (bookingId) => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to permanently delete this booking?\n\n' +
      'This action cannot be undone!\n' +
      'All related data (contract, notifications, etc.) will be removed.'
    );
    if (!confirmed) return;

    setMessage('');
    setUpdatingId(bookingId);

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        setMessage('Error deleting booking: ' + error.message);
        setUpdatingId('');
        return;
      }

      setMessage('✅ Booking deleted successfully!');
      await loadBookings();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setUpdatingId('');
    }
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
    
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('total_price, deposit_paid, remaining_balance, booking_number, status, user_id, car_id, with_driver')
      .eq('id', bookingId)
      .single();
      
    if (fetchError) {
      setMessage(fetchError.message);
      setUpdatingId('');
      return;
    }
    
    const oldStatus = booking.status;
    const bookingNumber = booking.booking_number;
    
    const carData = await supabase
      .from('cars')
      .select('brand, model')
      .eq('id', booking.car_id)
      .single();
      
    const carName = carData.data ? `${carData.data.brand} ${carData.data.model}` : 'Car';
    
    let deposit = booking.deposit_paid || 0;
    let remaining = booking.remaining_balance || 0;
    const total = booking.total_price || 0;
    
    if (newStatus === 'cancelled') {
      deposit = 0;
      remaining = 0;
    } else if (newStatus === 'completed') {
      deposit = total;
      remaining = 0;
    } else if (newStatus === 'confirmed') {
      if (deposit === 0 && total > 0) {
        deposit = Math.round(total * 0.3);
        remaining = total - deposit;
      }
    }
    
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: newStatus,
        deposit_paid: deposit,
        remaining_balance: remaining,
      })
      .eq('id', bookingId);
      
    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }
    
    await supabase
      .from('notifications')
      .insert({
        type: 'status_change',
        title: `Booking #${bookingNumber} status changed`,
        message: `Status changed from ${oldStatus} to ${newStatus}`,
        link: `/admin/bookings`,
      });

    let notifType = 'status_change';
    let notifTitle = `Your booking #${bookingNumber} is ${newStatus}`;
    let notifMessage = `Your booking for ${carName} is now ${newStatus}`;

    if (newStatus === 'confirmed') {
      notifType = 'booking_confirmed';
      notifTitle = `✅ Booking #${bookingNumber} confirmed!`;
      notifMessage = `Your booking for ${carName} has been confirmed.`;
    } else if (newStatus === 'completed') {
      notifType = 'booking_completed';
      notifTitle = `🏁 Booking #${bookingNumber} completed!`;
      notifMessage = `Your rental for ${carName} has been completed. Thank you!`;
    } else if (newStatus === 'cancelled') {
      notifType = 'booking_cancelled';
      notifTitle = `❌ Booking #${bookingNumber} cancelled`;
      notifMessage = `Your booking for ${carName} has been cancelled.`;
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        link: `/my-bookings`,
      });
    
    const statusMessages = {
      confirmed: 'Booking accepted successfully.',
      completed: 'Rental completed successfully. The car is available again.',
      cancelled: 'Booking cancelled successfully. The car is available again.',
    };
    setMessage(statusMessages[newStatus] || 'Booking updated successfully.');
    
    await loadBookings();
    setUpdatingId('');
  };

  const handleContract = async (booking) => {
    setMessage('');
    setUpdatingId(booking.id);
    try {
      // جلب العقد المناسب من جدول contracts
      const contractName = booking.with_driver ? 'With Driver Contract' : 'Without Driver Contract';
      
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('template_html')
        .eq('name', contractName)
        .eq('is_active', true)
        .single();

      if (contractError) {
        // لو مفيش عقد matching، استخدم الـ contract_url القديم
        if (booking.contract_url) {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(booking.contract_url);
            newWindow.document.close();
          } else {
            setMessage('Please allow popups for this site.');
          }
          setUpdatingId('');
          return;
        }
        setMessage(contractError.message);
        setUpdatingId('');
        return;
      }

      if (contractData && contractData.template_html) {
        // استبدال المتغيرات في العقد
        let contractHtml = contractData.template_html
          .replace(/\{\{booking_number\}\}/g, booking.booking_number || 'N/A')
          .replace(/\{\{signature_date\}\}/g, new Date().toLocaleDateString('en-US'))
          .replace(/\{\{customer_name\}\}/g, booking.customer?.full_name || 'N/A')
          .replace(/\{\{customer_phone\}\}/g, booking.customer?.phone || 'N/A')
          .replace(/\{\{car_name\}\}/g, `${booking.cars?.brand || 'N/A'} ${booking.cars?.model || 'N/A'}`)
          .replace(/\{\{plate_number\}\}/g, booking.plate_number || 'N/A')
          .replace(/\{\{driver_name\}\}/g, booking.driver_name || 'N/A')
          .replace(/\{\{driver_phone\}\}/g, booking.driver_phone || 'N/A')
          .replace(/\{\{pickup_at\}\}/g, formatDate24(booking.pickup_at))
          .replace(/\{\{pickup_location\}\}/g, 'Cairo')
          .replace(/\{\{total_price\}\}/g, booking.total_price || 0)
          .replace(/\{\{deposit_paid\}\}/g, booking.deposit_paid || 0)
          .replace(/\{\{remaining_balance\}\}/g, booking.remaining_balance || 0);

        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(contractHtml);
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

  const calculateRemaining = () => {
    const total = Number(editForm.total_price) || 0;
    const deposit = Number(editForm.deposit_paid) || 0;
    return total - deposit;
  };

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
      with_driver: booking.with_driver || false,
    });
    setShowEditModal(true);
  };

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
      with_driver: false,
    });
  };

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
        with_driver: editForm.with_driver,
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
    const now = new Date();

    return [...bookings]
      .filter((booking) => {
        if (normalizedSearch) {
          return String(booking.booking_number || '').includes(normalizedSearch);
        }
        return true;
      })
      .filter((booking) => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'expired') {
          return isExpired(booking.return_at, booking.status);
        }
        return booking.status === statusFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
      });
  }, [bookings, searchNumber, sortOrder, statusFilter]);

  const toggleSortOrder = () => {
    setSortOrder((current) => (current === 'newest' ? 'oldest' : 'newest'));
  };

  const getTotalPerDay = (car) => {
    if (!car) return 0;
    return Number(car.price_per_day) + Number(car.driver_price_per_day || 0);
  };

  const statusCounts = useMemo(() => {
    const counts = { All: bookings.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, expired: 0 };
    const now = new Date();
    bookings.forEach((b) => {
      if (b.status === 'pending' || b.status === 'confirmed' || b.status === 'completed' || b.status === 'cancelled') {
        counts[b.status]++;
      }
      if (isExpired(b.return_at, b.status)) {
        counts.expired++;
      }
    });
    return counts;
  }, [bookings]);

  const statusLabels = {
    All: `All (${statusCounts.All})`,
    pending: `Pending (${statusCounts.pending})`,
    confirmed: `Confirmed (${statusCounts.confirmed})`,
    completed: `Completed (${statusCounts.completed})`,
    cancelled: `Cancelled (${statusCounts.cancelled})`,
    expired: `Expired (${statusCounts.expired})`,
  };

  const openExtensionModal = (booking) => {
    setExtendingBooking(booking);
    setExtensionDate(booking.return_at ? new Date(booking.return_at).toISOString().slice(0, 16) : '');
    setExtensionReason(booking.extension_reason || '');
    setShowExtensionModal(true);
  };

  const saveExtension = async () => {
    if (!extendingBooking) return;
    if (!extensionDate) {
      setMessage('Please select a new return date.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to extend this booking until ${formatDate24(extensionDate)}?`);
    if (!confirmed) return;

    setMessage('');
    setUpdatingId(extendingBooking.id);

    const newReturnDate = new Date(extensionDate);
    const oldReturnDate = new Date(extendingBooking.return_at);
    
    const extraDays = calculateExtraDays(oldReturnDate, newReturnDate);
    const totalPerDay = getTotalPerDay(extendingBooking.cars);
    const extraCost = extraDays * totalPerDay;
    const newTotal = Number(extendingBooking.total_price) + extraCost;

    const { error } = await supabase
      .from('bookings')
      .update({
        return_at: newReturnDate.toISOString(),
        total_price: newTotal,
        extended_until: null,
        extension_reason: null,
        status: 'confirmed'
      })
      .eq('id', extendingBooking.id);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    setMessage(`Extension approved! New return date: ${formatDate24(extensionDate)}. Additional cost: ${extraCost.toLocaleString()} EGP`);
    setShowExtensionModal(false);
    setExtendingBooking(null);
    setExtensionDate('');
    setExtensionReason('');
    await loadBookings();
    setUpdatingId('');
  };

  const approveExtension = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to approve the extension request?');
    if (!confirmed) return;

    setMessage('');
    setUpdatingId(bookingId);

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !booking.extended_until) {
      setMessage('No extension request found.');
      setUpdatingId('');
      return;
    }

    const newReturnDate = new Date(booking.extended_until);
    const oldReturnDate = new Date(booking.return_at);
    
    const extraDays = calculateExtraDays(oldReturnDate, newReturnDate);
    const totalPerDay = getTotalPerDay(booking.cars);
    const extraCost = extraDays * totalPerDay;
    const newTotal = Number(booking.total_price) + extraCost;

    const { error } = await supabase
      .from('bookings')
      .update({
        return_at: booking.extended_until,
        total_price: newTotal,
        extended_until: null,
        extension_reason: null,
        status: 'confirmed'
      })
      .eq('id', bookingId);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        type: 'extension_approved',
        title: `Extension approved for booking #${booking.booking_number}`,
        message: `Your booking has been extended until ${formatDate24(booking.extended_until)}`,
        link: `/my-bookings`,
      });

    setMessage(`Extension approved! Additional cost: ${extraCost.toLocaleString()} EGP`);
    await loadBookings();
    setUpdatingId('');
  };

  const rejectExtension = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to reject the extension request?');
    if (!confirmed) return;

    setMessage('');
    setUpdatingId(bookingId);

    const booking = bookings.find(b => b.id === bookingId);

    const { error } = await supabase
      .from('bookings')
      .update({
        extended_until: null,
        extension_reason: null
      })
      .eq('id', bookingId);

    if (error) {
      setMessage(error.message);
      setUpdatingId('');
      return;
    }

    await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        type: 'extension_rejected',
        title: `Extension rejected for booking #${booking.booking_number}`,
        message: `Your extension request has been rejected.`,
        link: `/my-bookings`,
      });

    setMessage('Extension request rejected.');
    await loadBookings();
    setUpdatingId('');
  };

  const getDriverStatus = (booking) => {
    if (booking.with_driver === true) {
      return 'With Driver';
    }
    return 'Without Driver';
  };

  return (
    <div className="admin-bookings-page">
      <div className="admin-bookings-header">
        <h1>Manage <span>Bookings</span></h1>
        <p>Search reservations, review customer details and manage booking status.</p>
      </div>

      <div className="admin-bookings-filters">
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`status-filter-btn ${statusFilter === key ? 'active' : ''} ${key}`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

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

      <div className="admin-bookings-results">
        <span>📋 {visibleBookings.length} {visibleBookings.length === 1 ? 'booking' : 'bookings'}</span>
        <span>Sorted: {sortOrder === 'newest' ? 'newest first' : 'oldest first'}</span>
      </div>

      {message && <div className="admin-bookings-message">{message}</div>}

      {loading && <div className="admin-bookings-empty">Loading bookings...</div>}

      {!loading && visibleBookings.length === 0 && (
        <div className="admin-bookings-empty">
          {searchNumber ? 'No booking matches that number.' : 'No bookings found.'}
        </div>
      )}

      {!loading && (
        <div className="admin-bookings-list">
          {visibleBookings.map((booking) => {
            const expired = isExpired(booking.return_at, booking.status);
            const driverStatus = getDriverStatus(booking);
            return (
              <div className={`admin-booking-card ${expired ? 'expired' : ''}`} key={booking.id}>
                <div className="admin-booking-header">
                  <div className="admin-booking-title">
                    <span className="booking-number"># {booking.booking_number}</span>
                    <h2>{booking.cars?.brand || 'Unknown'} {booking.cars?.model || 'Car'}</h2>
                  </div>
                  <div className="admin-booking-status-group">
                    <span className={`booking-status ${booking.status}`}>{booking.status}</span>
                    {expired && <span className="booking-status expired">Expired</span>}
                    {booking.extended_until && <span className="booking-status pending">Extension Requested</span>}
                  </div>
                </div>

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
                    <div className="booking-detail-box">
                      <span>Driver Status</span>
                      <strong className={`driver-status ${driverStatus === 'With Driver' ? 'with-driver' : 'without-driver'}`}>
                        {driverStatus}
                      </strong>
                    </div>
                  </div>
                </div>

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
                      <strong>{formatDate24(booking.pickup_at)}</strong>
                    </div>
                    <div className="booking-detail-box">
                      <span>Return</span>
                      <strong>{formatDate24(booking.return_at)}</strong>
                      {expired && <span className="expired-label">⚠️ Past Due</span>}
                      {booking.extended_until && (
                        <small style={{ color: '#ffc107', display: 'block' }}>
                          Extension Request: {formatDate24(booking.extended_until)}
                        </small>
                      )}
                    </div>
                    <div className="booking-detail-box">
                      <span>Created</span>
                      <strong>{formatDate24(booking.created_at)}</strong>
                    </div>
                    <div className="booking-detail-box">
                      <span>Rental Days</span>
                      <strong>
                        {calculateRentalDays(booking.pickup_at, booking.return_at)} days
                        <small style={{ color: '#888', fontSize: '10px', display: 'block' }}>(12h = 1 day)</small>
                      </strong>
                    </div>
                    <div className="booking-detail-box">
                      <span>Price Per Day</span>
                      <strong>
                        {getTotalPerDay(booking.cars).toLocaleString()} EGP
                        <small style={{ color: '#888', fontSize: '10px', display: 'block' }}>
                          Car: {Number(booking.cars?.price_per_day || 0).toLocaleString()} + Driver: {Number(booking.cars?.driver_price_per_day || 0).toLocaleString()} EGP
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

                <div className="admin-booking-actions">
                  {booking.status === 'pending' && (
                    <button className="accept-booking" onClick={() => updateStatus(booking.id, 'confirmed')} disabled={updatingId === booking.id}>
                      {updatingId === booking.id ? '⏳' : '✅ Accept'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button className="complete-booking" onClick={() => updateStatus(booking.id, 'completed')} disabled={updatingId === booking.id}>
                      {updatingId === booking.id ? '⏳' : '✅ Complete'}
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button className="refuse-booking" onClick={() => updateStatus(booking.id, 'cancelled')} disabled={updatingId === booking.id}>
                      {updatingId === booking.id ? '⏳' : '❌ Cancel'}
                    </button>
                  )}

                  <button className="extend-booking-admin-btn" onClick={() => openExtensionModal(booking)} disabled={updatingId === booking.id}>
                    {updatingId === booking.id ? '⏳' : '📅 Extend'}
                  </button>

                  {booking.extended_until && (
                    <>
                      <button className="approve-extension-btn" onClick={() => approveExtension(booking.id)} disabled={updatingId === booking.id}>
                        {updatingId === booking.id ? '⏳' : '✅ Approve'}
                      </button>
                      <button className="reject-extension-btn" onClick={() => rejectExtension(booking.id)} disabled={updatingId === booking.id}>
                        {updatingId === booking.id ? '⏳' : '❌ Reject'}
                      </button>
                    </>
                  )}

                  <button className="contract-booking" onClick={() => handleContract(booking)} disabled={updatingId === booking.id}>
                    {updatingId === booking.id ? '⏳' : '📄 Contract'}
                  </button>
                  <button className="edit-booking-btn" onClick={() => openEditModal(booking)}>
                    ✏️ Edit All
                  </button>

                  <button 
                    className="delete-booking-btn" 
                    onClick={() => deleteBooking(booking.id)} 
                    disabled={updatingId === booking.id}
                    title="Permanently delete this booking"
                  >
                    {updatingId === booking.id ? '⏳' : '🗑️ Delete'}
                  </button>

                  {booking.status === 'completed' && <div className="booking-final-state">✅ Completed</div>}
                  {booking.status === 'cancelled' && <div className="booking-final-state cancelled">❌ Cancelled</div>}
                  {expired && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="booking-final-state expired-state">⚠️ Expired</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showExtensionModal && extendingBooking && (
        <div className="modal-overlay" onClick={() => setShowExtensionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Extend Booking #{extendingBooking.booking_number}</h2>
              <button className="modal-close" onClick={() => setShowExtensionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Current Return Date</label>
                <input type="text" value={formatDate24(extendingBooking.return_at)} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="modal-field">
                <label>New Return Date *</label>
                <input
                  type="datetime-local"
                  value={extensionDate}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setExtensionDate(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label>Reason (optional)</label>
                <input
                  type="text"
                  placeholder="Reason for extension..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label>Price Per Day</label>
                <input type="text" value={`${getTotalPerDay(extendingBooking.cars).toLocaleString()} EGP`} disabled style={{ opacity: 0.7 }} />
              </div>
              {extensionDate && extendingBooking && (
                <div className="modal-field">
                  <label>Additional Cost</label>
                  <input 
                    type="text" 
                    value={(() => {
                      const newDate = new Date(extensionDate);
                      const oldDate = new Date(extendingBooking.return_at);
                      const extraDays = calculateExtraDays(oldDate, newDate);
                      const totalPerDay = getTotalPerDay(extendingBooking.cars);
                      const extraCost = extraDays * totalPerDay;
                      return extraDays > 0 ? `${extraCost.toLocaleString()} EGP (${extraDays} extra days)` : '0 EGP';
                    })()} 
                    disabled 
                    style={{ opacity: 0.7 }}
                  />
                </div>
              )}
              {message && <div className="modal-message">{message}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-cancel" onClick={() => setShowExtensionModal(false)}>Cancel</button>
              <button type="button" className="modal-save" onClick={saveExtension} disabled={updatingId === extendingBooking.id}>
                {updatingId === extendingBooking.id ? '⏳ Saving...' : '💾 Apply Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingBooking && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Booking #{editingBooking.booking_number}</h2>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Select Car *</label>
                <select value={editForm.car_id} onChange={(e) => setEditForm({ ...editForm, car_id: e.target.value })}>
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
              <div className="modal-field">
                <label>Driver Name</label>
                <input type="text" placeholder="Enter driver name" value={editForm.driver_name} onChange={(e) => setEditForm({ ...editForm, driver_name: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>Driver Phone</label>
                <input type="text" placeholder="Enter driver phone" value={editForm.driver_phone} onChange={(e) => setEditForm({ ...editForm, driver_phone: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>Customer Extra Phone</label>
                <input type="text" placeholder="Enter extra customer phone" value={editForm.customer_phone_extra} onChange={(e) => setEditForm({ ...editForm, customer_phone_extra: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>Plate Number</label>
                <input type="text" placeholder="e.g., ABC 1234" value={editForm.plate_number} onChange={(e) => setEditForm({ ...editForm, plate_number: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>Deposit Paid (EGP)</label>
                <input type="number" placeholder="Enter deposit amount" value={editForm.deposit_paid} onChange={(e) => {
                  const val = e.target.value;
                  setEditForm({ ...editForm, deposit_paid: val, remaining_balance: (Number(editForm.total_price) || 0) - (Number(val) || 0) });
                }} />
                <small style={{ color: '#888', fontSize: '11px' }}>Remaining will be calculated automatically</small>
              </div>
              <div className="modal-field">
                <label>Remaining Balance (EGP)</label>
                <input type="text" value={calculateRemaining().toLocaleString()} disabled style={{ opacity: 0.7, cursor: 'not-allowed', background: '#0d0d0d' }} />
              </div>
              <div className="modal-field">
                <label>Pickup Date & Time</label>
                <input type="datetime-local" value={editForm.pickup_at} onChange={(e) => setEditForm({ ...editForm, pickup_at: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>Return Date & Time</label>
                <input type="datetime-local" value={editForm.return_at} onChange={(e) => setEditForm({ ...editForm, return_at: e.target.value })} />
              </div>
              <div className="modal-field">
                <label>With Driver</label>
                <select value={editForm.with_driver} onChange={(e) => setEditForm({ ...editForm, with_driver: e.target.value === 'true' })}>
                  <option value="false">Without Driver</option>
                  <option value="true">With Driver</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Total Price (EGP)</label>
                <input type="number" placeholder="Enter total price" value={editForm.total_price} onChange={(e) => {
                  const val = e.target.value;
                  setEditForm({ ...editForm, total_price: val, remaining_balance: (Number(val) || 0) - (Number(editForm.deposit_paid) || 0) });
                }} />
                <small style={{ color: '#888', fontSize: '11px' }}>Price will be auto-calculated based on 12h/day</small>
              </div>
              {message && <div className="modal-message">{message}</div>}
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-cancel" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="modal-save" onClick={saveEdit} disabled={updatingId === editingBooking.id}>
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