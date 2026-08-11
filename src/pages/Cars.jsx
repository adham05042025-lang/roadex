import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import './Cars.css';

function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
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
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setCars(data || []);
    setLoading(false);
  };

  return (
    <div className="cars-page">

      <div className="cars-header">
        <h1 className="cars-title">Our Vehicles</h1>
        <p className="cars-subtitle">
          Choose the perfect car for your next journey.
        </p>
      </div>

      {loading && (
        <p className="cars-status">
          Loading cars...
        </p>
      )}

      {message && (
        <p className="cars-status cars-error">
          {message}
        </p>
      )}

      {!loading && !message && cars.length === 0 && (
        <p className="cars-status">
          No cars are available right now.
        </p>
      )}

      <div className="cars-grid">

        {cars.map((car) => (
          <div className="car-card" key={car.id}>

            <div className="car-image-container">

              {car.image_url ? (
                <img
                  className="car-image"
                  src={car.image_url}
                  alt={`${car.brand} ${car.model}`}
                />
              ) : (
                <div className="car-no-image">
                  No image available
                </div>
              )}

            </div>

            <div className="car-content">

              <h2 className="car-name">
                {car.brand} {car.model}
              </h2>

              <div className="car-details">

                <p className="car-detail">
                  Year: {car.year}
                </p>

                <p className="car-detail car-price">
                  {car.price_per_day} EGP / day
                </p>

                <p className="car-detail">
                  Available: {car.quantity}
                </p>

              </div>

              {car.description && (
                <p className="car-description">
                  {car.description}
                </p>
              )}

              <Link
                to={`/car/${car.id}`}
                className="car-button"
              >
                View Details
              </Link>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Cars;
