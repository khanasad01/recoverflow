import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://survivor-underground-assistance-affected.trycloudflare.com';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

