import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const getToolsDuration = new Trend('get_tools_duration');
const createToolDuration = new Trend('create_tool_duration');
const updateToolDuration = new Trend('update_tool_duration');
const createRentDuration = new Trend('create_rent_duration');
const approveRentDuration = new Trend('approve_rent_duration');

// Test configuration
export const options = {
    scenarios: {
        // Smoke test - quick validation
        smoke: {
            executor: 'constant-vus',
            vus: 1,
            duration: '30s',
            startTime: '0s',
            gracefulStop: '5s',
        },
        // Load test - normal load simulation
        load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },  // Ramp up to 10 users
                { duration: '1m', target: 10 },   // Stay at 10 users
                { duration: '30s', target: 20 },  // Ramp up to 20 users
                { duration: '1m', target: 20 },   // Stay at 20 users
                { duration: '30s', target: 0 },   // Ramp down
            ],
            startTime: '35s',
            gracefulStop: '10s',
        },
        // Stress test - high load
        stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '20s', target: 50 },  // Ramp up quickly to 50 users
                { duration: '1m', target: 50 },   // Stay at 50 users
                { duration: '20s', target: 0 },   // Ramp down
            ],
            startTime: '4m',
            gracefulStop: '10s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be under 2s
        errors: ['rate<0.15'],              // Error rate should be under 15%
        login_duration: ['p(95)<1500'],    // Login should be under 1.5s
        register_duration: ['p(95)<2000'], // Registration should be under 2s
        get_tools_duration: ['p(95)<1000'], // Get tools should be under 1s
        create_tool_duration: ['p(95)<1500'], // Create tool should be under 1.5s
        update_tool_duration: ['p(95)<1500'], // Update tool should be under 1.5s
        create_rent_duration: ['p(95)<1500'], // Create rent should be under 1.5s
    },
};

// Configuration - adjust these for your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const API_BASE = `${BASE_URL}/api`;

// Test user credentials - use environment variables for security
// Using OWNER role by default for better test coverage (can create/manage tools)
const TEST_USER = {
    email: __ENV.TEST_EMAIL || 'joana@gmail.com',
    password: __ENV.TEST_PASSWORD || 'password',
};

// Customer user for rent testing
const CUSTOMER_USER = {
    email: __ENV.CUSTOMER_EMAIL || 'tiago@gmail.com',
    password: __ENV.CUSTOMER_PASSWORD || 'password',
};

// Helper function to handle API responses
function checkResponse(response, name, expectedStatus = 200) {
    const success = check(response, {
        [`${name} - status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
        [`${name} - response has body`]: (r) => r.body && r.body.length > 0,
    });
    
    if (!success) {
        errorRate.add(1);
        console.log(`❌ ${name} failed: Status ${response.status}, Body: ${response.body}`);
    } else {
        errorRate.add(0);
    }
    
    return success;
}

// Parse JSON response safely
function parseJSON(response) {
    try {
        return JSON.parse(response.body);
    } catch (e) {
        console.log(`Failed to parse JSON: ${e.message}`);
        return null;
    }
}

// Generate random string for unique data
function randomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Generate random tool data
function generateToolData() {
    const categories = ['Obras', 'Carpintaria', 'Jardinagem', 'Elétricas'];
    const toolNames = ['Berbequim', 'Martelo', 'Serra', 'Chave', 'Aparafusadora', 'Cortador', 'Escada'];
    
    const dailyPrice = (Math.floor(Math.random() * 50) + 10); // 10-60
    const depositAmount = dailyPrice * 5; // Deposit is 5x daily price
    
    return {
        name: `${toolNames[Math.floor(Math.random() * toolNames.length)]} ${randomString(4)}`,
        type: categories[Math.floor(Math.random() * categories.length)],
        dailyPrice: dailyPrice,
        depositAmount: depositAmount,
        description: `Ferramenta profissional de teste - ${randomString(6)}`,
        location: `Localização Teste ${randomString(4)}`,
        imageUrl: `https://picsum.photos/400/300?random=${randomString(6)}`,
        available: true,
        status: 'AVAILABLE'
    };
}

// Main test function
export default function() {
    const vuId = __VU;
    const iterationId = __ITER;
    let authToken = null;
    let userId = null;
    
    // Decide workflow: register new user, use main user, or use customer for renting
    const random = Math.random();
    const shouldRegister = random < 0.15; // 15% register new accounts
    const useCustomer = !shouldRegister && random < 0.4; // 25% use customer account for renting

    if (shouldRegister) {
        group('Account Creation', function() {
            const newUser = {
                email: `testuser_${vuId}_${iterationId}_${randomString(6)}@example.com`,
                password: 'TestPassword123!',
                passwordConfirm: 'TestPassword123!',
                name: `Test User ${vuId}-${iterationId}`,
                role: 'CUSTOMER' // Valid roles: CUSTOMER or ADMIN
            };

            const registerPayload = JSON.stringify(newUser);
            const headers = { 'Content-Type': 'application/json' };

            const startRegister = Date.now();
            const registerResponse = http.post(
                `${API_BASE}/auth/register`,
                registerPayload,
                { headers: headers }
            );
            registerDuration.add(Date.now() - startRegister);

            if (check(registerResponse, {
                'Register - status is 200 or 201': (r) => r.status === 200 || r.status === 201,
            })) {
                console.log(`✅ New account created: ${newUser.email} (${newUser.role})`);
                errorRate.add(0);
                
                // Now login with the new account
                sleep(0.5);
                const loginPayload = JSON.stringify({
                    email: newUser.email,
                    password: newUser.password,
                });

                const loginResponse = http.post(
                    `${API_BASE}/auth/login`,
                    loginPayload,
                    { headers: headers }
                );

                if (checkResponse(loginResponse, 'Login (new user)', 200)) {
                    const loginData = parseJSON(loginResponse);
                    if (loginData && loginData.token) {
                        authToken = loginData.token;
                        userId = loginData.userId || loginData.id;
                        console.log(`✅ New user logged in: ID ${userId}`);
                    }
                }
            } else {
                errorRate.add(1);
                console.log(`❌ Registration failed: Status ${registerResponse.status}, Body: ${registerResponse.body}`);
            }
        });
    } else if (useCustomer) {
        // Use customer account to test renting from owner's tools
        group('Customer Authentication', function() {
            const loginPayload = JSON.stringify({
                email: CUSTOMER_USER.email,
                password: CUSTOMER_USER.password,
            });

            const loginHeaders = {
                'Content-Type': 'application/json',
            };

            const startLogin = Date.now();
            const loginResponse = http.post(
                `${API_BASE}/auth/login`,
                loginPayload,
                { headers: loginHeaders }
            );
            loginDuration.add(Date.now() - startLogin);

            if (checkResponse(loginResponse, 'Customer Login', 200)) {
                const loginData = parseJSON(loginResponse);
                if (loginData && loginData.token) {
                    authToken = loginData.token;
                    userId = loginData.userId || loginData.id;
                    console.log(`✅ Customer login successful for user ID: ${userId}`);
                } else {
                    console.log(`⚠️ Login response missing token: ${loginResponse.body}`);
                }
            }
        });
    } else {
        group('Authentication Flow', function() {
            // Login with existing user
            const loginPayload = JSON.stringify({
                email: TEST_USER.email,
                password: TEST_USER.password,
            });

            const loginHeaders = {
                'Content-Type': 'application/json',
            };

            const startLogin = Date.now();
            const loginResponse = http.post(
                `${API_BASE}/auth/login`,
                loginPayload,
                { headers: loginHeaders }
            );
            loginDuration.add(Date.now() - startLogin);

            if (checkResponse(loginResponse, 'Login', 200)) {
                const loginData = parseJSON(loginResponse);
                if (loginData && loginData.token) {
                    authToken = loginData.token;
                    userId = loginData.userId || loginData.id;
                    console.log(`✅ Login successful for user ID: ${userId}`);
                } else {
                    console.log(`⚠️ Login response missing token: ${loginResponse.body}`);
                }
            }
        });
    }

    // Skip remaining tests if authentication failed
    if (!authToken) {
        console.log('⚠️ Skipping authenticated tests - no token available');
        sleep(1);
        return;
    }

    // Authenticated request headers
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
    };

    // Store created tools and rents for later interactions
    let createdToolId = null;
    let availableToolsForRent = [];

    group('Tool Management', function() {
        // Get all tools (includes owner's tools)
        const startGetTools = Date.now();
        const toolsResponse = http.get(
            `${API_BASE}/tools`,
            { headers: authHeaders }
        );
        getToolsDuration.add(Date.now() - startGetTools);

        if (checkResponse(toolsResponse, 'Get All Tools', 200)) {
            const tools = parseJSON(toolsResponse);
            if (tools && Array.isArray(tools)) {
                console.log(`📦 Retrieved ${tools.length} tools`);
                
                // Filter tools not owned by current user for potential renting
                availableToolsForRent = tools.filter(t => 
                    t.ownerId !== userId && 
                    t.status === 'AVAILABLE'
                );
                
                // Count owner's tools if userId is available
                if (userId) {
                    const ownerTools = tools.filter(t => t.ownerId === userId);
                    console.log(`🔧 User owns ${ownerTools.length} tools`);
                }
            }
        }

        sleep(0.5);

        // Create a new tool (30% chance)
        if (Math.random() < 0.3) {
            const newTool = generateToolData();
            newTool.ownerId = userId;

            const createPayload = JSON.stringify(newTool);
            const startCreate = Date.now();
            const createResponse = http.post(
                `${API_BASE}/tools`,
                createPayload,
                { headers: authHeaders }
            );
            createToolDuration.add(Date.now() - startCreate);

            if (checkResponse(createResponse, 'Create Tool', 201)) {
                const createdTool = parseJSON(createResponse);
                if (createdTool && createdTool.id) {
                    createdToolId = createdTool.id;
                    console.log(`✅ Created tool ID ${createdToolId}: ${createdTool.name}`);
                    
                    // Update the tool we just created (50% chance)
                    if (Math.random() < 0.5) {
                        sleep(0.3);
                        const updatedData = {
                            ...newTool,
                            dailyPrice: newTool.dailyPrice + 5,
                            description: newTool.description + ' (Atualizado)'
                        };

                        const updatePayload = JSON.stringify(updatedData);
                        const startUpdate = Date.now();
                        const updateResponse = http.put(
                            `${API_BASE}/tools/${createdToolId}`,
                            updatePayload,
                            { headers: authHeaders }
                        );
                        updateToolDuration.add(Date.now() - startUpdate);

                        if (checkResponse(updateResponse, 'Update Tool', 200)) {
                            console.log(`✅ Updated tool ID ${createdToolId}`);
                        }
                    }

                    // Change tool status (30% chance)
                    if (Math.random() < 0.3) {
                        sleep(0.3);
                        const newStatus = Math.random() < 0.5 ? 'RENTED' : 'UNDER_MAINTENANCE';
                        const statusPayload = JSON.stringify({ status: newStatus });
                        
                        const statusResponse = http.put(
                            `${API_BASE}/tools/${createdToolId}/status`,
                            statusPayload,
                            { headers: authHeaders }
                        );

                        if (checkResponse(statusResponse, 'Update Tool Status', 200)) {
                            console.log(`✅ Changed tool ${createdToolId} status to ${newStatus}`);
                        }
                    }
                }
            }
        }

        sleep(0.5);

        // Get available tools only
        const availableResponse = http.get(
            `${API_BASE}/tools/available`,
            { headers: authHeaders }
        );

        if (checkResponse(availableResponse, 'Get Available Tools', 200)) {
            const availableTools = parseJSON(availableResponse);
            if (availableTools && Array.isArray(availableTools)) {
                console.log(`✅ ${availableTools.length} tools available for rent`);
            }
        }
    });

    group('Rents Management', function() {
        // Get all rents
        const rentsResponse = http.get(
            `${API_BASE}/rents`,
            { headers: authHeaders }
        );

        let myPendingRents = [];
        let myOwnedToolRents = [];

        if (checkResponse(rentsResponse, 'Get All Rents', 200)) {
            const rents = parseJSON(rentsResponse);
            if (rents && Array.isArray(rents)) {
                console.log(`📋 Retrieved ${rents.length} rents`);
                
                // Find pending rents for this user
                myPendingRents = rents.filter(r => 
                    r.userId === userId && r.status === 'PENDING'
                );
                
                // Find rents on tools owned by this user
                myOwnedToolRents = rents.filter(r => 
                    r.tool && r.tool.ownerId === userId && r.status === 'PENDING'
                );
                
                console.log(`⏳ User has ${myPendingRents.length} pending rents`);
                console.log(`🔔 ${myOwnedToolRents.length} pending rents on owned tools`);
            }
        }

        sleep(0.5);

        // Create a new rent request (40% chance and if tools available)
        if (Math.random() < 0.4 && availableToolsForRent.length > 0) {
            const randomTool = availableToolsForRent[
                Math.floor(Math.random() * availableToolsForRent.length)
            ];
            
            const today = new Date();
            const startDate = new Date(today.getTime() + (1 + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + (1 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000);

            // Format dates as LocalDateTime (ISO-8601 format with time)
            const rentRequest = {
                toolId: randomTool.id,
                userId: userId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const rentPayload = JSON.stringify(rentRequest);
            const startRent = Date.now();
            const rentResponse = http.post(
                `${API_BASE}/rents`,
                rentPayload,
                { headers: authHeaders }
            );
            createRentDuration.add(Date.now() - startRent);

            if (checkResponse(rentResponse, 'Create Rent Request', 201)) {
                const createdRent = parseJSON(rentResponse);
                if (createdRent && createdRent.id) {
                    console.log(`✅ Created rent request ID ${createdRent.id} for tool ${randomTool.name}`);
                }
            }
        }

        sleep(0.5);

        // Approve pending rents on owned tools (if any)
        if (myOwnedToolRents.length > 0 && Math.random() < 0.3) {
            const rentToApprove = myOwnedToolRents[0];
            
            const startApprove = Date.now();
            const approveResponse = http.put(
                `${API_BASE}/rents/${rentToApprove.id}/approve?ownerId=${userId}`,
                null,
                { headers: authHeaders }
            );
            approveRentDuration.add(Date.now() - startApprove);

            if (checkResponse(approveResponse, 'Approve Rent', 200)) {
                console.log(`✅ Approved rent ID ${rentToApprove.id}`);
            }
        }

        // Reject pending rents on owned tools (if any and not approved)
        if (myOwnedToolRents.length > 1 && Math.random() < 0.2) {
            const rentToReject = myOwnedToolRents[1];
            
            const rejectResponse = http.put(
                `${API_BASE}/rents/${rentToReject.id}/reject?ownerId=${userId}&message=Sorry, not available`,
                null,
                { headers: authHeaders }
            );

            if (checkResponse(rejectResponse, 'Reject Rent', 200)) {
                console.log(`✅ Rejected rent ID ${rentToReject.id}`);
            }
        }
    });

    group('User Profile & Analytics', function() {
        // Get current user info
        const meResponse = http.get(
            `${API_BASE}/auth/me`,
            { headers: authHeaders }
        );

        if (checkResponse(meResponse, 'Get User Profile', 200)) {
            const userData = parseJSON(meResponse);
            if (userData) {
                console.log(`👤 User: ${userData.name || userData.email} (${userData.role})`);
            }
        }

        sleep(0.3);

        // Track analytics event (simulate user activity tracking)
        // This is optional and won't affect error rate if it fails
        if (Math.random() < 0.5) {
            const analyticsData = {
                event: 'page_view',
                page: '/tools',
                userId: userId,
                timestamp: new Date().toISOString()
            };

            const analyticsResponse = http.post(
                `${API_BASE}/analytics/track`,
                JSON.stringify(analyticsData),
                { headers: authHeaders }
            );

            // Analytics is informational only - don't count as error
            if (analyticsResponse.status === 200 || analyticsResponse.status === 201 || analyticsResponse.status === 204) {
                console.log(`📊 Analytics event tracked`);
            }
            // Silently ignore analytics failures
        }
    });

    // Think time - simulates real user behavior
    sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

// Setup function - runs once before all tests
export function setup() {
    console.log('🚀 Starting load test...');
    console.log(`📍 Target URL: ${BASE_URL}`);
    console.log(`👤 Test User: ${TEST_USER.email}`);
    
    // Verify the server is reachable
    const healthCheck = http.get(`${BASE_URL}/actuator/health`, { timeout: '5s' });
    if (healthCheck.status !== 200) {
        console.log(`⚠️ Health check failed with status: ${healthCheck.status}`);
        console.log('Note: The /actuator/health endpoint may not be configured. Continuing anyway...');
    } else {
        console.log('✅ Server health check passed');
    }
    
    return {};
}

// Teardown function - runs once after all tests
export function teardown(data) {
    console.log('🏁 Load test completed!');
    console.log('Check the summary above for detailed metrics.');
}

// Custom summary handler
export function handleSummary(data) {
    const summary = {
        timestamp: new Date().toISOString(),
        metrics: {
            http_req_duration_avg: data.metrics.http_req_duration?.values?.avg || 0,
            http_req_duration_p95: data.metrics.http_req_duration?.values['p(95)'] || 0,
            http_reqs_total: data.metrics.http_reqs?.values?.count || 0,
            error_rate: data.metrics.errors?.values?.rate || 0,
            login_duration_avg: data.metrics.login_duration?.values?.avg || 0,
            register_duration_avg: data.metrics.register_duration?.values?.avg || 0,
            get_tools_duration_avg: data.metrics.get_tools_duration?.values?.avg || 0,
            create_tool_duration_avg: data.metrics.create_tool_duration?.values?.avg || 0,
            update_tool_duration_avg: data.metrics.update_tool_duration?.values?.avg || 0,
            create_rent_duration_avg: data.metrics.create_rent_duration?.values?.avg || 0,
            approve_rent_duration_avg: data.metrics.approve_rent_duration?.values?.avg || 0,
        },
    };

    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'load_test_results.json': JSON.stringify(summary, null, 2),
    };
}

// Helper for text summary (k6 built-in)
function textSummary(data, options) {
    // Return a formatted string summary
    let output = '\n========== LOAD TEST SUMMARY ==========\n\n';
    
    output += `Total Requests: ${data.metrics.http_reqs?.values?.count || 0}\n`;
    output += `Average Response Time: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
    output += `95th Percentile: ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
    output += `Error Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
    output += '\n========================================\n';
    
    return output;
}
