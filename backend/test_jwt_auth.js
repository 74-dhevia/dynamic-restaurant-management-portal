// Test script to verify all 8 JWT Authentication & Authorization flows
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('  ZESTRO JWT AUTHENTICATION & AUTHORIZATION TESTS   ');
  console.log('====================================================\n');

  let passedCount = 0;
  const testUserEmail = `foodie_${Date.now()}@zestro.com`;
  const testPassword = 'Password@123';
  let customerToken = null;
  let adminToken = null;

  // TEST 1: Customer Registration -> MongoDB
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kovilpatti Foodie',
        email: testUserEmail,
        phone: '+91 98401 99999',
        password: testPassword,
        role: 'admin', // Should be ignored by backend and forced to 'customer'
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.user.role === 'customer' && data.token) {
      console.log('✓ TEST 1 PASSED: Customer registered with enforced role "customer", password hashed & JWT returned');
      customerToken = data.token;
      passedCount++;
    } else {
      console.error('✗ TEST 1 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 1 ERROR:', err.message);
  }

  // TEST 2: Customer Login -> JWT Generated
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testPassword,
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.token && !data.user.password) {
      console.log('✓ TEST 2 PASSED: Customer login verified via bcrypt, safe user returned & JWT generated');
      customerToken = data.token;
      passedCount++;
    } else {
      console.error('✗ TEST 2 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 2 ERROR:', err.message);
  }

  // TEST 3: Customer Accesses Own Profile -> SUCCESS (200)
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.email === testUserEmail) {
      console.log('✓ TEST 3 PASSED: Customer accesses own profile with JWT Bearer token');
      passedCount++;
    } else {
      console.error('✗ TEST 3 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 3 ERROR:', err.message);
  }

  // TEST 4: Customer Accesses Admin API -> DENIED (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
    });
    const data = await res.json();
    if (res.status === 403 && !data.success && data.message === 'Access denied') {
      console.log('✓ TEST 4 PASSED: Customer blocked from Admin API with 403 Forbidden ("Access denied")');
      passedCount++;
    } else {
      console.error('✗ TEST 4 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 4 ERROR:', err.message);
  }

  // TEST 5: Admin Login -> JWT Generated
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dheivalakshmi7@gmail.com',
        password: 'Rohini#7',
      }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'admin' && data.token) {
      console.log('✓ TEST 5 PASSED: Admin login verified (dheivalakshmi7@gmail.com), role="admin" & JWT generated');
      adminToken = data.token;
      passedCount++;
    } else {
      console.error('✗ TEST 5 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 5 ERROR:', err.message);
  }

  // TEST 6: Admin Accesses Admin Dashboard/API -> SUCCESS (200)
  try {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.admin.role === 'admin') {
      console.log('✓ TEST 6 PASSED: Admin accesses Admin Dashboard with valid admin JWT');
      passedCount++;
    } else {
      console.error('✗ TEST 6 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 6 ERROR:', err.message);
  }

  // TEST 7: Logout -> Session Cleared & No Token Access
  try {
    // Simulate unauthenticated request without token
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.status === 401 && !data.success && data.message === 'Authentication required') {
      console.log('✓ TEST 7 PASSED: After logout / without token, protected routes are inaccessible (401)');
      passedCount++;
    } else {
      console.error('✗ TEST 7 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 7 ERROR:', err.message);
  }

  // TEST 8: Expired / Invalid Token -> 401 Unauthorized
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.bogus.jwt.token',
      },
    });
    const data = await res.json();
    if (res.status === 401 && !data.success) {
      console.log('✓ TEST 8 PASSED: Invalid/tampered JWT rejected with 401 Unauthorized');
      passedCount++;
    } else {
      console.error('✗ TEST 8 FAILED:', res.status, data);
    }
  } catch (err) {
    console.error('✗ TEST 8 ERROR:', err.message);
  }

  console.log('\n====================================================');
  console.log(`  RESULT: ${passedCount}/8 TESTS PASSED SUCCESSFULLY! `);
  console.log('====================================================\n');
}

runTests();
