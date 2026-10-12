import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import DineBot from './components/DineBot';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { checkAuthSession } from './redux/slices/authSlice';
import { LoginModalProvider } from './contexts/LoginModalContext';

import CustomerPortalLayout from './layouts/CustomerPortalLayout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerAddresses from './pages/customer/CustomerAddresses';
import CustomerReviews from './pages/customer/CustomerReviews';
import CustomerAssistant from './pages/customer/CustomerAssistant';

import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import Menu from './pages/Menu';
import RestaurantDetails from './pages/RestaurantDetails';
import FoodDetails from './pages/FoodDetails';
import SearchResults from './pages/SearchResults';
import Categories from './pages/Categories';
import Offers from './pages/Offers';
import Wishlist from './pages/Wishlist';
import RecentlyViewed from './pages/RecentlyViewed';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import Recommendations from './pages/Recommendations';
import PriceAlerts from './pages/PriceAlerts';
import LiveTableLayout from './pages/LiveTableLayout';
import RestaurantMenuBookPage from './pages/RestaurantMenuBookPage';
import TrackOrder from './pages/TrackOrder';
import EBill from './pages/EBill';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Rewards from './pages/Rewards';
import BookTable from './pages/BookTable';
import PlanDiningExperience from './pages/PlanDiningExperience';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import TrackBooking from './pages/TrackBooking';
import Help from './pages/Help';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import ChefLogin from './pages/ChefLogin';
import ChefDashboard from './pages/ChefDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  const dispatch = useDispatch();
  const online = useOnlineStatus();
  const location = useLocation();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const isAuthenticated = useSelector(s => s.auth?.isAuthenticated);
  const isCustomer = isAuthenticated && (!currentUser?.role || currentUser?.role === 'customer');

  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isAdminDashboard = location.pathname.startsWith('/admin');
  const isChefDashboard = location.pathname.startsWith('/chef');
  const isOwnerDashboard = location.pathname.startsWith('/owner');
  const isDeliveryDashboard = location.pathname.startsWith('/delivery');
  const isCustomerPortal = location.pathname.startsWith('/customer');
  const isHomePage = location.pathname === '/';

  // HIDE top consumer icons, navbar, bottom nav, and chatbot when ANY user is in their portal
  const showCustomerChrome = !isAdminDashboard && !isChefDashboard && !isOwnerDashboard && !isDeliveryDashboard && !isCustomerPortal && !isAuthPage;

  return (
    <LoginModalProvider>
      <div className={`app-shell ${isAdminDashboard ? 'admin-app-shell' : ''} ${isChefDashboard ? 'chef-app-shell' : ''} ${isOwnerDashboard ? 'owner-app-shell' : ''} ${isDeliveryDashboard ? 'delivery-app-shell' : ''} ${isCustomerPortal ? 'customer-app-shell' : ''} ${isAuthPage ? 'auth-app-shell' : ''}`}>
        {!online && <div className="offline-banner">📡 You're offline — showing previously loaded data.</div>}
        {showCustomerChrome && <Navbar />}
        <main className={`app-main ${isHomePage ? 'home-mode-main' : ''} ${isAdminDashboard ? 'admin-mode-main' : ''} ${isChefDashboard ? 'chef-mode-main' : ''} ${isOwnerDashboard ? 'owner-mode-main' : ''} ${isDeliveryDashboard ? 'delivery-mode-main' : ''} ${isCustomerPortal ? 'customer-mode-main' : ''} ${isAuthPage ? 'auth-mode-main' : ''}`}>
          <ErrorBoundary>
            <Routes>
              {/* Dedicated Customer Portal with Professional Left Sidebar (Shown ONLY after Customer Login) */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute role="customer">
                    <CustomerPortalLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CustomerDashboard />} />
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="restaurants" element={<Restaurants />} />
                <Route path="menu" element={<Menu />} />
                <Route path="orders" element={<Orders />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="cart" element={<Cart />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="recently-viewed" element={<RecentlyViewed />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="offers" element={<Offers />} />
                <Route path="assistant" element={<CustomerAssistant />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="addresses" element={<CustomerAddresses />} />
                <Route path="reviews" element={<CustomerReviews />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<Help />} />
              </Route>

              {/* Public Browsing Routes — Home page displays first for non-logged in users */}
              <Route path="/" element={<Home />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/restaurant/:id" element={<RestaurantDetails />} />
              <Route path="/restaurant/:restaurantId/menu" element={<RestaurantMenuBookPage />} />
              <Route path="/food/:id" element={<FoodDetails />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/offers" element={isCustomer ? <Navigate to="/customer/offers" replace /> : <Offers />} />
              <Route path="/contact" element={<Navigate to="/#contact-section" replace />} />
              <Route path="/cart" element={isCustomer ? <Navigate to="/customer/cart" replace /> : <Cart />} />
              <Route path="/recently-viewed" element={isCustomer ? <Navigate to="/customer/recently-viewed" replace /> : <RecentlyViewed />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/price-alerts" element={<PriceAlerts />} />
              <Route path="/restaurant/:id/live-layout" element={<LiveTableLayout />} />
              <Route path="/help" element={isCustomer ? <Navigate to="/customer/help" replace /> : <Help />} />

              {/* Customer Action & Ordering Routes (Seamless redirect to Customer Portal when logged in) */}
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
              <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/orders" replace /> : <Orders />}</ProtectedRoute>} />
              <Route path="/track-order/:id" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
              <Route path="/ebill/:id" element={<ProtectedRoute><EBill /></ProtectedRoute>} />
              <Route path="/book-table" element={<ProtectedRoute><BookTable /></ProtectedRoute>} />
              <Route path="/book-table/:restaurantId" element={<ProtectedRoute><BookTable /></ProtectedRoute>} />
              <Route path="/plan-dining" element={<ProtectedRoute><PlanDiningExperience /></ProtectedRoute>} />
              <Route path="/booking-success/:id" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
              <Route path="/my-bookings" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/bookings" replace /> : <MyBookings />}</ProtectedRoute>} />
              <Route path="/track-booking/:id" element={<ProtectedRoute><TrackBooking /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/wishlist" replace /> : <Wishlist />}</ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/notifications" replace /> : <Notifications />}</ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/profile" replace /> : <Profile />}</ProtectedRoute>} />
              <Route path="/rewards" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/rewards" replace /> : <Rewards />}</ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute>{isCustomer ? <Navigate to="/customer/settings" replace /> : <Settings />}</ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />

              {/* Unified Authentication Route for All Roles */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              {/* Redirect legacy role-specific paths to the unified Login */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/chef/login" element={<Navigate to="/login" replace />} />

              {/* Role Protected Chef Culinary Operations */}
              <Route path="/chef" element={<ProtectedRoute role="chef"><ChefDashboard /></ProtectedRoute>} />
              <Route path="/chef/dashboard" element={<ProtectedRoute role="chef"><ChefDashboard /></ProtectedRoute>} />

              {/* Role Protected Administrative Routes */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/:section" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/:section/:subId" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/:section/:subId/:extraId" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />
              <Route path="/owner/dashboard" element={<ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>} />

              {/* Role Protected Delivery Fleet Terminal */}
              <Route path="/delivery" element={<ProtectedRoute role="deliveryPartner"><DeliveryDashboard /></ProtectedRoute>} />
              <Route path="/delivery/dashboard" element={<ProtectedRoute role="deliveryPartner"><DeliveryDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </main>
        {showCustomerChrome && <DineBot />}
        {showCustomerChrome && <BottomNav />}
      </div>
    </LoginModalProvider>
  );
}
