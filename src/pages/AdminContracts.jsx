import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminContracts.css';

function AdminContracts() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [message, setMessage] = useState('');
  const [editingContract, setEditingContract] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewContract, setPreviewContract] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    template_html: '',
    is_active: true,
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    setMessage('');
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Error loading contracts: ' + error.message);
      setLoading(false);
      return;
    }

    console.log('📋 Contracts loaded:', data);
    setContracts(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (!formData.name.trim() || !formData.template_html.trim()) {
      setMessage('Name and template are required.');
      setSaving(false);
      return;
    }

    try {
      if (editingContract) {
        const { error } = await supabase
          .from('contracts')
          .update({
            name: formData.name.trim(),
            template_html: formData.template_html.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingContract.id);

        if (error) throw error;
        setMessage('Contract updated successfully!');
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([{
            name: formData.name.trim(),
            template_html: formData.template_html.trim(),
            is_active: true,
          }]);

        if (error) throw error;
        setMessage('Contract created successfully!');
      }

      resetForm();
      await loadContracts();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const editContract = (contract) => {
    setEditingContract(contract);
    setFormData({
      name: contract.name,
      template_html: contract.template_html,
      is_active: contract.is_active,
    });
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteContract = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this contract?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage('Contract deleted successfully.');
      await loadContracts();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await loadContracts();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const resetForm = () => {
    setEditingContract(null);
    setShowEditor(false);
    setFormData({
      name: '',
      template_html: '',
      is_active: true,
    });
  };

  // View Contract - Opens in new window with sample data
  const viewContract = (contract) => {
    const sampleData = {
      booking_number: '12345',
      signature_date: new Date().toLocaleDateString('en-US'),
      customer_name: 'John Doe',
      customer_phone: '+20 100 000 0000',
      car_name: 'Toyota Camry 2023',
      plate_number: 'ABC 1234',
      driver_name: 'Mohamed Ahmed',
      driver_phone: '+20 100 000 0000',
      pickup_at: new Date().toLocaleString('en-US'),
      pickup_location: 'Cairo, Egypt',
      total_price: '1500',
      deposit_paid: '450',
      remaining_balance: '1050',
    };

    let html = contract.template_html;
    Object.keys(sampleData).forEach(key => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
    });

    const newWindow = window.open('', '_blank', 'width=900,height=800');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    } else {
      alert('Please allow popups for this site.');
    }
  };

  // Print Contract
  const printContract = (contract) => {
    const sampleData = {
      booking_number: '12345',
      signature_date: new Date().toLocaleDateString('en-US'),
      customer_name: 'John Doe',
      customer_phone: '+20 100 000 0000',
      car_name: 'Toyota Camry 2023',
      plate_number: 'ABC 1234',
      driver_name: 'Mohamed Ahmed',
      driver_phone: '+20 100 000 0000',
      pickup_at: new Date().toLocaleString('en-US'),
      pickup_location: 'Cairo, Egypt',
      total_price: '1500',
      deposit_paid: '450',
      remaining_balance: '1050',
    };

    let html = contract.template_html;
    Object.keys(sampleData).forEach(key => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
    });

    // Add print script
    html = html.replace(
      '</body>',
      '<script>window.onload = function() { window.print(); }</script></body>'
    );

    const newWindow = window.open('', '_blank', 'width=900,height=800');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    } else {
      alert('Please allow popups for this site.');
    }
  };

  const getPreview = (html) => {
    if (!html) return 'No content';
    const stripped = html.replace(/<[^>]*>/g, '');
    return stripped.substring(0, 150) + '...';
  };

  if (loading) {
    return <div className="admin-contracts-loading">Loading contracts...</div>;
  }

  return (
    <div className="admin-contracts-page">
      <div className="admin-contracts-header">
        <h1>📄 Manage Contracts</h1>
        <p>Manage rental contract templates. ({contracts.length} contracts found)</p>
        <button
          className="add-contract-btn"
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
        >
          + Add New Contract
        </button>
      </div>

      {message && (
        <div className={`contract-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {showEditor && (
        <div className="contract-editor">
          <h2>{editingContract ? 'Edit Contract' : 'Create New Contract'}</h2>
          <form onSubmit={handleSubmit} className="contract-form">
            <div className="form-group">
              <label>Contract Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., With Driver Contract"
                required
              />
            </div>

            <div className="form-group">
              <label>Contract Template (HTML) *</label>
              <p className="field-hint">
                Use placeholders: {'{{booking_number}}'}, {'{{signature_date}}'}, {'{{customer_name}}'}, {'{{customer_phone}}'}, {'{{car_name}}'}, {'{{plate_number}}'}, {'{{driver_name}}'}, {'{{driver_phone}}'}, {'{{pickup_at}}'}, {'{{pickup_location}}'}, {'{{total_price}}'}, {'{{deposit_paid}}'}, {'{{remaining_balance}}'}
              </p>
              <textarea
                value={formData.template_html}
                onChange={(e) => setFormData({ ...formData, template_html: e.target.value })}
                rows={20}
                placeholder="Enter contract template with HTML formatting and placeholders..."
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingContract ? 'Update Contract' : 'Create Contract'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="contracts-list">
        {contracts.length === 0 && !showEditor ? (
          <div className="no-contracts">
            <p>No contracts found. Create your first contract!</p>
          </div>
        ) : (
          <div className="contracts-grid">
            {contracts.map((contract) => (
              <div className="contract-card" key={contract.id}>
                <div className="contract-card-header">
                  <span className={`contract-status ${contract.is_active ? 'active' : 'inactive'}`}>
                    {contract.is_active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <h3>{contract.name}</h3>
                <p className="contract-preview">{getPreview(contract.template_html)}</p>
                <div className="contract-meta">
                  <span>Updated: {new Date(contract.updated_at || contract.created_at).toLocaleDateString()}</span>
                </div>
                <div className="contract-actions">
                  <button className="view-btn" onClick={() => viewContract(contract)}>
                    👁️ View
                  </button>
                  <button className="print-btn" onClick={() => printContract(contract)}>
                    🖨️ Print
                  </button>
                  <button className="edit-btn" onClick={() => editContract(contract)}>
                    ✏️ Edit
                  </button>
                  <button 
                    className={`toggle-btn ${contract.is_active ? 'active' : 'inactive'}`} 
                    onClick={() => toggleActive(contract.id, contract.is_active)}
                  >
                    {contract.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="delete-btn" onClick={() => deleteContract(contract.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminContracts;