import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerSidebar from '../components/customer/CustomerSidebar';
import Icon from '../components/Icon';
import '../components/customer/CustomerPortal.css';

export default function CustomerPortalLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('zestro_customer_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const mainContentRef = React.useRef(null);

  useEffect(() => {
    setIsMobileOpen(false);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('zestro_customer_sidebar_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <div className="customer-portal-root">
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="customer-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Primary Customer Left Sidebar */}
      <CustomerSidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div ref={mainContentRef} className={`customer-portal-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <button
          type="button"
          className="customer-mobile-toggle-btn"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open Customer Navigation Menu"
        >
          <Icon name="menu" size={16} />
          <span>Customer Menu</span>
        </button>

        <Outlet />
      </div>
    </div>
  );
}
