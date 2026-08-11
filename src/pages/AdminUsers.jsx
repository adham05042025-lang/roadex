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

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        role,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const changeRole = async (userId, newRole) => {
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
      })
      .eq('id', userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? { ...user, role: newRole }
          : user
      )
    );

    setMessage('User role updated successfully.');
  };

  return (
    <div className="admin-users-page">

      <div className="admin-users-header">
        <h1>Manage Users</h1>

        <p>
          View registered Roadex users and manage their roles.
        </p>
      </div>

      {message && (
        <p className="admin-users-message">
          {message}
        </p>
      )}

      {loading && (
        <p>Loading users...</p>
      )}

      {!loading && users.length === 0 && (
        <p>No users found.</p>
      )}

      <div className="admin-users-list">

        {users.map((user) => (
          <div
            className="admin-user-card"
            key={user.id}
          >

            <div className="admin-user-info">

              <h2>
                {user.full_name || 'Unnamed User'}
              </h2>

              <p>
                <strong>Phone:</strong>{' '}
                {user.phone || 'Not provided'}
              </p>

              <p>
                <strong>Role:</strong>{' '}
                <span className={`user-role ${user.role}`}>
                  {user.role}
                </span>
              </p>

              <p>
                <strong>Joined:</strong>{' '}
                {new Date(
                  user.created_at
                ).toLocaleString()}
              </p>

            </div>

            <div className="admin-user-actions">

              <label>
                Role

                <select
                  value={user.role}
                  onChange={(e) =>
                    changeRole(
                      user.id,
                      e.target.value
                    )
                  }
                >
                  <option value="user">
                    User
                  </option>

                  <option value="admin">
                    Admin
                  </option>
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
