import { Routes, Route } from 'react-router-dom';

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
  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/*
            PUBLIC PAGES
          */}

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
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/my-bookings"
            element={<MyBookings />}
          />

          {/*
            SHARED ADMIN AND SUPER ADMIN PAGES
          */}

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
            path="/admin/manage-users"
            element={
              <AdminRoute>
                <AdminManageUsers />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/add-booking"
            element={
              <AdminRoute>
                <AdminAddBooking />
              </AdminRoute>
            }
          />

          {/*
            SUPER-ADMIN-ONLY PAGE

            Only Super Admin can view accounts
            and change user roles.
          */}

          <Route
            path="/admin/users"
            element={
              <SuperAdminRoute>
                <AdminUsers />
              </SuperAdminRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
