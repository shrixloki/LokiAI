# ML API Dockerfile for LokiAI Python Services
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt* ./

# Install Python dependencies
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    numpy \
    pandas \
    scikit-learn \
    aiohttp \
    requests \
    web3 \
    python-json-logger \
    pytest \
    pytest-asyncio

# Copy Python source files
COPY ml_api_service.py ./
COPY agent_monitor.py ./
COPY system_status.py ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start ML API service
CMD ["python", "ml_api_service.py"]