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

  const categories = [
    'All',
    'City Car',
    'Family Car',
    'Luxury',
    'Van',
    '4x4',
  ];

  const carTypes = [
    'All',
    'Economy',
    'Sedan',
    'SUV',
    'Van',
    '4x4',
  ];

  const filteredCars = cars.filter((car) => {
    const categoryMatch =
      selectedCategory === 'All' ||
      car.category === selectedCategory;

    const typeMatch =
      selectedType === 'All' ||
      car.car_type === selectedType;

    return categoryMatch && typeMatch;
  });

  return (
    <div className="cars-page">

      {/* Header */}
      <div className="cars-header">
        <h1>Our Cars</h1>

        <p>
          Choose the perfect car for your journey
        </p>
      </div>

      {/* Categories */}
      <div className="cars-filter-section">
        <h3>Categories</h3>

        <div className="cars-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? 'active'
                  : ''
              }
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

      {/* Car Types */}
      <div className="cars-filter-section">
        <h3>Car Type</h3>

        <div className="cars-filters">
          {carTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={
                selectedType === type
                  ? 'active'
                  : ''
              }
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cars */}
      <div className="cars-grid">

        {loading && (
          <p>Loading cars...</p>
        )}

        {!loading && message && (
          <p>{message}</p>
        )}

        {!loading &&
          !message &&
          filteredCars.length === 0 && (
            <p>No cars found.</p>
          )}

        {!loading &&
          filteredCars.map((car) => (
            <div
              className="car-card"
              key={car.id}
            >

              {/* Car Image */}
              {car.image_url && (
                <img
                  src={car.image_url}
                  alt={`${car.brand} ${car.model}`}
                  className="car-card-image"
                />
              )}

              <div className="car-card-content">

                {/* Car Name & Year */}
                <div className="car-card-title">
                  <h2>
                    {car.brand} {car.model}
                  </h2>

                  <span>
                    {car.year}
                  </span>
                </div>

                {/* Category & Type */}
                <div className="car-card-tags">

                  {car.category && (
                    <span>
                      {car.category}
                    </span>
                  )}

                  {car.car_type && (
                    <span>
                      {car.car_type}
                    </span>
                  )}

                </div>

                {/* Prices */}
                <div className="car-prices">

                  {/* Rental Price */}
                  <div>
                    <span>
                      Rental Price
                    </span>

                    <strong>
                      {car.price_per_day} EGP
                      <small>/day</small>
                    </strong>
                  </div>

                  {/* Driver Price */}
                  <div>
                    <span>
                      With Driver
                    </span>

                    <strong>
                      {car.driver_price_per_day != null
                        ? `${car.driver_price_per_day} EGP`
                        : 'Not available'}

                      {car.driver_price_per_day != null && (
                        <small>/day</small>
                      )}
                    </strong>
                  </div>

                </div>

                {/* Available Quantity */}
                <div className="car-quantity">
                  Available: {car.quantity}
                </div>

                {/* Car Details Button */}
                <a
                  href={`/car/${car.id}`}
                  className="car-button"
                >
                  Car Details
                </a>

              </div>
            </div>
          ))}

      </div>

    </div>
  );
}

export default Cars;