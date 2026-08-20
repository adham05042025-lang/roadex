import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .rpc('get_users_with_emails');

      if (error) {
        console.error('RPC Error:', error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    setMessage('User role updated successfully.');
  };

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="admin-users-header">
        <h1>Manage <span>Users</span></h1>
        <p>View registered Roadex users and manage their roles.</p>
      </div>

      {/* Stats */}
      <div className="admin-users-stats">
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'user' || !u.role).length}</div>
          <div className="stat-label">Users</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className={`admin-users-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="admin-users-loading">Loading users</div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && (
        <div className="admin-users-empty">No users found.</div>
      )}

      {/* Users List */}
      <div className="admin-users-list">
        {users.map((user) => (
          <div className="admin-user-card" key={user.id}>
            <div className="admin-user-info">
              <h2>
                {user.full_name || 'Unnamed User'}
                <span className="user-id">#{user.id?.slice(0, 8)}</span>
              </h2>
              <p>
                <strong>Email:</strong>{' '}
                <span className="user-email">{user.email || 'No email found'}</span>
              </p>
              <p>
                <strong>Phone:</strong> {user.phone || 'Not provided'}
              </p>
              <p>
                <strong>Role:</strong>{' '}
                <span className={`user-role ${user.role || 'user'}`}>
                  {user.role || 'user'}
                </span>
              </p>
              <p>
                <strong>Joined:</strong>{' '}
                {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div className="admin-user-actions">
              <label>
                Role
                <select
                  value={user.role || 'user'}
                  onChange={(e) => changeRole(user.id, e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsers;