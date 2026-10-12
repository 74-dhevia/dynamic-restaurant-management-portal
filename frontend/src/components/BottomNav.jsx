import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import Icon from './Icon';

export default function BottomNav() {
  const loc = useLocation();
  const { t } = useLanguage();
  const currentUser = useSelector(s => s.auth.currentUser);

  if (['/login', '/register', '/forgot-password'].includes(loc.pathname) || loc.pathname.startsWith('/customer')) return null;

  const items = [
    { to: '/', iconName: 'home', label: t('home') },
    { to: '/restaurants', iconName: 'restaurant', label: t('restaurants') },
    { to: '/menu', iconName: 'menu', label: t('menu') || 'Menu' },
    { to: '/cart', iconName: 'cart', label: t('cart') },
    { to: '/orders', iconName: 'orders', label: t('orders') },
    ...(currentUser?.role === 'admin' ? [{
      to: '/admin/dashboard',
      iconName: 'admin',
      label: 'Admin',
    }] : []),
    {
      to: currentUser ? '/profile' : '/login',
      iconName: 'profile',
      label: currentUser ? t('profile') : (t('signIn') || 'Sign In'),
      customIcon: currentUser?.avatar && currentUser.avatar.startsWith('http') ? (
        <img
          src={currentUser.avatar}
          alt={currentUser.fullName}
          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : null,
    },
  ];

  return (
    <div className="bottom-nav">
      {items.map(it => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="bn-icon">
            {it.customIcon || <Icon name={it.iconName} size={20} />}
          </span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
