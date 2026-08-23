/**
 * Comprehensive Automated Test Suite for Khushal Finance Backend API with MongoDB
 */
import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import { config } from './src/config/index.js';

const app = createApp();

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('🚀 Starting Automated API Test Suite...\n');

  try {
    // Attempt MongoDB connection
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB for testing\n');
  } catch (err) {
    console.warn('⚠️ Warning: MongoDB not reachable at', config.mongoUri);
    console.warn('👉 Please ensure your MONGODB_URI in backend/.env is set and accessible.\n');
    return;
  }

  // Start test server
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  let adminToken = '';
  let createdEnquiryRef = '';
  let createdEnquiryId = '';

  let passed = 0;
  let failed = 0;

  async function assert(testName, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${testName}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    await assert('GET /api/health returns status UP', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      if (res.status !== 200 || data.status !== 'UP') {
        throw new Error(`Expected 200 and UP, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // 2. Auth: Admin Login
    await assert('POST /api/auth/login succeeds with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'khushalfinance12',
          password: 'Xeroxme123',
        }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.token) {
        throw new Error(`Login failed: ${data.message || JSON.stringify(data)}`);
      }
      adminToken = data.token;
    });

    // 3. Auth: Get Current Profile
    await assert('GET /api/auth/me returns authenticated user', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !data.user) {
        throw new Error(`Expected admin user, got ${JSON.stringify(data)}`);
      }
    });

    // 4. Loan Catalog
    await assert('GET /api/loans returns active loan products', async () => {
      const res = await fetch(`${BASE_URL}/loans`);
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.data) || data.data.length < 1) {
        throw new Error(`Expected array of loan products, got ${JSON.stringify(data)}`);
      }
    });

    // 5. Submit New Loan Enquiry
    await assert('POST /api/enquiries creates new application with reference number', async () => {
      const payload = {
        firstName: 'Karthik',
        lastName: 'Menon',
        dob: '1995-04-12',
        gender: 'male',
        pan: 'ABCDE9876Z',
        mobile: '9876543210',
        email: 'karthik.menon@example.com',
        employmentType: 'Salaried',
        loanType: 'Home Loan',
        loanAmount: 3500000,
        tenure: 15,
        purpose: 'Buying apartment in Ernakulam',
        address: '14/B, Marine Drive, Kochi, Kerala - 682011',
        monthlyIncome: 80000,
        existingEmi: 5000,
        cibilScore: '750+',
        employer: 'Wipro Technologies',
        experience: '3–5 Years',
        consent: true,
      };

      const res = await fetch(`${BASE_URL}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status !== 201 || !data.refNumber) {
        throw new Error(`Enquiry creation failed: ${JSON.stringify(data)}`);
      }

      createdEnquiryRef = data.refNumber;
      createdEnquiryId = data.enquiryId;
    });

    // 6. Public Tracking Endpoint
    await assert('GET /api/enquiries/track/:refNumber returns tracking details', async () => {
      const res = await fetch(`${BASE_URL}/enquiries/track/${createdEnquiryRef}`);
      const data = await res.json();
      if (res.status !== 200 || data.tracking.refNumber !== createdEnquiryRef) {
        throw new Error(`Tracking failed: ${JSON.stringify(data)}`);
      }
    });

    // 7. Enquiries List (Staff/Admin)
    await assert('GET /api/enquiries returns paginated list with filter', async () => {
      const res = await fetch(`${BASE_URL}/enquiries?page=1&limit=10&status=ALL`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.status !== 200 || !Array.isArray(data.data)) {
        throw new Error(`Get enquiries failed: ${JSON.stringify(data)}`);
      }
    });

    // 8. Financial Calculator - EMI
    await assert('POST /api/calculator/emi returns calculated EMI and amortization', async () => {
      const res = await fetch(`${BASE_URL}/calculator/emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal: 2500000,
          rate: 8.5,
          tenureYears: 20,
        }),
      });

      const data = await res.json();
      if (res.status !== 200 || !data.data.emi || data.data.emi <= 0) {
        throw new Error(`EMI calculation failed: ${JSON.stringify(data)}`);
      }
    });

    // 9. Financial Calculator - Eligibility
    await assert('POST /api/calculator/eligibility returns max eligible loan', async () => {
      const res = await fetch(`${BASE_URL}/calculator/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome: 75000,
          existingEmi: 10000,
          tenureYears: 20,
          annualRate: 8.5,
        }),
      });

      const data = await res.json();
      if (res.status !== 200 || !data.data.maxEligibleLoanAmount) {
        throw new Error(`Eligibility calculation failed: ${JSON.stringify(data)}`);
      }
    });

    // 10. Quick Contact Enquiry
    await assert('POST /api/contacts saves quick enquiry', async () => {
      const res = await fetch(`${BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Deepak Verma',
          mobile: '9876512345',
          email: 'deepak.verma@example.com',
          loanType: 'Car Loan',
          loanAmount: 800000,
          tenure: 5,
        }),
      });

      const data = await res.json();
      if (res.status !== 201 || !data.data._id) {
        throw new Error(`Contact creation failed: ${JSON.stringify(data)}`);
      }
    });

    // 11. Dashboard Stats
    await assert('GET /api/dashboard/stats returns KPI numbers', async () => {
      const res = await fetch(`${BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      if (res.status !== 200 || typeof data.data.totalEnquiries !== 'number') {
        throw new Error(`Dashboard stats failed: ${JSON.stringify(data)}`);
      }
    });

    // 12. Delete Single Enquiry
    await assert('DELETE /api/enquiries/:id removes single enquiry', async () => {
      const res = await fetch(`${BASE_URL}/enquiries/${createdEnquiryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();
      if (res.status !== 200 || !data.success) {
        throw new Error(`Delete failed: ${JSON.stringify(data)}`);
      }
    });

  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }

  console.log('\n========================================');
  console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
});
