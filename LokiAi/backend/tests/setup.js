// Test setup file for blockchain utilities tests
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Only show errors in tests unless DEBUG is set
if (!process.env.DEBUG) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Global test utilities
global.testUtils = {
  // Restore console methods if needed
  restoreConsole: () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  },
  
  // Create mock wallet address
  createMockAddress: () => '0x' + '1'.repeat(40),
  
  // Create mock transaction hash
  createMockTxHash: () => '0x' + 'a'.repeat(64),
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Global test configuration
global.testConfig = {
  timeout: 10000,
  retries: 2
};

// Cleanup after all tests
afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});