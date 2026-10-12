// ZESTRO JWT Authentication & Authorization Verification Script
const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('================================================================');
  console.log('       ZESTRO JWT AUTHENTICATION & AUTHORIZATION TESTS          ');
  console.log('================================================================\n');

  const results = {};

  // -----------------------------------------------------------------
  // 1. CHECK LOGIN API (Customer)
  // -----------------------------------------------------------------
  console.log('>>> 2. CHECK LOGIN API (Existing Customer: customer@zestro.com)');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@zestro.com', password: 'Customer@123' })
  });
  const loginData = await loginRes.json();
  console.log(`Status: ${loginRes.status}`);
  console.log('Response:', JSON.stringify(loginData, null, 2));

  const hasSuccess = loginData.success === true;
  const hasToken = typeof loginData.token === 'string' && loginData.token.split('.').length === 3;
  const hasUser = !!loginData.user && loginData.user.role === 'customer';

  if (loginRes.status === 200 && hasSuccess && hasToken && hasUser) {
    results.customerLogin = 'PASS';
    results.jwtGenerated = 'PASS';
    console.log('--> Customer Login: PASS');
    console.log('--> JWT Generated: PASS\n');
  } else {
    results.customerLogin = 'FAIL';
    results.jwtGenerated = 'FAIL';
    console.log('--> Customer Login / JWT Generated: FAIL\n');
  }

  const customerToken = loginData.token;

  // -----------------------------------------------------------------
  // 3. VERIFY JWT TOKEN PAYLOAD
  // -----------------------------------------------------------------
  console.log('>>> 3. VERIFY JWT TOKEN');
  const payloadBase64 = customerToken.split('.')[1];
  const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
  const payload = JSON.parse(payloadJson);
  console.log('Decoded Payload:');
  console.log('  userId:', payload.userId || payload.id);
  console.log('  role:', payload.role);
  console.log('  iat:', payload.iat);
  console.log('  exp:', payload.exp);
  console.log(`Role matches "customer": ${payload.role === 'customer'}\n`);

  // -----------------------------------------------------------------
  // 4. TEST WITHOUT JWT (Protected API: /api/auth/me)
  // -----------------------------------------------------------------
  console.log('>>> 4. TEST WITHOUT JWT (/api/auth/me)');
  const noJwtRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const noJwtData = await noJwtRes.json();
  console.log(`Status: ${noJwtRes.status}`);
  console.log('Response:', JSON.stringify(noJwtData));

  if (noJwtRes.status === 401 && noJwtData.success === false) {
    results.protectedWithoutJwt = 'PASS';
    console.log('--> Protected API without JWT: PASS (Rejected with 401)\n');
  } else {
    results.protectedWithoutJwt = 'FAIL';
    console.log('--> Protected API without JWT: FAIL\n');
  }

  // -----------------------------------------------------------------
  // 5. TEST WITH VALID JWT (/api/auth/me)
  // -----------------------------------------------------------------
  console.log('>>> 5. TEST WITH VALID JWT (/api/auth/me)');
  const validJwtRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    }
  });
  const validJwtData = await validJwtRes.json();
  console.log(`Status: ${validJwtRes.status}`);
  console.log('Response:', JSON.stringify(validJwtData));

  if (validJwtRes.status === 200 && validJwtData.success === true && validJwtData.user) {
    results.protectedWithValidJwt = 'PASS';
    console.log('--> Protected API with valid JWT: PASS (200 OK)\n');
  } else {
    results.protectedWithValidJwt = 'FAIL';
    console.log('--> Protected API with valid JWT: FAIL\n');
  }

  // -----------------------------------------------------------------
  // 6. TEST INVALID JWT (/api/auth/me)
  // -----------------------------------------------------------------
  console.log('>>> 6. TEST INVALID JWT (/api/auth/me)');
  const invalidJwtRes = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer invalid-token'
    }
  });
  const invalidJwtData = await invalidJwtRes.json();
  console.log(`Status: ${invalidJwtRes.status}`);
  console.log('Response:', JSON.stringify(invalidJwtData));

  if (invalidJwtRes.status === 401 && invalidJwtData.success === false) {
    results.invalidJwtRejected = 'PASS';
    console.log('--> Invalid JWT rejected: PASS (Rejected with 401)\n');
  } else {
    results.invalidJwtRejected = 'FAIL';
    console.log('--> Invalid JWT rejected: FAIL\n');
  }

  // -----------------------------------------------------------------
  // 7. TEST CUSTOMER ROLE BLOCKED FROM ADMIN API (/api/admin/dashboard)
  // -----------------------------------------------------------------
  console.log('>>> 7. TEST CUSTOMER ROLE ACCESS TO ADMIN API (/api/admin/dashboard)');
  const custAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    }
  });
  const custAdminData = await custAdminRes.json();
  console.log(`Status: ${custAdminRes.status}`);
  console.log('Response:', JSON.stringify(custAdminData));

  if (custAdminRes.status === 403 && custAdminData.success === false) {
    results.customerBlockedFromAdmin = 'PASS';
    console.log('--> Customer blocked from admin API: PASS (403 Forbidden)\n');
  } else {
    results.customerBlockedFromAdmin = 'FAIL';
    console.log('--> Customer blocked from admin API: FAIL\n');
  }

  // -----------------------------------------------------------------
  // 8. TEST ADMIN ROLE (Login & Access Admin API)
  // -----------------------------------------------------------------
  console.log('>>> 8. TEST ADMIN ROLE (Login as dheivalakshmi7@gmail.com)');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dheivalakshmi7@gmail.com', password: 'Rohini#7' })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log(`Status: ${adminLoginRes.status}`);
  console.log('Response:', JSON.stringify(adminLoginData, null, 2));

  const hasAdminRole = adminLoginData.user && adminLoginData.user.role === 'admin';
  const hasAdminToken = typeof adminLoginData.token === 'string';

  if (adminLoginRes.status === 200 && adminLoginData.success && hasAdminRole && hasAdminToken) {
    results.adminJwtGenerated = 'PASS';
    console.log('--> Admin JWT generated: PASS (role="admin")\n');
  } else {
    results.adminJwtGenerated = 'FAIL';
    console.log('--> Admin JWT generated: FAIL\n');
  }

  const adminToken = adminLoginData.token;

  console.log('>>> 8b. ACCESS ADMIN API WITH ADMIN TOKEN (/api/admin/dashboard)');
  const adminAccessRes = await fetch(`${BASE_URL}/admin/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const adminAccessData = await adminAccessRes.json();
  console.log(`Status: ${adminAccessRes.status}`);
  console.log('Response:', JSON.stringify(adminAccessData, null, 2));

  if (adminAccessRes.status === 200 && adminAccessData.success === true && adminAccessData.admin && adminAccessData.admin.role === 'admin') {
    results.adminApiAccess = 'PASS';
    console.log('--> Admin API access: PASS (200 OK)\n');
  } else {
    results.adminApiAccess = 'FAIL';
    console.log('--> Admin API access: FAIL\n');
  }

  console.log('================================================================');
  console.log('                      TEST SUMMARY TABLE                        ');
  console.log('================================================================');
  console.table(results);
}

testAll().catch(e => {
  console.error('Fatal test execution error:', e);
});
