# K6 Load Testing for CraftingStable

## Prerequisites

1. **Install k6**:
   
   ```bash
   # Ubuntu/Debian
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6

   # macOS
   brew install k6

   # Windows (via Chocolatey)
   choco install k6
   ```

2. **Backend Running**: Ensure the Spring Boot backend is running on `localhost:5173`

## Running the Load Test

### Basic Run (Default Configuration)

```bash
cd performance
k6 run load_test.js
```

## Test Scenarios

The script includes three pre-configured scenarios:

| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| **Smoke** | 1 | 30s | Quick validation that the API works |
| **Load** | 10-20 | ~3min | Normal load simulation |
| **Stress** | 50 | ~1.5min | High load stress testing |

## Metrics & Thresholds

The test tracks these custom metrics:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration` | p95 < 2s | 95% of requests under 2 seconds |
| `errors` | rate < 10% | Error rate below 10% |
| `login_duration` | p95 < 1.5s | Login response time |
| `get_tools_duration` | p95 < 1s | Get tools endpoint response |

## Output

- **Console**: Real-time progress and summary
- **JSON File**: `performance/load_test_results.json` with detailed metrics