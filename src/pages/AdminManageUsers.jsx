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

  // State للـ Documents
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      .order('created_at', { ascending: false });

    if (error) {
      showMessage(`Could not load users: ${error.message}`, true);
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    setUsers(data || []);
    setLoadingUsers(false);
  };

  const loadUserDocuments = async (userId) => {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      showMessage(error.message, true);
      setLoadingDocs(false);
      return;
    }

    setUserDocuments(data || []);
    setLoadingDocs(false);
  };

  const openDocsModal = async (user) => {
    setSelectedUser(user);
    setShowDocsModal(true);
    setUploadProgress(0);
    await loadUserDocuments(user.id);
  };

  // 🔥 رفع مستندات متعددة مع Progress Bar
  const uploadMultipleDocuments = async (userId, files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;
    let uploadedDocs = [];

    try {
      for (const file of files) {
        let docType = 'national_id';
        if (file.name.toLowerCase().includes('passport')) docType = 'passport';
        else if (file.name.toLowerCase().includes('license') || file.name.toLowerCase().includes('driving')) docType = 'driver_license';
        else if (file.name.toLowerCase().includes('profile') || file.name.toLowerCase().includes('photo')) docType = 'profile_picture';

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${docType}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(fileName);

        const { data: dbData, error: dbError } = await supabase
          .from('user_documents')
          .insert({
            user_id: userId,
            document_type: docType,
            document_name: file.name,
            document_url: urlData.publicUrl,
            file_size: file.size,
          })
          .select();

        if (dbError) throw dbError;

        uploadedCount++;
        uploadedDocs.push(dbData[0]);
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      showMessage(`Successfully uploaded ${uploadedCount} document(s)!`);

      // تحديث القائمة مباشرة
      setUserDocuments((prev) => [...uploadedDocs, ...prev]);

    } catch (error) {
      showMessage(error.message, true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = async (docId) => {
    const confirmed = window.confirm('Are you sure you want to delete this document?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('id', docId);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    showMessage('Document deleted successfully.');
    await loadUserDocuments(selectedUser.id);
  };

  const verifyDocument = async (docId) => {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_documents')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: userData.user.id,
      })
      .eq('id', docId);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    showMessage('Document verified successfully!');
    await loadUserDocuments(selectedUser.id);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;

    if (!fullName || !email || !password) {
      showMessage('Full name, email and password are required.', true);
      return;
    }

    if (password.length < 6) {
      showMessage('Password must contain at least 6 characters.', true);
      return;
    }

    setSubmitting(true);
    setMessage('');

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create',
        fullName,
        email,
        phone,
        password,
      },
    });

    if (error) {
      showMessage(error.message || 'Could not create the user.', true);
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
      `Are you sure you want to permanently delete ${user.full_name || 'this customer'}?\n\nTheir account and related data may be removed.`
    );

    if (!confirmed) return;

    setDeletingId(user.id);
    setMessage('');

    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'delete',
        userId: user.id,
      },
    });

    if (error) {
      showMessage(error.message || 'Could not delete the user.', true);
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

  if (loadingUsers) {
    return (
      <div className="admin-users-page">
        <div className="admin-users-loading">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Manage Users</h1>
          <p>Create new customer accounts and remove existing customers.</p>
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
        <div className={isError ? 'admin-users-message error' : 'admin-users-message success'}>
          {message}
        </div>
      )}

      <div className="admin-users-layout">
        <section className="admin-users-card">
          <h2>Add Customer</h2>

          <form className="admin-users-form" onSubmit={handleCreateUser}>
            <div className="admin-users-field">
              <label htmlFor="customer-full-name">Full Name</label>
              <input
                id="customer-full-name"
                type="text"
                value={formData.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                required
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-email">Email Address</label>
              <input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-phone">Phone Number</label>
              <input
                id="customer-phone"
                type="text"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </div>

            <div className="admin-users-field">
              <label htmlFor="customer-password">Temporary Password</label>
              <input
                id="customer-password"
                type="password"
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                minLength="6"
                required
              />
            </div>

            <button type="submit" className="admin-users-create-button" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </form>
        </section>

        <section className="admin-users-card">
          <div className="admin-users-list-header">
            <h2>Customers</h2>
            <span>{users.length} customer(s)</span>
          </div>

          {loadingUsers ? (
            <div className="admin-users-empty">Loading customers...</div>
          ) : users.length === 0 ? (
            <div className="admin-users-empty">No customer accounts found.</div>
          ) : (
            <div className="admin-users-list">
              {users.map((user) => (
                <div className="admin-users-row" key={user.id}>
                  <div className="admin-users-information">
                    <strong>{user.full_name || 'Unnamed Customer'}</strong>
                    <span>{user.phone || 'No phone number'}</span>
                    <small>
                      Created: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </small>
                  </div>

                  <div className="admin-users-actions">
                    <button
                      type="button"
                      className="admin-users-docs-btn"
                      onClick={() => openDocsModal(user)}
                    >
                      📄 Documents
                    </button>

                    <button
                      type="button"
                      className="admin-users-delete-button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={deletingId === user.id}
                    >
                      {deletingId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal المستندات */}
      {showDocsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDocsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Documents - {selectedUser.full_name}</h2>
              <button className="modal-close" onClick={() => setShowDocsModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* رفع مستندات متعددة */}
              <div className="upload-section">
                <h3>Upload Documents</h3>
                <div className="upload-grid">
                  <input
                    id="doc-files"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        uploadMultipleDocuments(selectedUser.id, files);
                      }
                      e.target.value = '';
                    }}
                  />
                  <span className="upload-hint">You can select multiple files</span>
                </div>

                {/* Progress Bar */}
                {uploading && (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* قائمة المستندات */}
              <div className="docs-list">
                <h3>Uploaded Documents</h3>
                {loadingDocs ? (
                  <p>Loading documents...</p>
                ) : userDocuments.length === 0 ? (
                  <p className="no-docs">No documents uploaded yet.</p>
                ) : (
                  userDocuments.map((doc) => (
                    <div className="doc-item" key={doc.id}>
                      <div className="doc-info">
                        <span className="doc-type">{doc.document_type.replace('_', ' ').toUpperCase()}</span>
                        <span className="doc-name">{doc.document_name}</span>
                        <span className="doc-size">{(doc.file_size / 1024).toFixed(1)} KB</span>
                        <span className={`doc-status ${doc.is_verified ? 'verified' : 'pending'}`}>
                          {doc.is_verified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="doc-actions">
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-view-btn"
                        >
                          👁️ View
                        </a>
                        {!doc.is_verified && (
                          <button
                            type="button"
                            className="doc-verify-btn"
                            onClick={() => verifyDocument(doc.id)}
                          >
                            ✅ Verify
                          </button>
                        )}
                        <button
                          type="button"
                          className="doc-delete-btn"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageUsers;