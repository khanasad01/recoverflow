import time
import argparse
import statistics
import concurrent.futures
import requests

DEFAULT_API_URL = "http://localhost:8000"


def authenticate(api_url: str) -> str:
    """Log in and retrieve JWT bearer token."""
    resp = requests.post(
        f"{api_url}/api/v1/auth/login",
        json={"email": "admin@recoverflow.dev", "password": "admin123"},
        timeout=10
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Authentication failed ({resp.status_code}): {resp.text}")
    return resp.json()["access_token"]


def execute_request(api_url: str, token: str, endpoint: str) -> tuple[int, float]:
    """Execute a single HTTP request and record response code and latency."""
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    try:
        resp = requests.get(f"{api_url}{endpoint}", headers=headers, timeout=10)
        latency = (time.time() - start) * 1000.0  # ms
        return resp.status_code, latency
    except Exception as e:
        latency = (time.time() - start) * 1000.0
        return 500, latency


def run_load_test(api_url: str = DEFAULT_API_URL, total_requests: int = 50, concurrency: int = 5):
    print("=" * 60)
    print(" RecoverFlow Python Load & Concurrency Benchmark")
    print("=" * 60)
    print(f"Target: {api_url}")
    print(f"Total Requests: {total_requests} | Concurrency: {concurrency}")
    print("Authenticating as admin...")

    token = authenticate(api_url)
    print("✅ Authenticated. Running load test...")

    endpoints = [
        "/api/v1/overview",
        "/api/v1/opportunities?sort=score&limit=20",
        "/api/v1/customers?limit=20",
        "/metrics"
    ]

    latencies = []
    status_codes = {}

    start_total = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(total_requests):
            ep = endpoints[i % len(endpoints)]
            futures.append(executor.submit(execute_request, api_url, token, ep))

        for f in concurrent.futures.as_completed(futures):
            code, latency = f.result()
            latencies.append(latency)
            status_codes[code] = status_codes.get(code, 0) + 1

    total_time = time.time() - start_total
    rps = total_requests / total_time if total_time > 0 else 0

    print("\n" + "=" * 60)
    print(" BENCHMARK RESULTS")
    print("=" * 60)
    print(f"Total Time Taken    : {total_time:.2f}s")
    print(f"Throughput (RPS)    : {rps:.2f} req/sec")
    print(f"Status Breakdown    : {status_codes}")
    print(f"Min Latency         : {min(latencies):.2f}ms")
    print(f"Median Latency (p50): {statistics.median(latencies):.2f}ms")
    print(f"p95 Latency         : {statistics.quantiles(latencies, n=20)[18]:.2f}ms" if len(latencies) >= 20 else f"Avg: {statistics.mean(latencies):.2f}ms")
    print(f"Max Latency         : {max(latencies):.2f}ms")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RecoverFlow Load Tester")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="Base API URL")
    parser.add_argument("--requests", type=int, default=40, help="Total requests")
    parser.add_argument("--concurrency", type=int, default=5, help="Concurrent workers")
    args = parser.parse_args()

    run_load_test(api_url=args.url, total_requests=args.requests, concurrency=args.concurrency)
