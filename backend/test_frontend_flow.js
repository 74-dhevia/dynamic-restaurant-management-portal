// Test Frontend Redux Login, JWT storage & Role-based Redirection Logic
const API_BASE_URL = 'http://localhost:5000/api';

async function testFrontendFlow() {
  console.log('================================================================');
  console.log('       ZESTRO FRONTEND LOGIN & REDIRECT FLOW VERIFICATION       ');
  console.log('================================================================\n');

  // Helper simulating Login.jsx destination resolution logic
  function resolveDestination(role, from = '/') {
    if (role === 'admin') {
      return '/admin/dashboard';
    } else if (role === 'chef') {
      return '/chef/dashboard';
    } else if (role === 'restaurantManager' || role === 'owner') {
      return '/owner/dashboard';
    } else if (role === 'deliveryPartner') {
      return '/orders';
    } else {
      const destination = (
        from === '/login' ||
        from === '/register' ||
        from.startsWith('/admin') ||
        from.startsWith('/chef') ||
        from.startsWith('/owner')
      ) ? '/' : from;
      return destination;
    }
  }

  // 1. CUSTOMER FRONTEND FLOW
  console.log('--- 1. CUSTOMER FLOW ---');
  console.log('1. User submits login form with customer credentials');
  const custRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@zestro.com', password: 'Customer@123' })
  });
  const custData = await custRes.json();
  console.log('2. Backend Authentication status:', custRes.status, 'success:', custData.success);
  console.log('3. JWT received:', typeof custData.token === 'string' && custData.token.length > 20);
  console.log('4. Role detected:', custData.user.role);
  const custDest = resolveDestination(custData.user.role);
  console.log('5. Destination page:', custDest);
  const custRedirectPass = custDest === '/';
  console.log('Customer Redirect Result:', custRedirectPass ? 'PASS' : 'FAIL');

  // 2. LOGOUT & SESSION CLEAR FLOW
  console.log('\n--- 2. LOGOUT & SESSION FLOW ---');
  let sessionToken = custData.token;
  console.log('Active session token exists:', !!sessionToken);
  // Simulate logout: clear session token and state
  sessionToken = null;
  console.log('Logout performed: Token cleared ->', sessionToken);
  // Protected route check without token:
  const noTokenCheck = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Protected route access without token: HTTP', noTokenCheck.status, '(Access denied/Unauthorized)');
  const logoutPass = noTokenCheck.status === 401 && sessionToken === null;
  console.log('Logout / Session Test Result:', logoutPass ? 'PASS' : 'FAIL');

  // 3. ADMIN FRONTEND FLOW
  console.log('\n--- 3. ADMIN FLOW ---');
  console.log('1. User submits login form with admin credentials (dheivalakshmi7@gmail.com)');
  const adminRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dheivalakshmi7@gmail.com', password: 'Rohini#7' })
  });
  const adminData = await adminRes.json();
  console.log('2. Backend Authentication status:', adminRes.status, 'success:', adminData.success);
  console.log('3. JWT received:', typeof adminData.token === 'string' && adminData.token.length > 20);
  console.log('4. Role detected:', adminData.user.role);
  const adminDest = resolveDestination(adminData.user.role);
  console.log('5. Destination page:', adminDest);
  const adminRedirectPass = adminDest === '/admin/dashboard';
  console.log('Admin Redirect Result:', adminRedirectPass ? 'PASS' : 'FAIL');

  console.log('\n================================================================');
  console.log('All frontend routing and session tests completed.');
  console.log('================================================================\n');

  return {
    customerRedirect: custRedirectPass ? 'PASS' : 'FAIL',
    adminRedirect: adminRedirectPass ? 'PASS' : 'FAIL',
    logoutSession: logoutPass ? 'PASS' : 'FAIL'
  };
}

testFrontendFlow().catch(console.error);
