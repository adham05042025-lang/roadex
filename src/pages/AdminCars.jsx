import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminCars.css';

function AdminCars() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [driverPricePerDay, setDriverPricePerDay] = useState('');
  const [category, setCategory] = useState('');
  const [carType, setCarType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    // فلتر السيارات حسب البحث
    if (searchTerm.trim() === '') {
      setFilteredCars(cars);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = cars.filter(
        (car) =>
          car.brand?.toLowerCase().includes(term) ||
          car.model?.toLowerCase().includes(term)
      );
      setFilteredCars(filtered);
    }
  }, [searchTerm, cars]);

  const loadCars = async () => {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showMessage(error.message, true);
      setLoading(false);
      return;
    }

    setCars(data || []);
    setFilteredCars(data || []);
    setLoading(false);
  };

  const showMessage = (text, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const resetForm = () => {
    setBrand('');
    setModel('');
    setYear('');
    setPricePerDay('');
    setDriverPricePerDay('');
    setCategory('');
    setCarType('');
    setQuantity(1);
    setDescription('');
    setImageFile(null);
    setCurrentImageUrl('');
    setEditingId(null);
    setMessage('');

    const fileInput = document.getElementById('car-image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `cars/${fileName}`;

    const { error } = await supabase.storage
      .from('car-images')
      .upload(filePath, imageFile);

    if (error) throw error;

    const { data } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      if (!brand.trim()) throw new Error('Brand is required.');
      if (!model.trim()) throw new Error('Model is required.');
      if (!year) throw new Error('Year is required.');
      if (!pricePerDay) throw new Error('Price per day is required.');
      if (Number(pricePerDay) < 0) throw new Error('Price cannot be negative.');
      if (Number(driverPricePerDay) < 0) throw new Error('Driver price cannot be negative.');
      if (Number(quantity) < 1) throw new Error('Quantity must be at least 1.');

      let imageUrl = currentImageUrl || null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const carData = {
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        price_per_day: Number(pricePerDay),
        driver_price_per_day: Number(driverPricePerDay) || 0,
        category: category.trim(),
        car_type: carType.trim(),
        quantity: Number(quantity),
        description: description.trim(),
        image_url: imageUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', editingId);

        if (error) throw error;
        showMessage('Car updated successfully.');
      } else {
        const { error } = await supabase
          .from('cars')
          .insert([carData]);

        if (error) throw error;
        showMessage('Car added successfully.');
      }

      resetForm();
      await loadCars();
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      setSaving(false);
    }
  };

  const editCar = (car) => {
    setEditingId(car.id);
    setBrand(car.brand || '');
    setModel(car.model || '');
    setYear(car.year || '');
    setPricePerDay(car.price_per_day || '');
    setDriverPricePerDay(car.driver_price_per_day ?? '');
    setCategory(car.category || '');
    setCarType(car.car_type || '');
    setQuantity(car.quantity ?? 1);
    setDescription(car.description || '');
    setCurrentImageUrl(car.image_url || '');
    setImageFile(null);
    setMessage('');

    const fileInput = document.getElementById('car-image-input');
    if (fileInput) {
      fileInput.value = '';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteCar = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this car?');
    if (!confirmed) return;

    const { error } = await supabase.from('cars').delete().eq('id', id);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    if (editingId === id) resetForm();
    showMessage('Car deleted successfully.');
    await loadCars();
  };

  return (
    <div className="admin-cars-page">
      <h1>Manage <span>Cars</span></h1>

      {/* ===== FORM ===== */}
      <div className="admin-car-form-container">
        <h2>{editingId ? '✏️ Edit Car' : '➕ Add New Car'}</h2>

        {message && (
          <div className={`form-message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-car-form">
          <input
            type="text"
            placeholder="Brand *"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Model *"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Year *"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price per day *"
            min="0"
            step="0.01"
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Driver Price per day"
            min="0"
            step="0.01"
            value={driverPricePerDay}
            onChange={(e) => setDriverPricePerDay(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category *</option>
            <option value="City Car">City Car</option>
            <option value="Family Car">Family Car</option>
            <option value="Luxury">Luxury</option>
            <option value="Van">Van</option>
            <option value="4x4">4x4</option>
          </select>
          <select
            value={carType}
            onChange={(e) => setCarType(e.target.value)}
            required
          >
            <option value="">Select Car Type *</option>
            <option value="Economy">Economy</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Van">Van</option>
            <option value="4x4">4x4</option>
          </select>
          <input
            type="number"
            placeholder="Quantity *"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <div className="file-input-wrapper">
            <label>Car Image</label>
            <input
              id="car-image-input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          {(currentImageUrl && !imageFile) && (
            <div className="image-preview">
              <p>Current Image:</p>
              <img src={currentImageUrl} alt="Current car" />
            </div>
          )}

          {imageFile && (
            <div className="image-preview">
              <p>New image selected:</p>
              <span className="file-name">📷 {imageFile.name}</span>
            </div>
          )}

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />

          <button type="submit" disabled={saving}>
            {saving ? '⏳ Saving...' : editingId ? '✅ Update Car' : '➕ Add Car'}
          </button>

          {editingId && (
            <button type="button" className="cancel-edit-button" onClick={resetForm} disabled={saving}>
              ❌ Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* ===== CAR LIST ===== */}
      <div className="admin-car-list">
        <div className="admin-car-list-header">
          <h2>🚗 Cars ({filteredCars.length})</h2>
          <div className="admin-car-search">
            <input
              type="text"
              placeholder="🔍 Search by brand or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              type="button"
              className="refresh-btn"
              onClick={loadCars}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="admin-car-empty">Loading cars...</div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="admin-car-empty">
            {searchTerm ? `No cars found for "${searchTerm}"` : 'No cars found.'}
          </div>
        )}

        <div className="admin-car-scroll">
          {!loading &&
            filteredCars.map((car) => (
              <div className="admin-car-card" key={car.id}>
                {car.image_url ? (
                  <img src={car.image_url} alt={`${car.brand} ${car.model}`} />
                ) : (
                  <div className="admin-car-no-image">No Image</div>
                )}

                <div className="car-info">
                  <h3>{car.brand} {car.model}</h3>
                  <p><strong>Year:</strong> {car.year}</p>
                  <p><strong>Category:</strong> {car.category || '—'}</p>
                  <p><strong>Type:</strong> {car.car_type || '—'}</p>
                  <p className="price"><strong>Price:</strong> {car.price_per_day} EGP/day</p>
                  <p><strong>Driver:</strong> {car.driver_price_per_day ?? '—'} EGP/day</p>
                  <p><strong>Qty:</strong> {car.quantity}</p>
                </div>

                <div className="admin-car-actions">
                  <button className="edit-btn" onClick={() => editCar(car)}>
                    ✏️ Edit
                  </button>
                  <button className="delete-btn" onClick={() => deleteCar(car.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default AdminCars;