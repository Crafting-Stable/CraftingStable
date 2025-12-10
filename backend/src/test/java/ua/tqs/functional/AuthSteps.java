package ua.tqs.functional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import ua.tqs.dto.AuthRequestDTO;
import ua.tqs.dto.AuthResponseDTO;
import ua.tqs.enums.UserRole;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

public class AuthSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedState sharedState;

    @LocalServerPort
    private int port;

    private String baseUrl;

    @Before
    public void setup() {
        baseUrl = "http://localhost:" + port;
        userRepository.deleteAll();
        TestDataFactory.resetCounters();
        sharedState.headers = new HttpHeaders();
        sharedState.headers.add("Content-Type", "application/json");
    }

    @Given("the application is running")
    public void applicationIsRunning() {
        assertNotNull(restTemplate, "TestRestTemplate should be initialized");
        assertNotNull(userRepository, "UserRepository should be initialized");
    }

    @And("the database is clean")
    public void databaseIsClean() {
        userRepository.deleteAll();
    }

    @Given("a user exists with email {string} and password {string}")
    public void userExists(String email, String password) {
        User user = TestDataFactory.createUser(email, password, UserRole.CUSTOMER);
        userRepository.save(user);
        sharedState.lastCreatedUser = user;
    }

    @When("the user logs in with email {string} and password {string}")
    public void userLogsIn(String email, String password) {
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail(email);
        request.setPassword(password);
        
        sharedState.latestResponse = restTemplate.exchange(
            baseUrl + "/api/auth/login",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(request, sharedState.headers),
            String.class
        );
    }

    @Then("the login should be successful")
    public void loginSuccessful() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful(), 
            "Login response should be 2xx, got: " + sharedState.latestResponse.getStatusCode());
        assertNotNull(sharedState.latestResponse.getBody());
    }

    @Then("the login response status is {int}")
    public void loginResponseStatusIs(int expectedStatus) {
        assertEquals(expectedStatus, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains a valid JWT token")
    public void responseContainsToken() throws JsonProcessingException {
        String responseBody = (String) sharedState.latestResponse.getBody();
        assertNotNull(responseBody, "Response body should not be null");

        ObjectMapper objectMapper = new ObjectMapper();
        AuthResponseDTO authResponse = objectMapper.readValue(responseBody, AuthResponseDTO.class);
        
        assertNotNull(authResponse.getToken(), "JWT token should not be null");
        assertTrue(authResponse.getToken().length() > 0, "JWT token should not be empty");
        sharedState.headers.set("Authorization", "Bearer " + authResponse.getToken());
    }

    @When("the user registers with email {string} password {string} and role {string}")
    public void userRegisters(String email, String password, String role) {
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail(email);
        request.setPassword(password);
        request.setPasswordConfirm(password);
        request.setName("New User");
        request.setRole(role);

        sharedState.latestResponse = restTemplate.exchange(
            baseUrl + "/api/auth/register",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(request, sharedState.headers),
            String.class
        );
    }

    @Then("the registration response status is {int}")
    public void registrationResponseStatusIs(int expectedStatus) {
        assertEquals(expectedStatus, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the user is created in the system with email {string}")
    public void userIsCreatedInSystem(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        assertNotNull(user, "User should be created in system");
        assertEquals(email, user.getEmail());
    }

    @When("an unauthenticated request is made to GET {string}")
    public void unauthenticatedRequestToEndpoint(String endpoint) {
        sharedState.latestResponse = restTemplate.getForEntity(baseUrl + endpoint, Object.class);
    }

    @Then("the response status is {int}")
    public void responseStatusIs(int expectedStatus) {
        assertEquals(expectedStatus, sharedState.latestResponse.getStatusCode().value());
    }

    @Given("the user is logged in with email {string}")
    public void userIsLoggedInWithEmail(String email) throws JsonProcessingException {
        User user = userRepository.findByEmail(email).orElse(null);
        assertNotNull(user, "User should exist for login");
        
        AuthRequestDTO request = new AuthRequestDTO();
        request.setEmail(email);
        // Use password123 to match what was set in userExists step
        request.setPassword("password123");
        
        ResponseEntity<String> response = restTemplate.postForEntity(
            baseUrl + "/api/auth/login",
            new HttpEntity<>(request, new HttpHeaders()),
            String.class
        );
        
        String responseBody = response.getBody();
        if (responseBody != null && response.getStatusCode().is2xxSuccessful()) {
            ObjectMapper objectMapper = new ObjectMapper();
            AuthResponseDTO authResponse = objectMapper.readValue(responseBody, AuthResponseDTO.class);
            if (authResponse.getToken() != null) {
                sharedState.headers.set("Authorization", "Bearer " + authResponse.getToken());
            }
        }
    }

    @When("the user requests their own details")
    public void userRequestsOwnDetails() {
        sharedState.latestResponse = restTemplate.exchange(
            baseUrl + "/api/auth/me", 
            org.springframework.http.HttpMethod.GET, 
            new HttpEntity<>(sharedState.headers), 
            String.class
        );
    }

    @And("the response contains the user email {string}")
    public void responseContainsUserEmail(String email) {
        assertNotNull(sharedState.latestResponse.getBody(), "Response body should not be null");
    }

    @Given("a user is logged in as {string}")
    public void userIsLoggedInAsRole(String role) throws JsonProcessingException {
        String email = "user+" + System.nanoTime() + "@example.com";
        String password = "password123";
        
        User user = TestDataFactory.createUser(email, password, ua.tqs.enums.UserRole.valueOf(role));
        userRepository.save(user);
        sharedState.lastCreatedUser = user;
        
        // Perform actual login to get JWT token
        AuthRequestDTO loginRequest = new AuthRequestDTO();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        
        ResponseEntity<String> loginResponse = restTemplate.exchange(
            baseUrl + "/api/auth/login",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(loginRequest, new HttpHeaders()),
            String.class
        );
        
        if (loginResponse.getStatusCode().is2xxSuccessful() && loginResponse.getBody() != null) {
            ObjectMapper objectMapper = new ObjectMapper();
            AuthResponseDTO authResponse = objectMapper.readValue(loginResponse.getBody(), AuthResponseDTO.class);
            sharedState.headers.set("Authorization", "Bearer " + authResponse.getToken());
        }
    }
    
    @Given("a user is logged in as {string} with email {string}")
    public void userIsLoggedInAsRoleWithEmail(String role, String email) throws Exception {
        String password = "password123";
        String normalizedRole = role.equals("CLIENT") ? "CUSTOMER" : role;
        
        User user = TestDataFactory.createUser(email, password, ua.tqs.enums.UserRole.valueOf(normalizedRole));
        userRepository.save(user);
        sharedState.lastCreatedUser = user;
        
        // Perform actual login to get JWT token
        AuthRequestDTO loginRequest = new AuthRequestDTO();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        
        ResponseEntity<String> loginResponse = restTemplate.exchange(
            baseUrl + "/api/auth/login",
            org.springframework.http.HttpMethod.POST,
            new HttpEntity<>(loginRequest, new HttpHeaders()),
            String.class
        );
        
        if (loginResponse.getStatusCode().is2xxSuccessful() && loginResponse.getBody() != null) {
            ObjectMapper objectMapper = new ObjectMapper();
            AuthResponseDTO authResponse = objectMapper.readValue(loginResponse.getBody(), AuthResponseDTO.class);
            sharedState.headers.set("Authorization", "Bearer " + authResponse.getToken());
        }
    }
}

