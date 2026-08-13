import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

import { supabase } from '../supabase';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [role, setRole] = useState('');

  const [stats, setStats] = useState({
    users: 0,
    cars: 0,
    bookings: 0,
    pendingBookings: 0,
    revenue: 0,
  });

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      navigate('/login');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (
      error ||
      (
        profile?.role !== 'admin' &&
        profile?.role !== 'super_admin'
      )
    ) {
      navigate('/');
      return;
    }

    setRole(profile.role);

    if (profile.role === 'super_admin') {
      await loadDashboardData();
    }

    setLoading(false);
  };

  const loadDashboardData = async () => {
    const [
      usersResult,
      carsResult,
      bookingsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('cars')
        .select('*', {
          count: 'exact',
          head: true,
        }),

      supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          pickup_at,
          return_at,
          status,
          total_price,
          cars (
            brand,
            model
          )
        `)
        .order('created_at', {
          ascending: true,
        }),
    ]);

    const bookingRows = bookingsResult.data || [];

    const pendingBookings = bookingRows.filter(
      (booking) => booking.status === 'pending'
    ).length;

    const revenue = bookingRows
      .filter(
        (booking) =>
          booking.status === 'confirmed' ||
          booking.status === 'completed'
      )
      .reduce(
        (total, booking) =>
          total + Number(booking.total_price || 0),
        0
      );

    setBookings(bookingRows);

    setStats({
      users: usersResult.count || 0,
      cars: carsResult.count || 0,
      bookings: bookingRows.length,
      pendingBookings,
      revenue,
    });
  };

  const clearOldData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all completed and cancelled bookings?\n\nThis action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    setClearing(true);

    const { data, error } = await supabase.rpc(
      'clear_old_booking_data'
    );

    if (error) {
      alert(`Could not clear old data: ${error.message}`);
      setClearing(false);
      return;
    }

    alert(
      `${data || 0} old booking(s) deleted successfully.`
    );

    await loadDashboardData();

    setClearing(false);
  };

  const bookingsOverTime = useMemo(() => {
    const grouped = {};

    bookings.forEach((booking) => {
      const date = new Date(
        booking.created_at
      ).toLocaleDateString();

      grouped[date] =
        (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(
      ([date, count]) => ({
        date,
        bookings: count,
      })
    );
  }, [bookings]);

  const statusData = useMemo(() => {
    const statuses = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      if (statuses[booking.status] !== undefined) {
        statuses[booking.status]++;
      }
    });

    return Object.entries(statuses)
      .map(([status, count]) => ({
        status,
        count,
      }))
      .filter((item) => item.count > 0);
  }, [bookings]);

  const mostBookedCars = useMemo(() => {
    const grouped = {};

    bookings.forEach((booking) => {
      const carName = booking.cars
        ? `${booking.cars.brand} ${booking.cars.model}`
        : 'Unknown';

      grouped[carName] =
        (grouped[carName] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([car, count]) => ({
        car,
        bookings: count,
      }))
      .sort(
        (a, b) =>
          b.bookings - a.bookings
      )
      .slice(0, 5);
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .slice(0, 5);
  }, [bookings]);

  const pieColors = [
    '#FFD700',
    '#65D46E',
    '#5FA8FF',
    '#FF6B6B',
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  /*
    LIMITED ADMIN DASHBOARD
  */

  if (role === 'admin') {
    return (
      <div className="admin-page">

        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>

            <p>
              Manage customers and create bookings.
            </p>
          </div>
        </div>

        <div className="admin-section-title">
          <div>
            <h2>Admin Tools</h2>

            <p>
              Choose what you want to manage.
            </p>
          </div>
        </div>

        <div className="admin-management admin-limited-management">

          <div className="admin-management-card">

            <div className="management-icon">
              👤
            </div>

            <h2>Manage Users</h2>

            <p>
              Add new customer accounts and remove
              existing customers.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/manage-users')
              }
            >
              Manage Users
            </button>

          </div>

          <div className="admin-management-card">

            <div className="management-icon">
              📅
            </div>

            <h2>Add Booking</h2>

            <p>
              Create a new reservation for an
              existing customer.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/admin/add-booking')
              }
            >
              Add Booking
            </button>

          </div>

        </div>

      </div>
    );
  }

  /*
    SUPER ADMIN DASHBOARD
  */

  return (
    <div className="admin-page">

      <div className="admin-header">

        <div>
          <h1>Super Admin Dashboard</h1>

          <p>
            Roadex analytics and full management.
          </p>
        </div>

        <div className="admin-header-actions">

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadDashboardData}
          >
            Refresh Data
          </button>

          <button
            type="button"
            className="clear-old-data-button"
            onClick={clearOldData}
            disabled={clearing}
          >
            {clearing
              ? 'Clearing...'
              : 'Clear Old Data'}
          </button>

        </div>

      </div>

      <div className="admin-stats">

        <div className="admin-stat-card">
          <span>Total Users</span>

          <strong>
            {stats.users}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Cars</span>

          <strong>
            {stats.cars}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Bookings</span>

          <strong>
            {stats.bookings}
          </strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending Bookings</span>

          <strong>
            {stats.pendingBookings}
          </strong>
        </div>

        <div className="admin-stat-card revenue-card">
          <span>Revenue</span>

          <strong>
            {stats.revenue.toLocaleString()}
          </strong>

          <small>EGP</small>
        </div>

      </div>

      <div className="admin-charts">

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <h2>
              Bookings Over Time
            </h2>

            <span>
              Booking activity
            </span>
          </div>

          {bookingsOverTime.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <LineChart
                data={bookingsOverTime}
                margin={{
                  top: 10,
                  right: 20,
                  left: -15,
                  bottom: 5,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2b2b2b"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: '#999',
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: '#999',
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="#FFD700"
                  strokeWidth={3}
                  dot={{
                    fill: '#FFD700',
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />

              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              No booking data yet.
            </div>
          )}

        </div>

        <div className="admin-chart-card">

          <div className="admin-chart-header">
            <h2>
              Most Booked Cars
            </h2>

            <span>
              Top 5 vehicles
            </span>
          </div>

          {mostBookedCars.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <BarChart
                data={mostBookedCars}
                margin={{
                  top: 10,
                  right: 15,
                  left: -15,
                  bottom: 15,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2b2b2b"
                />

                <XAxis
                  dataKey="car"
                  tick={{
                    fill: '#999',
                    fontSize: 11,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: '#999',
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="bookings"
                  fill="#FFD700"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              No booking data yet.
            </div>
          )}

        </div>

        <div className="admin-chart-card admin-status-chart">

          <div className="admin-chart-header">

            <h2>
              Booking Status
            </h2>

            <span>
              Current booking distribution
            </span>

          </div>

          {statusData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={250}
            >
              <PieChart>

                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  labelLine={false}
                >

                  {statusData.map(
                    (entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={
                          pieColors[
                            index %
                              pieColors.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={35}
                />

              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              No booking status data yet.
            </div>
          )}

        </div>

      </div>

      <div className="admin-section-title">

        <div>
          <h2>
            Management
          </h2>

          <p>
            Manage the main Roadex system.
          </p>
        </div>

      </div>

      <div className="admin-management">

        <div className="admin-management-card">

          <div className="management-icon">
            🚘
          </div>

          <h2>
            Cars
          </h2>

          <p>
            Add new vehicles, update details,
            change quantity and manage car images.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/cars')
            }
          >
            Manage Cars
          </button>

        </div>

        <div className="admin-management-card">

          <div className="management-icon">
            📅
          </div>

          <h2>
            Bookings
          </h2>

          <p>
            Review reservations, accept requests,
            refuse bookings and mark rentals as completed.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/bookings')
            }
          >
            Manage Bookings
          </button>

        </div>

        <div className="admin-management-card">

          <div className="management-icon">
            👤
          </div>

          <h2>
            Users
          </h2>

          <p>
            View registered customers and
            manage user roles.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/admin/users')
            }
          >
            Manage Users
          </button>

        </div>

      </div>

      <div className="admin-recent-section">

        <div className="admin-section-title">

          <div>
            <h2>
              Recent Bookings
            </h2>

            <p>
              Latest booking activity.
            </p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() =>
              navigate('/admin/bookings')
            }
          >
            View All
          </button>

        </div>

        {recentBookings.length === 0 ? (
          <div className="recent-empty">
            No bookings yet.
          </div>
        ) : (
          <div className="recent-bookings-list">

            {recentBookings.map(
              (booking) => (
                <div
                  className="recent-booking-row"
                  key={booking.id}
                >

                  <div>
                    <strong>
                      {booking.cars
                        ? `${booking.cars.brand} ${booking.cars.model}`
                        : 'Unknown Car'}
                    </strong>

                    <span>
                      {new Date(
                        booking.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <span
                    className={`dashboard-status ${booking.status}`}
                  >
                    {booking.status}
                  </span>

                  <strong>
                    {Number(
                      booking.total_price
                    ).toLocaleString()}{' '}
                    EGP
                  </strong>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

export default Admin;
