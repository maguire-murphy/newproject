import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const testAuthFlow = async () => {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get('http://localhost:4000/health');
    console.log('✅ Health check:', health.data);

    // Test 2: Login
    console.log('\n2️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@example.com',
      password: 'demo123456'
    }, {
      withCredentials: true
    });
    console.log('✅ Login successful:', {
      user: loginResponse.data.user.email,
      organization: loginResponse.data.organization.name
    });

    // Store cookies and token from response
    const cookies = loginResponse.headers['set-cookie'];
    const token = loginResponse.data.token; // Token from response body
    
    console.log('📄 Received cookies:', cookies ? 'Yes' : 'No');
    console.log('🔑 Received token in response:', token ? 'Yes' : 'No');

    // Test 3: Get Projects (try both cookie and Bearer auth)
    console.log('\n3️⃣ Testing authenticated request (get projects)...');
    
    let projectsResponse;
    if (token) {
      // Try Bearer auth first
      console.log('   Using Bearer token authentication...');
      projectsResponse = await axios.get(`${API_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      // Fallback to cookie auth
      console.log('   Using cookie authentication...');
      projectsResponse = await axios.get(`${API_URL}/projects`, {
        headers: {
          Cookie: cookies?.join('; ') || ''
        }
      });
    }
    console.log('✅ Projects retrieved:', projectsResponse.data.length, 'projects');

    // Test 4: Get Experiments
    console.log('\n4️⃣ Testing get experiments...');
    const experimentsResponse = await axios.get(`${API_URL}/experiments`, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {
        Cookie: cookies?.join('; ') || ''
      }
    });
    console.log('✅ Experiments retrieved:', experimentsResponse.data.length, 'experiments');
    
    experimentsResponse.data.forEach((exp: any) => {
      console.log(`   - ${exp.name} (${exp.status})`);
    });

    console.log('\n========================================');
    console.log('✅ All authentication tests passed!');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
};

// Run tests
console.log('========================================');
console.log('🚀 BehaviorOpt Authentication Test Suite');
console.log('========================================\n');

console.log('⚠️  Make sure the API server is running on port 4000\n');

setTimeout(testAuthFlow, 2000);