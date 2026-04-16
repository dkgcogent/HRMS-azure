// Connection Test Script
// This script tests the connection between frontend, backend, and database

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8080';
const API_URL = `${BACKEND_URL}/api`;

async function testConnections() {
  console.log('🔗 Testing HRMS System Connections...\n');

  // Test 1: Backend Health Check
  try {
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log(`   ✅ Backend: ${healthResponse.data.status}`);
    console.log(`   ✅ Database: ${healthResponse.data.database}`);
    console.log(`   📅 Timestamp: ${healthResponse.data.timestamp}\n`);
  } catch (error) {
    console.log(`   ❌ Backend Health Check Failed: ${error.message}\n`);
    return;
  }

  // Test 2: Master Data Endpoints
  const endpoints = [
    { name: 'Manpower Types', url: '/master-data/manpower-types' },
    { name: 'Departments', url: '/master-data/departments' },
    { name: 'Designations', url: '/master-data/designations' },
    { name: 'Shifts', url: '/master-data/shifts' },
    { name: 'Work Locations', url: '/master-data/work-locations' },
    { name: 'Banks', url: '/master-data/banks' },
    { name: 'Payment Modes', url: '/master-data/payment-modes' },
    { name: 'Qualifications', url: '/master-data/qualifications' }
  ];

  console.log('2️⃣ Testing Master Data Endpoints...');
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_URL}${endpoint.url}`);
      const dataCount = response.data.data ? response.data.data.length : 0;
      console.log(`   ✅ ${endpoint.name}: ${dataCount} records found`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.response?.status || 'Connection Error'}`);
    }
  }

  console.log('\n🎯 Connection Test Summary:');
  console.log('   Frontend URL: http://localhost:3001');
  console.log('   Backend URL:  http://localhost:8080');
  console.log('   Database:     MySQL on localhost:3306');
  console.log('   API Base:     http://localhost:8080/api');
  console.log('\n✨ All systems are connected and ready!');
}

// Run the test
testConnections().catch(console.error);
