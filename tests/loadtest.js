import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Ramp-up to 10 users
    { duration: '20s', target: 50 },  // Ramp-up to 50 users
    { duration: '10s', target: 0 },   // Scale-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // 1. Authenticate as Admin
  const loginPayload = JSON.stringify({
    email: 'admin@recoverflow.dev',
    password: 'admin123',
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);
  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).access_token;
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  // 2. Fetch Overview KPIs
  const overviewRes = http.get(`${BASE_URL}/api/v1/overview`, authHeaders);
  check(overviewRes, {
    'overview status is 200': (r) => r.status === 200,
  });

  // 3. Fetch Opportunities (sorted by score)
  const oppsRes = http.get(`${BASE_URL}/api/v1/opportunities?sort=score&limit=20`, authHeaders);
  check(oppsRes, {
    'opportunities list status is 200': (r) => r.status === 200,
  });

  // 4. Fetch Customers
  const custRes = http.get(`${BASE_URL}/api/v1/customers?limit=20`, authHeaders);
  check(custRes, {
    'customers list status is 200': (r) => r.status === 200,
  });

  // 5. Scrape Prometheus Metrics
  const metricsRes = http.get(`${BASE_URL}/metrics`);
  check(metricsRes, {
    'metrics status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
