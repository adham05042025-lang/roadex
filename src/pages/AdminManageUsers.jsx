import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminManageUsers.css';

function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (message) {
      setMessage('');
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        role,
        created_at
      `)
      .eq('role', 'user')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      showMessage(
        `Could not load users: ${error.message}`,
        true
      );

      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    setUsers(data || []);
    setLoadingUsers(false);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;

    if (!fullName || !email || !password) {
      showMessage(
        'Full name, email and password are required.',
        true
      );
      return;
    }

    if (password.length < 6) {
      showMessage(
        'Password must contain at least 6 characters.',
        true
      );
      return;
    }

    setSubmitting(true);
    setMessage('');

    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      {
        body: {
          action: 'create',
          fullName,
          email,
          phone,
          password,
        },
      }
    );

    if (error) {
      showMessage(
        error.message || 'Could not create the user.',
        true
      );

      setSubmitting(false);
      return;
    }

    if (data?.error) {
      showMessage(data.error, true);
      setSubmitting(false);
      return;
    }

    showMessage('Customer account created successfully.');

    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    });

    await loadUsers();

    setSubmitting(false);
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${
        user.full_name || 'this customer'
      }?\n\nTheir account and related data may be removed.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(user.id);
    setMessage('');

    const { data, error } = await supabase.functions.invoke(
      'manage-users',
      {
        body: {
          action: 'delete',
          userId: user.id,
        },
      }
    );

    if (error) {
      showMessage(
        error.message || 'Could not delete the user.',
        true
      );

      setDeletingId('');
      return;
    }

    if (data?.error) {
      showMessage(data.error, true);
      setDeletingId('');
      return;
    }

    showMessage('Customer account deleted successfully.');

    await loadUsers();

    setDeletingId('');
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Manage Users</h1>

          <p>
            Create new customer accounts and remove
            existing customers.
          </p>
        </div>

        <button
          type="button"
          className="admin-users-refresh"
          onClick={loadUsers}
          disabled={loadingUsers}
        >
          {loadingUsers ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {message && (
        <div
          className={
            isError
              ? 'admin-users-message error'
              : 'admin-users-message success'
          }
        >
          {message}
        </div>
      )}

      <div className="admin-users-layout">
        <section className="admin-users-card">
          <h2>Add Customer</h2>

          <form
            className="admin-users-form"
            onSubmit={handleCreateUser}
          >
            <div className="admin-users-field">
              <label htmlFor="customer-full-name">
                Full Name
              </label>

              <input
                id="customer-full-name"
                type="text"
                value={formData.fullName}
                onChange={(event) =>
                  updateField(
                    'fullName',
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-email">
                Email Address
              </label>

              <input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={(event) =>
                  updateField(
                    'email',
                    event.target.value
                  )
                }
                required
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-phone">
                Phone Number
              </label>

              <input
                id="customer-phone"
                type="text"
                value={formData.phone}
                onChange={(event) =>
                  updateField(
                    'phone',
                    event.target.value
                  )
                }
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-password">
                Temporary Password
              </label>

              <input
                id="customer-password"
                type="password"
                value={formData.password}
                onChange={(event) =>
                  updateField(
                    'password',
                    event.target.value
                  )
                }
                minLength="6"
                required
              />
            </div>

            <button
              type="submit"
              className="admin-users-create-button"
              disabled={submitting}
            >
              {submitting
                ? 'Creating...'
                : 'Create Customer'}
            </button>
          </form>
        </section>

        <section className="admin-users-card">
          <div className="admin-users-list-header">
            <h2>Customers</h2>

            <span>{users.length} customer(s)</span>
          </div>

          {loadingUsers ? (
            <div className="admin-users-empty">
              Loading customers...
            </div>
          ) : users.length === 0 ? (
            <div className="admin-users-empty">
              No customer accounts found.
            </div>
          ) : (
            <div className="admin-users-list">
              {users.map((user) => (
                <div
                  className="admin-users-row"
                  key={user.id}
                >
                  <div className="admin-users-information">
                    <strong>
                      {user.full_name || 'Unnamed Customer'}
                    </strong>

                    <span>
                      {user.phone || 'No phone number'}
                    </span>

                    <small>
                      Created:{' '}
                      {user.created_at
                        ? new Date(
                            user.created_at
                          ).toLocaleDateString()
                        : 'Unknown'}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="admin-users-delete-button"
                    onClick={() =>
                      handleDeleteUser(user)
                    }
                    disabled={deletingId === user.id}
                  >
                    {deletingId === user.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminManageUsers;
