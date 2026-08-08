function Home() {
  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Welcome to <span>Roadex</span></h1>
            <p>Best car rental service at the best prices</p>
            <a href="/cars" className="btn-primary">Explore Our Cars</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;