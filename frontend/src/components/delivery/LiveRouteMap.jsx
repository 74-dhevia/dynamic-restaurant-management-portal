import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '../Icon';
import {
  resolveRestaurantCoordinates,
  resolveCustomerCoordinates,
  generateRouteWaypoints,
  getInterpolatedRiderPosition,
  haversineDistanceKm,
  calculateEtaMinutes,
  getGoogleMapsNavUrl,
  generateTurnByTurnDirections,
} from '../../utils/deliveryTrackingUtils';

export default function LiveRouteMap({
  order,
  riderInfo,
  viewMode = 'customer', // 'customer' | 'rider'
  onLocationUpdate,
  height = 420,
}) {
  const [useDeviceGps, setUseDeviceGps] = useState(false);
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [simulationActive, setSimulationActive] = useState(true);
  const [routeProgress, setRouteProgress] = useState(
    order?.status === 'Delivered' ? 1 : order?.status === 'Preparing' ? 0.1 : 0.55
  );
  const [showDirections, setShowDirections] = useState(false);

  // 1. Resolve Locations
  const restaurantCoords = useMemo(() => resolveRestaurantCoordinates(order), [order]);
  const customerCoords = useMemo(() => resolveCustomerCoordinates(order), [order]);

  // 2. Generate Street Grid Route Waypoints
  const waypoints = useMemo(() => {
    return generateRouteWaypoints(restaurantCoords, customerCoords, 10);
  }, [restaurantCoords, customerCoords]);

  // 3. Current Live Rider Coordinates
  const riderCoords = useMemo(() => {
    if (useDeviceGps && deviceCoords) {
      return deviceCoords;
    }
    return getInterpolatedRiderPosition(waypoints, routeProgress);
  }, [useDeviceGps, deviceCoords, waypoints, routeProgress]);

  // 4. Distances & ETA
  const totalTripKm = useMemo(() => {
    return haversineDistanceKm(
      restaurantCoords.lat,
      restaurantCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );
  }, [restaurantCoords, customerCoords]);

  const remainingDistanceKm = useMemo(() => {
    return haversineDistanceKm(
      riderCoords.lat,
      riderCoords.lng,
      customerCoords.lat,
      customerCoords.lng
    );
  }, [riderCoords, customerCoords]);

  const remainingEtaMinutes = useMemo(() => {
    return calculateEtaMinutes(remainingDistanceKm);
  }, [remainingDistanceKm]);

  // Turn by turn directions
  const directions = useMemo(() => {
    return generateTurnByTurnDirections(restaurantCoords, customerCoords, remainingDistanceKm);
  }, [restaurantCoords, customerCoords, remainingDistanceKm]);

  // 5. Simulation Timer (Smooth rider movement along the street)
  useEffect(() => {
    if (!simulationActive || useDeviceGps || order?.status === 'Delivered') return;

    const interval = setInterval(() => {
      setRouteProgress(prev => {
        if (prev >= 0.98) return 0.98;
        const next = +(prev + 0.015).toFixed(4);
        if (onLocationUpdate) {
          const currentPos = getInterpolatedRiderPosition(waypoints, next);
          onLocationUpdate({
            riderCoords: currentPos,
            distanceKm: haversineDistanceKm(currentPos.lat, currentPos.lng, customerCoords.lat, customerCoords.lng),
            etaMinutes: calculateEtaMinutes(haversineDistanceKm(currentPos.lat, currentPos.lng, customerCoords.lat, customerCoords.lng)),
          });
        }
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [simulationActive, useDeviceGps, order?.status, waypoints, customerCoords, onLocationUpdate]);

  // 6. Device GPS Geolocation Watcher
  const toggleDeviceGps = () => {
    if (useDeviceGps) {
      setUseDeviceGps(false);
      setDeviceCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        };
        setDeviceCoords(coords);
        setUseDeviceGps(true);
        if (onLocationUpdate) {
          onLocationUpdate({
            riderCoords: coords,
            distanceKm: haversineDistanceKm(coords.lat, coords.lng, customerCoords.lat, customerCoords.lng),
            etaMinutes: calculateEtaMinutes(haversineDistanceKm(coords.lat, coords.lng, customerCoords.lat, customerCoords.lng)),
          });
        }
      },
      err => {
        setGpsError('GPS permission denied or unavailable. Using simulated live route.');
        setUseDeviceGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Google Maps external turn-by-turn navigation link
  const googleMapsUrl = getGoogleMapsNavUrl(
    customerCoords.lat,
    customerCoords.lng,
    riderCoords.lat,
    riderCoords.lng
  );

  // SVG Projection Calculation: Normalize GPS coordinates into 0-100% SVG coordinates
  const bounds = useMemo(() => {
    const lats = [restaurantCoords.lat, customerCoords.lat, riderCoords.lat];
    const lngs = [restaurantCoords.lng, customerCoords.lng, riderCoords.lng];
    const minLat = Math.min(...lats) - 0.002;
    const maxLat = Math.max(...lats) + 0.002;
    const minLng = Math.min(...lngs) - 0.003;
    const maxLng = Math.max(...lngs) + 0.003;
    return { minLat, maxLat, minLng, maxLng };
  }, [restaurantCoords, customerCoords, riderCoords]);

  const projectToSvg = (lat, lng) => {
    const pad = 12; // 12% padding inside canvas
    const xPct = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 0.001)) * (100 - 2 * pad);
    // Invert Y because latitude increases northward while SVG Y increases downward
    const yPct = pad + (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 0.001)) * (100 - 2 * pad);
    return { x: +xPct.toFixed(2), y: +yPct.toFixed(2) };
  };

  const restPt = projectToSvg(restaurantCoords.lat, restaurantCoords.lng);
  const custPt = projectToSvg(customerCoords.lat, customerCoords.lng);
  const riderPt = projectToSvg(riderCoords.lat, riderCoords.lng);

  const polylinePoints = waypoints
    .map(w => {
      const pt = projectToSvg(w.lat, w.lng);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  const partnerName = riderInfo?.name || riderInfo?.fullName || 'Suresh Kumar (Rider)';
  const partnerPhone = riderInfo?.phone || '+91 98401 23456';
  const partnerVehicle = riderInfo?.vehicleNumber || 'TN 69 AB 1234';

  return (
    <div
      className="live-route-container"
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        border: '1.5px solid var(--border)',
        background: '#0d1117',
        color: '#ffffff',
        position: 'relative',
        boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
      }}
    >
      {/* Top Floating HUD Bar */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '10px 16px',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #e8542a, #ff7a00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🛵
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 800, letterSpacing: 0.5 }}>
              {viewMode === 'rider' ? 'Customer Delivery Route' : 'Food On The Way'}
            </div>
            <strong style={{ fontSize: 15, color: '#f8fafc' }}>
              {remainingDistanceKm <= 0.2
                ? 'Arrived at Doorstep!'
                : `${remainingDistanceKm} km away • ETA ~${remainingEtaMinutes} min`}
            </strong>
          </div>
        </div>

        {/* Quick GPS Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: 8,
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              border: 'none',
            }}
            title="Open Turn-by-Turn GPS navigation in Google Maps"
          >
            <span>🧭</span>
            <span>Google Maps GPS</span>
          </a>

          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleDeviceGps}
            style={{
              background: useDeviceGps ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 8,
              padding: '6px 10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
            title="Use real smartphone or laptop GPS location"
          >
            <span>📍</span>
            <span>{useDeviceGps ? 'GPS Active' : 'My Live GPS'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowDirections(!showDirections)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 8,
              padding: '6px 10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
            }}
          >
            <span>{showDirections ? '✕ Hide Steps' : '📋 Steps'}</span>
          </button>
        </div>
      </div>

      {/* GPS Error alert if permission denied */}
      {gpsError && (
        <div
          style={{
            position: 'absolute',
            top: 68,
            left: 14,
            right: 14,
            zIndex: 11,
            background: 'rgba(239, 68, 68, 0.92)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {gpsError}</span>
          <button type="button" onClick={() => setGpsError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>×</button>
        </div>
      )}

      {/* Main SVG Interactive Map Canvas */}
      <div style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 50% 50%, #161b22 0%, #0d1117 100%)',
          }}
        >
          {/* Subtle Grid / Street Canvas Pattern */}
          <defs>
            <pattern id="streetGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.4" />
            </pattern>
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8542a" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#streetGrid)" />

          {/* Ambient Road Vectors */}
          <path
            d="M 5,20 Q 40,35 95,15 M 10,80 Q 55,65 90,85 M 25,5 Q 30,50 20,95 M 75,5 Q 70,55 80,95"
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="0.8"
          />

          {/* 1. Planned Delivery Route Polyline */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="rgba(59, 130, 246, 0.35)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 2. Active Glowing Route with Traveling Dash */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="url(#routeGlow)"
            strokeWidth="2.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3, 1.5"
            filter="url(#neonGlow)"
          >
            <animate attributeName="stroke-dashoffset" values="18;0" dur="1.6s" repeatCount="indefinite" />
          </polyline>

          {/* 3. Restaurant Point (Pickup) */}
          <g transform={`translate(${restPt.x}, ${restPt.y})`}>
            <circle r="3.2" fill="#ef4444" opacity="0.3">
              <animate attributeName="r" values="2.5;5;2.5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="2.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
          </g>

          {/* 4. Customer Point (Doorstep Destination) */}
          <g transform={`translate(${custPt.x}, ${custPt.y})`}>
            <circle r="4.0" fill="#10b981" opacity="0.3">
              <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="2.4" fill="#10b981" stroke="#ffffff" strokeWidth="0.6" />
          </g>

          {/* 5. Moving Delivery Rider (🛵) */}
          <g transform={`translate(${riderPt.x}, ${riderPt.y})`}>
            <circle r="4.8" fill="#e8542a" opacity="0.35">
              <animate attributeName="r" values="3.5;7.5;3.5" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.05;0.5" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle r="2.8" fill="#e8542a" stroke="#ffffff" strokeWidth="0.7" />
          </g>
        </svg>

        {/* HTML Markers Overlaid with absolute positioning for high-DPI text/icons */}
        {/* Restaurant Pin */}
        <div
          style={{
            position: 'absolute',
            left: `${restPt.x}%`,
            top: `${restPt.y}%`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
              marginBottom: 2,
            }}
          >
            🏪 {restaurantCoords.name}
          </div>
          <span style={{ fontSize: 16 }}>📍</span>
        </div>

        {/* Customer Doorstep Pin */}
        <div
          style={{
            position: 'absolute',
            left: `${custPt.x}%`,
            top: `${custPt.y}%`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
              marginBottom: 2,
            }}
          >
            🏠 {viewMode === 'rider' ? 'Customer Doorstep' : 'Your Delivery Location'}
          </div>
          <span style={{ fontSize: 18 }}>📍</span>
        </div>

        {/* Rider Bike Marker */}
        <div
          style={{
            position: 'absolute',
            left: `${riderPt.x}%`,
            top: `${riderPt.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'all 0.5s ease-out',
          }}
        >
          <div
            style={{
              background: '#e8542a',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 800,
              padding: '1px 7px',
              borderRadius: 10,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(232, 84, 42, 0.6)',
              marginBottom: 2,
            }}
          >
            🛵 {partnerName.split(' ')[0]} ({partnerVehicle.slice(-4)})
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              boxShadow: '0 0 14px rgba(232, 84, 42, 0.9)',
              border: '2px solid #e8542a',
            }}
          >
            🛵
          </div>
        </div>

        {/* Turn-by-turn Step Instructions Drawer */}
        {showDirections && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              maxHeight: 180,
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '12px 14px',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 13, color: '#f8fafc' }}>
                🛣️ Turn-by-Turn Route Navigation Steps ({directions.length})
              </strong>
              <button
                type="button"
                onClick={() => setShowDirections(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {directions.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 12,
                    color: idx === 0 ? '#10b981' : idx === directions.length - 1 ? '#38bdf8' : '#cbd5e1',
                    padding: '4px 0',
                    borderBottom: idx < directions.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>{d.instruction}</div>
                  <strong style={{ fontSize: 11, color: '#94a3b8' }}>{d.distance}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Rider / Customer Contact Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.98)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {viewMode === 'rider' ? '👤' : '🛵'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
              {viewMode === 'rider' ? (order?.customerName || 'Customer') : partnerName}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>📞 {viewMode === 'rider' ? (order?.customerPhone || '+91 98401 23456') : partnerPhone}</span>
              <span>•</span>
              <span>{viewMode === 'rider' ? (customerCoords.label || 'Kovilpatti') : `${partnerVehicle} • ⭐ 4.9`}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={`tel:${viewMode === 'rider' ? (order?.customerPhone || '+919840123456') : partnerPhone}`}
            className="btn btn-sm"
            style={{
              background: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 12.5,
              borderRadius: 8,
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              border: 'none',
            }}
          >
            <Icon name="phone" size={14} />
            <span>Call {viewMode === 'rider' ? 'Customer' : 'Delivery Partner'}</span>
          </a>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setSimulationActive(!simulationActive)}
            style={{
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 8,
              color: '#cbd5e1',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
            title="Toggle animated simulation"
          >
            {simulationActive ? '⏸️ Pause Sim' : '▶️ Resume Sim'}
          </button>
        </div>
      </div>
    </div>
  );
}
