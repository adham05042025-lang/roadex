import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminCars.css';

function AdminCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setCars(data || []);
    setLoading(false);
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

    const fileInput = document.getElementById('car-image-input');

    if (fileInput) {
      fileInput.value = '';
    }
  };

  const uploadImage = async () => {
    if (!imageFile) {
      return null;
    }

    const fileExt = imageFile.name.split('.').pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `cars/${fileName}`;

    const { error } = await supabase.storage
      .from('car-images')
      .upload(filePath, imageFile);

    if (error) {
      throw error;
    }

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
      let imageUrl = currentImageUrl || null;

      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const carData = {
        brand: brand.trim(),
        model: model.trim(),
        year: Number(year),
        price_per_day: Number(pricePerDay),
        driver_price_per_day:
          driverPricePerDay === ''
            ? null
            : Number(driverPricePerDay),
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

        if (error) {
          throw error;
        }

        setMessage('Car updated successfully.');
      } else {
        const { error } = await supabase
          .from('cars')
          .insert([carData]);

        if (error) {
          throw error;
        }

        setMessage('Car added successfully.');
      }

      resetForm();
      await loadCars();
    } catch (error) {
      setMessage(error.message);
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

    const fileInput = document.getElementById('car-image-input');

    if (fileInput) {
      fileInput.value = '';
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const deleteCar = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this car?'
    );

    if (!confirmed) {
      return;
    }

    setMessage('');

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    setMessage('Car deleted successfully.');

    await loadCars();
  };

  return (
    <div className="admin-cars-page">

      <h1>Manage Cars</h1>

      <div className="admin-car-form-container">

        <h2>
          {editingId ? 'Edit Car' : 'Add New Car'}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="admin-car-form"
        >

          <input
            type="text"
            placeholder="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Year"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Price per day"
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
            onChange={(e) =>
              setDriverPricePerDay(e.target.value)
            }
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
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
            <option value="">Select Car Type</option>
            <option value="Economy">Economy</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Van">Van</option>
            <option value="4x4">4x4</option>
          </select>

          <input
            type="number"
            placeholder="Quantity"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <div>
            <label htmlFor="car-image-input">
              Car Image
            </label>

            <input
              id="car-image-input"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImageFile(e.target.files?.[0] || null)
              }
            />
          </div>

          {currentImageUrl && !imageFile && (
            <div>
              <p>Current Image:</p>

              <img
                src={currentImageUrl}
                alt="Current car"
                style={{
                  width: '180px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}

          {imageFile && (
            <div>
              <p>New image selected:</p>
              <strong>{imageFile.name}</strong>
            </div>
          )}

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Car'
                : 'Add Car'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cancel-edit-button"
              disabled={saving}
            >
              Cancel Edit
            </button>
          )}

        </form>

        {message && (
          <p>{message}</p>
        )}

      </div>

      <div className="admin-car-list">

        <h2>Cars</h2>

        {loading && (
          <p>Loading cars...</p>
        )}

        {!loading && cars.length === 0 && (
          <p>No cars found.</p>
        )}

        {cars.map((car) => (
          <div
            className="admin-car-card"
            key={car.id}
          >

            {car.image_url && (
              <img
                src={car.image_url}
                alt={`${car.brand} ${car.model}`}
                style={{
                  width: '130px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            )}

            <div>
              <h3>
                {car.brand} {car.model}
              </h3>

              <p>Year: {car.year}</p>

              <p>
                Category: {car.category || '—'}
              </p>

              <p>
                Type: {car.car_type || '—'}
              </p>

              <p>
                Price: {car.price_per_day} EGP/day
              </p>

              <p>
                Driver Price:{' '}
                {car.driver_price_per_day ?? '—'} EGP/day
              </p>

              <p>
                Quantity: {car.quantity}
              </p>
            </div>

            <div className="admin-car-actions">

              <button
                type="button"
                onClick={() => editCar(car)}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => deleteCar(car.id)}
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default AdminCars;