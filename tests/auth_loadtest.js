import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
};

const BASE_URL = __ENV.TARGET_URL || 'https://survivor-underground-assistance-affected.trycloudflare.com';

export default function () {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@recoverflow.dev',
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, { 'login status is 200': (r) => r.status === 200 });

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).access_token;
    const oppRes = http.get(`${BASE_URL}/api/v1/opportunities`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    check(oppRes, { 'opportunities status is 200': (r) => r.status === 200 });
  }
  sleep(1);
}
