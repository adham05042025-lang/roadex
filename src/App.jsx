import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';

import Home from './pages/Home';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Register from './pages/Register';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Admin from './pages/Admin';
import AdminCars from './pages/AdminCars';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import AdminManageUsers from './pages/AdminManageUsers';
import AdminAddBooking from './pages/AdminAddBooking';

import './App.css';

function App() {
  // 🔥 Dark/Light Mode
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const whatsappNumber = '201505516072';
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="app">
      <Navbar toggleTheme={toggleTheme} theme={theme} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/my-bookings" element={<MyBookings />} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/cars" element={<AdminRoute><AdminCars /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
          <Route path="/admin/manage-users" element={<AdminRoute><AdminManageUsers /></AdminRoute>} />
          <Route path="/admin/add-booking" element={<AdminRoute><AdminAddBooking /></AdminRoute>} />
          <Route path="/admin/users" element={<SuperAdminRoute><AdminUsers /></SuperAdminRoute>} />
        </Routes>
      </main>

      <Footer />

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="whatsapp-icon" />
        <span className="whatsapp-tooltip">Chat with us</span>
      </a>
    </div>
  );
}

export default App;