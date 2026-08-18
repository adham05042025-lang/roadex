import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
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