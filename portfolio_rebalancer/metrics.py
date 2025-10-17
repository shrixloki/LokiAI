from prometheus_client import Counter, Summary, Histogram, start_http_server, REGISTRY
import os

# Define metrics
TRADES_TOTAL = Counter(
    'lokiai_trades_total',
    'Total number of trades handled by agent',
    ['agent', 'status']
)

GAS_COST_USD_TOTAL = Counter(
    'lokiai_gas_cost_usd_total',
    'Total gas cost in USD',
    ['agent']
)

TRADE_EXECUTION_SECONDS = Histogram(
    'lokiai_trade_execution_seconds',
    'Time spent executing trades',
    ['agent'],
    buckets=(0.1, 0.5, 1, 2, 5, 10, 20)
)

RUNS_TOTAL = Counter(
    'lokiai_runs_total',
    'Total runs of the rebalancer executor',
    ['agent']
)


def start_metrics_server():
    """Start the Prometheus metrics HTTP server on configured port."""
    port = int(os.getenv('PROMETHEUS_PORT', '9100'))
    start_http_server(port)
    return port