// Test script to verify the Unified Login system for ALL roles & security rules
const BASE_URL = 'http://localhost:5000/api';

async function runUnifiedLoginTests() {
  console.log('====================================================');
  console.log('       ZESTRO UNIFIED LOGIN SYSTEM VERIFICATION     ');
  console.log('====================================================\n');

  let passed = 0;

  // 1. Customer Login via Unified endpoint
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@zestro.com', password: 'Customer@123' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'customer' && data.token) {
      console.log('✓ TEST 1 PASSED: Customer logged in via unified endpoint -> role="customer", JWT issued');
      passed++;
    } else {
      console.error('✗ TEST 1 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 1 ERROR:', e.message);
  }

  // 2. Admin Login via SAME Unified endpoint
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dheivalakshmi7@gmail.com', password: 'Rohini#7' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'admin' && data.token) {
      console.log('✓ TEST 2 PASSED: Admin logged in via SAME unified endpoint -> role="admin", JWT issued');
      passed++;
    } else {
      console.error('✗ TEST 2 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 2 ERROR:', e.message);
  }

  // 3. Chef Login via SAME Unified endpoint
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'chef@zestro.com', password: 'Chef@123' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'chef' && data.token) {
      console.log('✓ TEST 3 PASSED: Chef logged in via SAME unified endpoint -> role="chef", JWT issued');
      passed++;
    } else {
      console.error('✗ TEST 3 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 3 ERROR:', e.message);
  }

  // 4. Restaurant Manager Login via SAME Unified endpoint
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@zestro.com', password: 'Manager@123' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'restaurantManager' && data.token) {
      console.log('✓ TEST 4 PASSED: Restaurant Manager logged in via SAME unified endpoint -> role="restaurantManager"');
      passed++;
    } else {
      console.error('✗ TEST 4 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 4 ERROR:', e.message);
  }

  // 5. Delivery Partner Login via SAME Unified endpoint
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'delivery@zestro.com', password: 'Delivery@123' }),
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.user.role === 'deliveryPartner' && data.token) {
      console.log('✓ TEST 5 PASSED: Delivery Partner logged in via SAME unified endpoint -> role="deliveryPartner"');
      passed++;
    } else {
      console.error('✗ TEST 5 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 5 ERROR:', e.message);
  }

  // 6. Invalid credentials error handling
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@zestro.com', password: 'WrongPassword999!' }),
    });
    const data = await res.json();
    if (res.status === 401 && !data.success && data.message === 'Invalid email or password. Please try again.') {
      console.log('✓ TEST 6 PASSED: Exact error returned: "Invalid email or password. Please try again."');
      passed++;
    } else {
      console.error('✗ TEST 6 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 6 ERROR:', e.message);
  }

  // 7. Non-existent user error handling (generic error without disclosing user existence)
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_account@zestro.com', password: 'SomePassword@123' }),
    });
    const data = await res.json();
    if (res.status === 401 && !data.success && data.message === 'Invalid email or password. Please try again.') {
      console.log('✓ TEST 7 PASSED: Non-existent user returns exact same generic error (security intact)');
      passed++;
    } else {
      console.error('✗ TEST 7 FAILED:', res.status, data);
    }
  } catch (e) {
    console.error('✗ TEST 7 ERROR:', e.message);
  }

  console.log('\n====================================================');
  console.log(`  RESULT: ${passed}/7 UNIFIED LOGIN TESTS PASSED!`);
  console.log('====================================================\n');
}

runUnifiedLoginTests();
