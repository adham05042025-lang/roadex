// Cars.jsx - عرض سعر اليوم من باقة 61-356
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './Cars.css';

function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

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

  // ✅ جلب سعر اليوم من باقة 61-356
  const getDisplayPrice = (car) => {
    if (!car) return 0;
    
    const price = car.package_prices?.['61-356']?.['without_driver'];
    if (price && price > 0) {
      return price;
    }
    
    return Number(car.price_per_day) || 0;
  };

  const categories = ['All', 'City Car', 'Family Car', 'Luxury', 'Van', '4x4'];
  const carTypes = ['All', 'Economy', 'Sedan', 'SUV', 'Van', '4x4'];

  const filteredCars = cars.filter((car) => {
    const categoryMatch = selectedCategory === 'All' || car.category === selectedCategory;
    const typeMatch = selectedType === 'All' || car.car_type === selectedType;
    return categoryMatch && typeMatch;
  });

  return (
    <div className="cars-page">

      <div className="cars-header">
        <h1>Our Vehicles</h1>
        <p>Choose the perfect car for your journey</p>
      </div>

      <div className="cars-filter-section">
        <h3>Categories</h3>
        <div className="cars-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedType('All');
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="cars-filter-section">
        <h3>Car Type</h3>
        <div className="cars-filters">
          {carTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={selectedType === type ? 'active' : ''}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="cars-grid">
        {loading && <p>Loading cars...</p>}
        {!loading && message && <p>{message}</p>}
        {!loading && !message && filteredCars.length === 0 && <p>No cars found.</p>}

        {!loading &&
          filteredCars.map((car) => {
            // 🔥 السعر من باقة 61-356 (بدون سائق)
            const displayPrice = getDisplayPrice(car);

            return (
              <div className="car-card" key={car.id}>
                {car.image_url && (
                  <img
                    src={car.image_url}
                    alt={`${car.brand} ${car.model}`}
                    className="car-card-image"
                    loading="lazy"
                    width="400"
                    height="225"
                  />
                )}

                <div className="car-card-content">
                  <div className="car-card-title">
                    <h2>{car.brand} {car.model}</h2>
                    <span>{car.year}</span>
                  </div>

                  <div className="car-card-tags">
                    {car.category && <span>{car.category}</span>}
                    {car.car_type && <span>{car.car_type}</span>}
                  </div>

                  <div className="car-prices">
                    <div>
                      <span>Price Per Day</span>
                      <strong>
                        {displayPrice.toLocaleString()} EGP
                        <small>/day</small>
                        <small style={{ color: '#888', fontSize: '10px', display: 'block' }}>
                          (Long term rate)
                        </small>
                      </strong>
                    </div>
                  </div>

                  <a href={`/car/${car.id}`} className="car-button">
                    Car Details
                  </a>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Cars;