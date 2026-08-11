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
} from 'recharts';

import { supabase } from '../supabase';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

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

    if (error || profile?.role !== 'admin') {
      navigate('/');
      return;
    }

    await loadDashboardData();
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
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('cars')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          status,
          total_price,
          cars (
            brand,
            model
          )
        `)
        .order('created_at', { ascending: true }),
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

  const bookingsOverTime = useMemo(() => {
    const grouped = {};

    bookings.forEach((booking) => {
      const date = new Date(
        booking.created_at
      ).toLocaleDateString();

      grouped[date] = (grouped[date] || 0) + 1;
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

    return Object.entries(statuses).map(
      ([status, count]) => ({
        status,
        count,
      })
    );
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
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [bookings]);

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">

      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Roadex analytics and management.</p>
      </div>

      <div className="admin-stats">

        <div className="admin-stat-card">
          <span>Users</span>
          <strong>{stats.users}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Cars</span>
          <strong>{stats.cars}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Bookings</span>
          <strong>{stats.bookings}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Pending</span>
          <strong>{stats.pendingBookings}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Revenue</span>
          <strong>
            {stats.revenue.toLocaleString()} EGP
          </strong>
        </div>

      </div>

      <div className="admin-charts">

        <div className="admin-chart-card">
          <h2>Bookings Over Time</h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bookingsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#FFD700"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h2>Most Booked Cars</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mostBookedCars}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="car" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="bookings"
                fill="#FFD700"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h2>Booking Status</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                outerRadius={100}
                label
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={entry.status}
                    fill={[
                      '#FFD700',
                      '#65D46E',
                      '#5FA8FF',
                      '#FF6B6B',
                    ][index]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div className="admin-management">

        <div className="admin-management-card">
          <h2>Cars</h2>

          <p>
            Add, edit, remove cars and manage images.
          </p>

          <button
            type="button"
            onClick={() => navigate('/admin/cars')}
          >
            Manage Cars
          </button>
        </div>

        <div className="admin-management-card">
          <h2>Bookings</h2>

          <p>
            View reservations and change booking status.
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
          <h2>Users</h2>

          <p>
            View and manage registered users.
          </p>

          <button
            type="button"
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </button>
        </div>

      </div>

    </div>
  );
}

export default Admin;
