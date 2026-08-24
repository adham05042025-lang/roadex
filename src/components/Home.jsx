import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading cars:', error);
      setLoading(false);
      return;
    }

    setCars(data || []);
    setLoading(false);
  };

  return (
    <div className="home-page">

      {/* =========================
          HERO
      ========================= */}
      <section className="hero">

        <div className="hero-overlay">

          <div className="hero-content">

            <span className="hero-eyebrow">
              PREMIUM CAR RENTAL IN EGYPT
            </span>

            <h1>
              Always on the <span>move.</span>
            </h1>

            <p>
              Premium cars. Professional service.
              <br />
              Your journey starts with Roadex.
            </p>

            <div className="hero-buttons">
              <Link
                to="/cars"
                className="btn-primary"
              >
                Explore Our Fleet
              </Link>

              <Link
                to="/contact"
                className="btn-secondary"
              >
                Contact Us
              </Link>
            </div>

          </div>

        </div>

      </section>


      {/* =========================
          WHY ROADEX
      ========================= */}
      <section className="why-roa">

        <div className="section-header">

          <span className="section-eyebrow">
            WHY ROADEX
          </span>

          <h2>
            Drive with <span>confidence.</span>
          </h2>

          <p>
            Everything you need for a smooth and
            comfortable rental experience.
          </p>

        </div>


        <div className="features-grid">

          <div className="feature-card">
            <div className="feature-icon">◆</div>

            <h3>Premium Fleet</h3>

            <p>
              Carefully selected vehicles designed
              for comfort, style and performance.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">◇</div>

            <h3>Best Value</h3>

            <p>
              Competitive daily rates with transparent
              rental pricing.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">◷</div>

            <h3>Flexible Rentals</h3>

            <p>
              Choose the rental period that works
              perfectly for your journey.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">✓</div>

            <h3>Professional Service</h3>

            <p>
              Reliable support from booking to
              returning your vehicle.
            </p>
          </div>

        </div>

      </section>


      {/* =========================
          FLEET PREVIEW - Popular Vehicles
      ========================= */}
      <section className="fleet-preview">
        <div className="section-header">
          <span className="section-eyebrow">OUR FLEET</span>
          <h2>Popular <span>Vehicles</span></h2>
          <p>Discover our most popular cars for your journey</p>
        </div>

        {loading ? (
          <div className="fleet-loading">Loading cars...</div>
        ) : cars.length === 0 ? (
          <div className="fleet-empty">No cars available</div>
        ) : (
          <div className="fleet-grid">
            {cars.slice(0, 6).map((car) => {
              // 🔥 السعر بدون سائق فقط
              const displayPrice = Number(car.price_per_day);

              return (
                <div
                  key={car.id}
                  className="fleet-card"
                  onClick={() => navigate(`/car/${car.id}`)}
                >
                  {car.image_url ? (
                    <img src={car.image_url} alt={`${car.brand} ${car.model}`} />
                  ) : (
                    <div className="fleet-no-image">No Image</div>
                  )}
                  <div className="fleet-card-content">
                    <h3>{car.brand} {car.model}</h3>
                    <p className="fleet-price">
                      {displayPrice.toLocaleString()} EGP
                      <span>/ day</span>
                    </p>
                    <div className="fleet-tags">
                      <span>{car.category}</span>
                      <span>{car.car_type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && cars.length > 0 && (
          <div className="fleet-view-all">
            <Link to="/cars" className="btn-primary">
              View All Vehicles
            </Link>
          </div>
        )}
      </section>


      {/* =========================
          CTA
      ========================= */}
      <section className="home-cta">

        <div className="home-cta-overlay">

          <div className="home-cta-content">

            <span className="section-eyebrow">
              YOUR JOURNEY STARTS HERE
            </span>

            <h2>
              Ready to hit the <span>road?</span>
            </h2>

            <p>
              Find the perfect car for your next journey.
            </p>

            <Link
              to="/cars"
              className="btn-primary"
            >
              Explore Our Fleet
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;