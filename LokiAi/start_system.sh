#!/bin/bash

echo "🚀 Starting LokiAI Complete System..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js 18+ and try again"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install fastapi uvicorn numpy pandas scikit-learn aiohttp requests web3 python-json-logger pytest pytest-asyncio > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ Some Python packages may have failed to install"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install express cors ethers node-fetch winston dotenv web3 > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ Some Node.js packages may have failed to install"
fi

echo
echo "🎯 Starting all services..."
echo

# Create log directory
mkdir -p logs

# Function to start service in background
start_service() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "🔄 Starting $name (Port $port)..."
    $command > "logs/${name,,}.log" 2>&1 &
    local pid=$!
    echo $pid > "logs/${name,,}.pid"
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $name started successfully (PID: $pid)"
    else
        echo "❌ Failed to start $name"
        return 1
    fi
}

# Start ML API Service
start_service "ML-API" "python3 ml_api_service.py" "8000"

# Start Backend Server
start_service "Backend" "node backend_server_enhanced.js" "25001"

# Start Deposit Service
start_service "Deposit-Service" "node backend_deposit_service.js" "25002"

# Start Frontend
start_service "Frontend" "npm run dev" "5173"

# Start Monitor (Optional)
start_service "Monitor" "python3 agent_monitor.py" "N/A"

echo
echo "✅ All services started!"
echo
echo "📊 Service URLs:"
echo "  - Frontend:        http://localhost:5173"
echo "  - Backend:         http://127.0.0.1:25001"
echo "  - Deposit Service: http://127.0.0.1:25002"
echo "  - ML API:          http://127.0.0.1:8000"
echo "  - ML API Docs:     http://127.0.0.1:8000/docs"
echo
echo "🧪 To run integration tests:"
echo "  node test_integration.js"
echo
echo "🛑 To stop all services:"
echo "  ./stop_system.sh"
echo
echo "📋 Service logs are in the 'logs' directory"
echo

# Wait for user input
read -p "Press Enter to continue or Ctrl+C to exit..."