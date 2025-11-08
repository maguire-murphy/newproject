import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

class AuthTester {
  private api: AxiosInstance;
  private baseURL: string;
  private testResults: TestResult[] = [];
  private testUser: any = null;
  private cookies: string[] = [];

  constructor(baseURL = 'http://localhost:4000/api') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      validateStatus: () => true, // Don't throw on 4xx/5xx responses
    });

    // Set up request interceptor to include cookies
    this.api.interceptors.request.use((config) => {
      if (this.cookies.length > 0) {
        config.headers.Cookie = this.cookies.join('; ');
      }
      return config;
    });

    // Set up response interceptor to capture cookies
    this.api.interceptors.response.use((response) => {
      const setCookie = response.headers['set-cookie'];
      console.log('Response headers:', response.headers);
      console.log('Set-Cookie header:', setCookie);
      if (setCookie) {
        setCookie.forEach((cookie: string) => {
          const cookieName = cookie.split('=')[0];
          // Remove existing cookie with same name and add new one
          this.cookies = this.cookies.filter(c => !c.startsWith(cookieName + '='));
          this.cookies.push(cookie.split(';')[0]);
        });
        console.log('Cookies after processing:', this.cookies);
      }
      return response;
    });
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
    this.testResults.push({ test, status, message, data });
    const statusColor = status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
    console.log(`${statusColor}${status}\x1b[0m ${test}: ${message}`);
    if (data && status === 'FAIL') {
      console.log('  Error details:', JSON.stringify(data, null, 2));
    }
  }

  private generateTestUser() {
    const uniqueId = uuidv4().slice(0, 8);
    const timestamp = Date.now();
    return {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${uniqueId}.${timestamp}@example.com`,
      password: 'password123',
      organizationName: `Test Organization ${uniqueId}`
    };
  }

  async testSignup(): Promise<boolean> {
    try {
      this.testUser = this.generateTestUser();
      
      console.log('\n🔍 Testing User Signup...');
      const response: AxiosResponse = await this.api.post('/auth/signup', this.testUser);

      // Check response status
      if (response.status !== 201) {
        this.addResult('Signup Status Code', 'FAIL', `Expected 201, got ${response.status}`, response.data);
        return false;
      }

      // Check response structure - backend returns wrapped or unwrapped format
      const data = response.data;
      let userData;
      
      if (data.success && data.data) {
        // Wrapped format: { success: true, data: { message, user, organization } }
        userData = data.data;
      } else if (data.message && data.user && data.organization) {
        // Direct format: { message, user, organization }
        userData = data;
      } else {
        this.addResult('Signup Response Format', 'FAIL', 'Response should have user and organization data', data);
        return false;
      }
      if (!userData.user || !userData.organization) {
        this.addResult('Signup User/Org Data', 'FAIL', 'Response should include user and organization', userData);
        return false;
      }

      // Verify user fields
      const user = userData.user;
      const requiredUserFields = ['id', 'email', 'firstName', 'lastName', 'role'];
      for (const field of requiredUserFields) {
        if (!user[field]) {
          this.addResult('Signup User Fields', 'FAIL', `Missing user field: ${field}`, user);
          return false;
        }
      }

      // Verify organization fields
      const org = userData.organization;
      const requiredOrgFields = ['id', 'name', 'subdomain', 'planTier'];
      for (const field of requiredOrgFields) {
        if (!org[field]) {
          this.addResult('Signup Org Fields', 'FAIL', `Missing organization field: ${field}`, org);
          return false;
        }
      }

      // Check cookies are set
      const hasCookies = this.cookies.some(cookie => cookie.startsWith('token=')) || 
                        this.cookies.some(cookie => cookie.startsWith('refreshToken='));
      if (!hasCookies) {
        this.addResult('Signup Cookies', 'FAIL', 'No authentication cookies were set', this.cookies);
        return false;
      }

      this.addResult('Signup', 'PASS', 'User signup successful with correct data structure');
      this.addResult('Signup Cookies', 'PASS', `Authentication cookies set: ${this.cookies.length} cookies`);
      return true;

    } catch (error: any) {
      this.addResult('Signup', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async testLogin(): Promise<boolean> {
    try {
      console.log('\n🔍 Testing User Login...');
      
      // Clear existing cookies to test fresh login
      this.cookies = [];
      
      const loginData = {
        email: this.testUser.email,
        password: this.testUser.password
      };

      const response: AxiosResponse = await this.api.post('/auth/login', loginData);

      // Check response status
      if (response.status !== 200) {
        this.addResult('Login Status Code', 'FAIL', `Expected 200, got ${response.status}`, response.data);
        return false;
      }

      // Check response structure - backend returns wrapped or unwrapped format
      const data = response.data;
      let userData;
      
      if (data.success && data.data) {
        // Wrapped format: { success: true, data: { message, user, organization } }
        userData = data.data;
      } else if (data.message && data.user) {
        // Direct format: { message, user, organization?, token? }
        userData = data;
      } else {
        this.addResult('Login Response Format', 'FAIL', 'Response should have user data', data);
        return false;
      }
      if (!userData.user) {
        this.addResult('Login User Data', 'FAIL', 'Response should include user data', userData);
        return false;
      }

      // Check cookies are set
      const hasTokenCookie = this.cookies.some(cookie => cookie.startsWith('token='));
      const hasRefreshCookie = this.cookies.some(cookie => cookie.startsWith('refreshToken='));
      
      if (!hasTokenCookie || !hasRefreshCookie) {
        this.addResult('Login Cookies', 'FAIL', 'Both token and refreshToken cookies should be set', this.cookies);
        return false;
      }

      this.addResult('Login', 'PASS', 'User login successful with correct data structure');
      this.addResult('Login Cookies', 'PASS', 'Both authentication cookies set correctly');
      return true;

    } catch (error: any) {
      this.addResult('Login', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async testGetCurrentUser(): Promise<boolean> {
    try {
      console.log('\n🔍 Testing Get Current User (/auth/me)...');
      
      const response: AxiosResponse = await this.api.get('/auth/me');

      // Check response status
      if (response.status !== 200) {
        this.addResult('Get Current User Status', 'FAIL', `Expected 200, got ${response.status}`, response.data);
        return false;
      }

      // Check response structure - backend returns wrapped or unwrapped format
      const data = response.data;
      let userData;
      
      if (data.success && data.data) {
        // Wrapped format: { success: true, data: { user, organization } }
        userData = data.data;
      } else if (data.user && data.organization) {
        // Direct format: { user, organization }
        userData = data;
      } else {
        this.addResult('Get Current User Format', 'FAIL', 'Response should have user and organization data', data);
        return false;
      }
      if (!userData.user || !userData.organization) {
        this.addResult('Get Current User Data', 'FAIL', 'Response should include user and organization', userData);
        return false;
      }

      // Verify user matches original signup
      if (userData.user.email !== this.testUser.email) {
        this.addResult('Get Current User Email', 'FAIL', 'Returned user email does not match', userData.user);
        return false;
      }

      this.addResult('Get Current User', 'PASS', 'Current user endpoint returns correct data structure');
      return true;

    } catch (error: any) {
      this.addResult('Get Current User', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async testTokenRefresh(): Promise<boolean> {
    try {
      console.log('\n🔍 Testing Token Refresh...');
      
      const response: AxiosResponse = await this.api.post('/auth/refresh');

      // Check response status
      if (response.status !== 200) {
        this.addResult('Token Refresh Status', 'FAIL', `Expected 200, got ${response.status}`, response.data);
        return false;
      }

      // Check response structure - backend returns wrapped or unwrapped format
      const data = response.data;
      
      if (data.success && data.data) {
        // Wrapped format is acceptable
      } else if (data.message) {
        // Direct format: { message }
      } else {
        this.addResult('Token Refresh Format', 'FAIL', 'Response should have message or success', data);
        return false;
      }

      // Check that new token cookie is set
      const hasTokenCookie = this.cookies.some(cookie => cookie.startsWith('token='));
      if (!hasTokenCookie) {
        this.addResult('Token Refresh Cookie', 'FAIL', 'New token cookie should be set', this.cookies);
        return false;
      }

      this.addResult('Token Refresh', 'PASS', 'Token refresh successful');
      return true;

    } catch (error: any) {
      this.addResult('Token Refresh', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async testLogout(): Promise<boolean> {
    try {
      console.log('\n🔍 Testing User Logout...');
      
      const response: AxiosResponse = await this.api.post('/auth/logout');

      // Check response status
      if (response.status !== 200) {
        this.addResult('Logout Status', 'FAIL', `Expected 200, got ${response.status}`, response.data);
        return false;
      }

      // Check response structure - backend returns wrapped or unwrapped format
      const data = response.data;
      
      if (data.success && data.data) {
        // Wrapped format is acceptable
      } else if (data.message) {
        // Direct format: { message }
      } else {
        this.addResult('Logout Format', 'FAIL', 'Response should have message or success', data);
        return false;
      }

      this.addResult('Logout', 'PASS', 'User logout successful');
      return true;

    } catch (error: any) {
      this.addResult('Logout', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async testAfterLogout(): Promise<boolean> {
    try {
      console.log('\n🔍 Testing Access After Logout...');
      
      const response: AxiosResponse = await this.api.get('/auth/me');

      // Should get 401 after logout
      if (response.status !== 401) {
        this.addResult('After Logout Access', 'FAIL', `Expected 401, got ${response.status}`, response.data);
        return false;
      }

      this.addResult('After Logout Access', 'PASS', 'Properly denied access after logout');
      return true;

    } catch (error: any) {
      this.addResult('After Logout Access', 'FAIL', `Request failed: ${error.message}`, error.response?.data);
      return false;
    }
  }

  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Comprehensive Authentication Tests...');
    console.log(`🔗 Testing against: ${this.baseURL}`);
    
    let allPassed = true;

    // Test signup
    const signupSuccess = await this.testSignup();
    allPassed = allPassed && signupSuccess;

    // Test login (only if signup succeeded)
    if (signupSuccess) {
      const loginSuccess = await this.testLogin();
      allPassed = allPassed && loginSuccess;

      // Test authenticated endpoints (only if login succeeded)
      if (loginSuccess) {
        const currentUserSuccess = await this.testGetCurrentUser();
        allPassed = allPassed && currentUserSuccess;

        const refreshSuccess = await this.testTokenRefresh();
        allPassed = allPassed && refreshSuccess;

        const logoutSuccess = await this.testLogout();
        allPassed = allPassed && logoutSuccess;

        // Test that access is denied after logout
        const afterLogoutSuccess = await this.testAfterLogout();
        allPassed = allPassed && afterLogoutSuccess;
      }
    }

    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

    if (allPassed) {
      console.log('\n🎉 All authentication tests passed! The system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }
}

// Run the tests
async function main() {
  const tester = new AuthTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { AuthTester };