import { Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Cars from './pages/Cars';
import CarDetails from './pages/CarDetails';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Register from './pages/Register';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';

import Admin from './pages/Admin';
import AdminCars from './pages/AdminCars';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';
import AdminManageUsers from './pages/AdminManageUsers';

function App() {
  return (
    <div className="app">

      <Navbar />

      <main className="main-content">

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/cars"
            element={<Cars />}
          />

          <Route
            path="/car/:id"
            element={<CarDetails />}
          />

          <Route
            path="/booking"
            element={<Booking />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/my-bookings"
            element={<MyBookings />}
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/cars"
            element={
              <AdminRoute>
                <AdminCars />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />
                <Route
          path="/admin/manage-users"
          element={
            <AdminRoute>
              <AdminManageUsers />
            </AdminRoute>
          }
        />

        </Routes>

      </main>

      <Footer />

    </div>
  );
}

export default App;
