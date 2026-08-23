import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { supabase } from '../supabase';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [role, setRole] = useState('');
  const [timeframe, setTimeframe] = useState('7d');

  const [stats, setStats] = useState({
    users: 0,
    cars: 0,
    bookings: 0,
    pendingBookings: 0,
    expiredBookings: 0,
    revenue: 0,
    completionRate: 0,
    depositCollected: 0,
    pendingBalance: 0,
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

    if (error || (profile?.role !== 'admin' && profile?.role !== 'super_admin')) {
      navigate('/');
      return;
    }

    setRole(profile.role);
    await loadDashboardData();
    setLoading(false);
  };

  // 🔥 Clear Old Data with Password
  const clearOldData = async () => {
    const password = prompt('🔐 Enter admin password to clear old data:');
    
    const SECRET_PASSWORD = 'NOWAY2LOGIN@ALAA';
    
    if (password === null) {
      return;
    }
    
    if (password !== SECRET_PASSWORD) {
      alert('❌ Incorrect password! Action cancelled.');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Are you sure you want to delete all completed and cancelled bookings?\n\nThis action cannot be undone!'
    );
    if (!confirmed) return;
    
    setClearing(true);
    try {
      const { data, error } = await supabase.rpc('clear_old_booking_data');
      if (error) {
        alert(`Could not clear old data: ${error.message}`);
        setClearing(false);
        return;
      }
      alert(`✅ ${data || 0} old booking(s) deleted successfully.`);
      await loadDashboardData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const loadDashboardData = async () => {
    const [usersResult, carsResult, bookingsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          pickup_at,
          return_at,
          status,
          total_price,
          deposit_paid,
          remaining_balance,
          cars (brand, model)
        `)
        .order('created_at', { ascending: true }),
    ]);

    const bookingRows = bookingsResult.data || [];
    const now = new Date();

    const pending = bookingRows.filter((b) => b.status === 'pending').length;
    const expired = bookingRows.filter(
      (b) =>
        (b.status === 'pending' || b.status === 'confirmed') &&
        new Date(b.return_at) < now
    ).length;

    const revenue = bookingRows
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

    const depositCollected = bookingRows
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.deposit_paid || 0), 0);

    const pendingBalance = bookingRows
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.remaining_balance || 0), 0);

    const completed = bookingRows.filter((b) => b.status === 'completed').length;

    setBookings(bookingRows);
    setStats({
      users: usersResult.count || 0,
      cars: carsResult.count || 0,
      bookings: bookingRows.length,
      pendingBookings: pending,
      expiredBookings: expired,
      revenue,
      completionRate: bookingRows.length > 0 ? Math.round((completed / bookingRows.length) * 100) : 0,
      depositCollected,
      pendingBalance,
    });
  };

  // Revenue Data
  const revenueData = useMemo(() => {
    const grouped = {};
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .forEach((b) => {
        const d = new Date(b.created_at);
        if (d < start) return;
        const key = d.toISOString().split('T')[0];
        grouped[key] = (grouped[key] || 0) + Number(b.total_price || 0);
      });

    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, revenue: grouped[key] || 0 });
    }
    return result;
  }, [bookings, timeframe]);

  // Status Distribution
  const statusData = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      if (counts[b.status] !== undefined) counts[b.status]++;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));
  }, [bookings]);

  // Most Booked Cars
  const topCars = useMemo(() => {
    const grouped = {};
    bookings.forEach((b) => {
      const name = b.cars ? `${b.cars.brand} ${b.cars.model}` : 'Unknown';
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([car, count]) => ({ car, bookings: count }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 6);
  }, [bookings]);

  // Booking Trends
  const trendData = useMemo(() => {
    const grouped = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      grouped[key] = { date: key, bookings: 0, revenue: 0 };
    }
    bookings.forEach((b) => {
      const key = new Date(b.created_at).toISOString().split('T')[0];
      if (grouped[key]) {
        grouped[key].bookings++;
        grouped[key].revenue += Number(b.total_price || 0);
      }
    });
    return Object.values(grouped);
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [bookings]);

  const statusColors = {
    pending: '#FFC107',
    confirmed: '#00E676',
    completed: '#42A5F5',
    cancelled: '#EF5350',
  };

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>{role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}</h1>
          <p>Roadex analytics and full management.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-button" onClick={loadDashboardData}>
            🔄 Refresh
          </button>
          <button className="clear-old-data-button" onClick={clearOldData} disabled={clearing}>
            {clearing ? 'Clearing...' : '🗑️ Clear Old'}
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="admin-kpi-grid">
        {/* Total Revenue */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(212,175,55,0.15)' }}>
            💰
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Revenue</span>
            <strong className="kpi-value">{stats.revenue.toLocaleString()} EGP</strong>
          </div>
        </div>

        {/* Deposit Collected */}
        <div className="kpi-card deposit">
          <div className="kpi-icon" style={{ background: 'rgba(0,230,118,0.15)' }}>
            💳
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Deposit Collected</span>
            <strong className="kpi-value" style={{ color: '#00e676' }}>
              {stats.depositCollected.toLocaleString()} EGP
            </strong>
            <span className="kpi-trend">Confirmed + Completed</span>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="kpi-card pending-balance">
          <div className="kpi-icon" style={{ background: 'rgba(255,193,7,0.15)' }}>
            ⏳
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pending Balance</span>
            <strong className="kpi-value" style={{ color: '#ffc107' }}>
              {stats.pendingBalance.toLocaleString()} EGP
            </strong>
            <span className="kpi-trend">Due on completion</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(100,181,246,0.15)' }}>
            📋
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Bookings</span>
            <strong className="kpi-value">{stats.bookings}</strong>
            <span className="kpi-trend">{stats.pendingBookings} pending</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(156,39,176,0.15)' }}>
            ✅
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completion Rate</span>
            <strong className="kpi-value">{stats.completionRate}%</strong>
          </div>
        </div>

        {/* Expired Bookings */}
        <div className="kpi-card expired">
          <div className="kpi-icon" style={{ background: 'rgba(255,68,68,0.15)' }}>
            ⏰
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Expired Bookings</span>
            <strong className="kpi-value" style={{ color: '#ff6b6b' }}>
              {stats.expiredBookings}
            </strong>
            <span className="kpi-trend negative">Past due</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(255,107,107,0.15)' }}>
            👥
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Active Users</span>
            <strong className="kpi-value">{stats.users}</strong>
            <span className="kpi-trend">{stats.cars} cars</span>
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="admin-charts-grid">

        {/* 1. Revenue Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📈 Revenue Overview</h2>
            <div className="chart-controls">
              {timeframes.map((t) => (
                <button
                  key={t.value}
                  className={`time-btn ${timeframe === t.value ? 'active' : ''}`}
                  onClick={() => setTimeframe(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#999', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(20,20,20,0.92)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(v) => `${v.toLocaleString()} EGP`}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FFD700"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📊 Booking Status</h2>
            <span>Distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={statusColors[entry.status] || '#888'}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(20,20,20,0.92)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend verticalAlign="bottom" height={40} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Most Booked Cars */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>🚗 Most Booked Cars</h2>
            <span>Top 6</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={topCars}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 70, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: '#999', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="car"
                tick={{ fill: '#999', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(20,20,20,0.92)',
                  border: '1px solid rgba(100,181,246,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="bookings" fill="#64b5f6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Booking Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📉 Booking Trends</h2>
            <span>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#999', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#999', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#999', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(20,20,20,0.92)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="bookings"
                fill="rgba(212,175,55,0.3)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#FFD700"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* MANAGEMENT CARDS */}
      <div className="admin-section-title">
        <div>
          <h2>Management</h2>
          <p>Manage the main Roadex system.</p>
        </div>
      </div>

      <div className="admin-management">
        {role === 'super_admin' && (
          <div className="admin-management-card">
            <div className="management-icon">🚘</div>
            <h2>Cars</h2>
            <p>Add new vehicles, update details, change quantity and manage car images.</p>
            <button onClick={() => navigate('/admin/cars')}>Manage Cars</button>
          </div>
        )}

        <div className="admin-management-card">
          <div className="management-icon">📅</div>
          <h2>Bookings</h2>
          <p>Review reservations, accept requests, refuse bookings and mark rentals as completed.</p>
          <button onClick={() => navigate('/admin/bookings')}>Manage Bookings</button>
        </div>

        {role === 'super_admin' && (
          <div className="admin-management-card">
            <div className="management-icon">👤</div>
            <h2>Users and Roles</h2>
            <p>View staff accounts and manage user roles.</p>
            <button onClick={() => navigate('/admin/users')}>Manage Roles</button>
          </div>
        )}

        <div className="admin-management-card">
          <div className="management-icon">👥</div>
          <h2>Manage Customers</h2>
          <p>Create new customer accounts and remove existing customer accounts.</p>
          <button onClick={() => navigate('/admin/manage-users')}>Manage Customers</button>
        </div>

        <div className="admin-management-card">
          <div className="management-icon">➕</div>
          <h2>Add Booking</h2>
          <p>Create a new car reservation for an existing customer.</p>
          <button onClick={() => navigate('/admin/add-booking')}>Add Booking</button>
        </div>
      </div>

      {/* RECENT BOOKINGS */}
      <div className="admin-recent-section">
        <div className="admin-section-title">
          <div>
            <h2>Recent Bookings</h2>
            <p>Latest booking activity.</p>
          </div>
          <button className="view-all-button" onClick={() => navigate('/admin/bookings')}>
            View All
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="recent-empty">No bookings yet.</div>
        ) : (
          <div className="recent-bookings-list">
            {recentBookings.map((b) => (
              <div className="recent-booking-row" key={b.id}>
                <div>
                  <strong>
                    {b.cars ? `${b.cars.brand} ${b.cars.model}` : 'Unknown Car'}
                  </strong>
                  <span>
                    {new Date(b.created_at).toLocaleString('en-GB', {
                      hour12: false,
                    })}
                  </span>
                </div>
                <span className={`dashboard-status ${b.status}`}>{b.status}</span>
                <strong>{Number(b.total_price).toLocaleString()} EGP</strong>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Admin;