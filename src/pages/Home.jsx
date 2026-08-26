import { useEffect, useState } from 'react';
import { formatDate24 } from '../utils/formatDate';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [allCars, setAllCars] = useState([]); // ✅ كل العربيات للـ Booking Bar

  // State للـ Booking Bar
  const [selectedCarId, setSelectedCarId] = useState('');
  const [pickupAt, setPickupAt] = useState('');
  const [returnAt, setReturnAt] = useState('');

  useEffect(() => {
    loadCars();
    loadAllCars(); // ✅ جلب كل العربيات للـ Booking Bar
  }, []);

  const loadCars = async () => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .limit(6);

    if (!error) {
      setCars(data || []);
    }
  };

  // ✅ جلب كل العربيات للـ Booking Bar
  const loadAllCars = async () => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('brand', { ascending: true });

    if (!error) {
      setAllCars(data || []);
    }
  };

  // ✅ جلب سعر اليوم من باقة 61-356 (بدون سائق)
  const getDisplayPrice = (car) => {
    if (!car) return 0;
    
    const price = car.package_prices?.['61-356']?.['without_driver'];
    if (price && price > 0) {
      return price;
    }
    
    return Number(car.price_per_day) || 0;
  };

  // وظيفة البحث عن سيارة
  const handleFindCar = (e) => {
    e.preventDefault();

    if (!selectedCarId || !pickupAt || !returnAt) {
      alert('Please select a car and choose pickup/return dates.');
      return;
    }

    const selectedCar = allCars.find((c) => c.id === selectedCarId);
    
    navigate('/booking', {
      state: {
        car: selectedCar,
        pickupAt,
        returnAt,
      },
    });
  };

  const categories = [
    {
      number: '01',
      title: 'City Cars',
      text: 'Smart and economical cars for everyday city driving.',
      type: 'City Car',
      link: '/cars',
    },
    {
      number: '02',
      title: 'Family Cars',
      text: 'Comfortable vehicles designed for family journeys.',
      type: 'Family Car',
      link: '/cars',
    },
    {
      number: '03',
      title: 'Luxury',
      text: 'Premium vehicles for a first-class driving experience.',
      type: 'Luxury',
      link: '/cars',
    },
    {
      number: '04',
      title: 'SUV & 4x4',
      text: 'Powerful vehicles ready for every kind of journey.',
      type: '4x4',
      link: '/cars',
    },
  ];

  return (
    <div className="home-page">

      {/* ================= HERO ================= */}

      <section className="home-hero">

        <div className="home-hero-bg" />

        <div className="home-hero-overlay">

          <div className="home-hero-content">

            <span className="home-eyebrow">
              WELCOME TO ROADEX
            </span>

            <h1>
              Rent Your
              <br />
              <span>Dream Car</span>
            </h1>

            <p>
              Premium cars. Exceptional service.
              <br />
              Your journey starts with Roadex.
            </p>

            <div className="home-hero-buttons">

              <Link
                to="/cars"
                className="home-gold-button"
              >
                Explore Our Fleet
              </Link>

              <Link
                to="/contact"
                className="home-outline-button"
              >
                Contact Us
              </Link>

            </div>

          </div>

          <div className="home-hero-scroll">
            <span>SCROLL TO EXPLORE</span>
            <div />
          </div>

        </div>

      </section>


      {/* ================= BOOKING BAR ================= */}

      <section className="home-booking-wrapper">

        <div className="home-booking-box">

          <div className="home-booking-title">
            <span>BOOK YOUR CAR</span>
            <h2>Find Your <strong>Perfect Ride</strong></h2>
          </div>

          <form className="home-booking-fields" onSubmit={handleFindCar}>

            <div className="home-booking-field">

              <label>Choose Car</label>

              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                required
              >
                <option value="">Select Vehicle</option>

                {allCars.map((car) => {
                  // 🔥 سعر من باقة 61-356 (بدون سائق)
                  const displayPrice = getDisplayPrice(car);
                  return (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} — {displayPrice.toLocaleString()} EGP/day
                    </option>
                  );
                })}
              </select>

            </div>

            <div className="home-booking-field">

              <label>Pick Up</label>

              <input
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                required
              />

            </div>

            <div className="home-booking-field">

              <label>Return</label>

              <input
                type="datetime-local"
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
                required
              />

            </div>

            <button type="submit" className="home-booking-button">
              Find A Car
            </button>

          </form>

        </div>

      </section>


      {/* ================= ABOUT ================= */}

      <section className="home-section home-about">

        <div className="home-about-image">

          <div className="home-about-image-overlay">
            <span>ROADEX</span>
          </div>

          <div className="home-about-number">
            <strong>10+</strong>
            <span>Vehicles<br />Available</span>
          </div>

        </div>

        <div className="home-about-content">

          <span className="home-section-label">
            ABOUT ROADEX
          </span>

          <h2>
            Your Journey.
            <br />
            <span>Our Commitment.</span>
          </h2>

          <p>
            Roadex is a premium car rental company
            dedicated to making every journey simple,
            comfortable and memorable.
          </p>

          <p>
            Whether you need an economical city car,
            a family vehicle, a luxury car or a powerful
            SUV, our growing fleet is ready for you.
          </p>

          <div className="home-about-features">

            <div>
              <span>01</span>
              <strong>Premium Fleet</strong>
            </div>

            <div>
              <span>02</span>
              <strong>Flexible Rentals</strong>
            </div>

            <div>
              <span>03</span>
              <strong>Reliable Service</strong>
            </div>

          </div>

          <Link
            to="/cars"
            className="home-text-link"
          >
            Discover Our Fleet →
          </Link>

        </div>

      </section>


      {/* ================= SERVICES ================= */}

      <section className="home-services-section">

        <div className="home-section-heading center">

          <span className="home-section-label center">
            OUR SERVICES
          </span>

          <h2>
            We Make Your
            <br />
            <span>Journey Easier</span>
          </h2>

        </div>

        <div className="home-services-grid">

          {/* Car Rental → /cars */}
          <div className="home-service-card">

            <span className="service-number">01</span>

            <div className="service-icon">◆</div>

            <h3>Car Rental</h3>

            <p>
              Choose from our growing fleet of quality
              vehicles and enjoy a smooth rental experience.
            </p>

            <Link to="/cars">
              Learn More →
            </Link>

          </div>

          {/* Rental With Driver → /cars */}
          <div className="home-service-card">

            <span className="service-number">02</span>

            <div className="service-icon">◆</div>

            <h3>Rental With Driver</h3>

            <p>
              Travel comfortably with our professional
              driver service whenever you need it.
            </p>

            <Link to="/cars">
              Learn More →
            </Link>

          </div>

          {/* Airport Transfer → /booking (Book Now) */}
          <div className="home-service-card">

            <span className="service-number">03</span>

            <div className="service-icon">◆</div>

            <h3>Airport Transfer</h3>

            <p>
              Reliable transportation for airport pickups,
              drop-offs and private transfers.
            </p>

            <Link to="/booking" className="home-service-book">
              Book Now →
            </Link>

          </div>

          {/* Long Term Rental → /booking (Book Now) */}
          <div className="home-service-card">

            <span className="service-number">04</span>

            <div className="service-icon">◆</div>

            <h3>Long Term Rental</h3>

            <p>
              Flexible rental solutions for extended stays,
              business trips and long journeys.
            </p>

            <Link to="/booking" className="home-service-book">
              Book Now →
            </Link>

          </div>

        </div>

      </section>


      {/* ================= FLEET ================= */}

      <section className="home-section home-fleet">

        <div className="home-section-heading">

          <div>

            <span className="home-section-label">
              CHOOSE YOUR CAR
            </span>

            <h2>
              Our <span>Premium Fleet</span>
            </h2>

          </div>

          <Link
            to="/cars"
            className="home-view-all"
          >
            View All Cars →
          </Link>

        </div>

        <div className="home-fleet-grid">

          {cars.map((car) => {
            // 🔥 سعر من باقة 61-356 (بدون سائق)
            const displayPrice = getDisplayPrice(car);

            return (
              <article
                className="home-car-card"
                key={car.id}
              >

                <div className="home-car-image">

                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={`${car.brand} ${car.model}`}
                    />
                  ) : (
                    <div className="home-no-image">
                      ROADEX
                    </div>
                  )}

                  <span className="home-car-category">
                    {car.category || 'Car Rental'}
                  </span>

                </div>

                <div className="home-car-content">

                  <span className="home-car-type">
                    {car.car_type || 'Premium Vehicle'}
                  </span>

                  <h3>
                    {car.brand} {car.model}
                  </h3>

                  <div className="home-car-info">

                    <span>
                      {car.year || '—'}
                    </span>

                    <span>•</span>

                    <span>
                      {car.car_type || 'Vehicle'}
                    </span>

                  </div>

                  <div className="home-car-bottom">

                    <div>
                      <strong>
                        {displayPrice.toLocaleString()} EGP
                      </strong>
                      <small>/ DAY</small>
                    </div>

                    <Link
                      to={`/car/${car.id}`}
                    >
                      Details →
                    </Link>

                  </div>

                </div>

              </article>
            );
          })}

        </div>

      </section>


      {/* ================= CATEGORIES ================= */}

      <section className="home-categories">

        <div className="home-section-heading center">

          <span className="home-section-label center">
            FIND YOUR PERFECT CAR
          </span>

          <h2>
            Browse By
            <br />
            <span>Category</span>
          </h2>

        </div>

        <div className="home-categories-grid">

          {categories.map((category) => (

            <Link
              to={category.link}
              className="home-category-card"
              key={category.number}
            >

              <span>
                {category.number}
              </span>

              <div>

                <h3>
                  {category.title}
                </h3>

                <p>
                  {category.text}
                </p>

              </div>

              <strong>
                →
              </strong>

            </Link>

          ))}

        </div>

      </section>


      {/* ================= STEPS ================= */}

      <section className="home-section home-steps">

        <div className="home-section-heading center">

          <span className="home-section-label center">
            EASY & SIMPLE
          </span>

          <h2>
            Rent Your Car
            <br />
            <span>In 3 Easy Steps</span>
          </h2>

        </div>

        <div className="home-steps-grid">

          <div className="home-step">

            <span>01</span>

            <div className="home-step-line" />

            <h3>Choose Your Car</h3>

            <p>
              Browse our fleet and select the vehicle
              that matches your needs.
            </p>

          </div>

          <div className="home-step">

            <span>02</span>

            <div className="home-step-line" />

            <h3>Select Your Dates</h3>

            <p>
              Choose your pickup and return dates
              and check vehicle availability.
            </p>

          </div>

          <div className="home-step">

            <span>03</span>

            <div className="home-step-line" />

            <h3>Enjoy Your Journey</h3>

            <p>
              Confirm your booking and get ready
              to hit the road with Roadex.
            </p>

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section className="home-final-cta">

        <div className="home-final-cta-overlay">

          <div>

            <span className="home-section-label">
              READY TO GO?
            </span>

            <h2>
              Start Your
              <br />
              <span>Journey Today.</span>
            </h2>

            <p>
              Find the perfect car for your next adventure.
            </p>

          </div>

          <Link
            to="/cars"
            className="home-gold-button"
          >
            Rent Your Car
          </Link>

        </div>

      </section>

    </div>
  );
}

export default Home;