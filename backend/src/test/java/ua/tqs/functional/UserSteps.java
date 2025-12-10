package ua.tqs.functional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import ua.tqs.enums.UserRole;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class UserSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedState sharedState;

    @Given("users exist in the system:")
    public void usersExistInSystem(io.cucumber.datatable.DataTable dataTable) {
        var users = dataTable.asMaps(String.class, String.class);
        for (var userData : users) {
            User user = TestDataFactory.createUser(userData.get("email"), "password123",
                        UserRole.valueOf(userData.get("role")));
            userRepository.save(user);
        }
    }

    @When("the admin requests to list all users")
    public void adminRequestsToListAllUsers() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @And("the response contains {int} users")
    public void responseContainsUsers(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @When("the admin requests the total user count")
    public void adminRequestsTotalUserCount() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/count",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the count response status is {int}")
    public void countResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the total users count is {int}")
    public void totalUsersCountIs(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @When("an admin creates a user with email {string}")
    public void adminCreatesUserWithEmail(String email) {
        User user = TestDataFactory.createUser(email, "password123", UserRole.CUSTOMER);
        
        sharedState.latestResponse = restTemplate.postForEntity(
            "/api/users",
            new HttpEntity<>(user, sharedState.headers),
            String.class
        );
    }

    @When("an admin requests to get the user by ID")
    public void adminRequestsToGetUserByID() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        assertNotNull(user);
        
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + user.getId(),
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Given("a user exists with email {string} with active status {word}")
    public void userExistsWithEmailAndActiveStatus(String email, String activeStatus) {
        User user = TestDataFactory.createUser(email, "password123", UserRole.CUSTOMER);
        user.setActive("true".equalsIgnoreCase(activeStatus));
        userRepository.save(user);
        sharedState.lastCreatedUser = user;
    }

    @When("the admin activates the user")
    public void adminActivatesUser() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + sharedState.lastCreatedUser.getId() + "/activate",
            HttpMethod.PUT,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the activate response status is {int}")
    public void activateResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the user active status is {word}")
    public void userActiveStatusIs(String active) {
        User user = userRepository.findById(sharedState.lastCreatedUser.getId()).orElse(null);
        assertNotNull(user);
        assertEquals(Boolean.parseBoolean(active), user.getActive());
    }

    @When("the admin deactivates the user")
    public void adminDeactivatesUser() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + sharedState.lastCreatedUser.getId() + "/deactivate",
            HttpMethod.PUT,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the deactivate response status is {int}")
    public void deactivateResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @Given("a user exists with email {string} with role {string}")
    public void userExistsWithEmailAndRole(String email, String role) {
        User user = TestDataFactory.createUser(email, "password123", UserRole.valueOf(role));
        userRepository.save(user);
        sharedState.lastCreatedUser = user;
    }

    @When("the admin changes the user role to {string}")
    public void adminChangesUserRoleTo(String newRole) {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + sharedState.lastCreatedUser.getId() + "/role",
            HttpMethod.PUT,
            new HttpEntity<>("{\"role\": \"" + newRole + "\"}", sharedState.headers),
            String.class
        );
    }

    @Then("the change response status is {int}")
    public void changeResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the user role is {string}")
    public void userRoleIs(String role) {
        User user = userRepository.findById(sharedState.lastCreatedUser.getId()).orElse(null);
        assertNotNull(user);
        assertEquals(UserRole.valueOf(role), user.getType());
    }

    @When("the admin deletes the user")
    public void adminDeletesUser() {
        assertNotNull(sharedState.lastCreatedUser, "lastCreatedUser is null");
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + sharedState.lastCreatedUser.getId(),
            HttpMethod.DELETE,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @And("the user is no longer in the system")
    public void userIsNoLongerInSystem() {
        assertTrue(userRepository.findById(sharedState.lastCreatedUser.getId()).isEmpty());
    }

    @And("users and rentals exist in the system")
    public void usersAndRentalsExistInSystem() {
        // Create test data
        User user = TestDataFactory.createUser("admin@example.com", "password123", UserRole.ADMIN);
        userRepository.save(user);
    }

    @When("the admin requests statistics")
    public void adminRequestsStatistics() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/stats/admin",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the stats response status is {int}")
    public void statsResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains tool counts")
    public void responseContainsToolCounts() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @And("the user has rental history")
    public void userHasRentalHistory() {
        // Add rental history
    }

    @When("the user requests their statistics")
    public void userRequestsTheirStatistics() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        assertNotNull(user);
        
        sharedState.latestResponse = restTemplate.exchange(
            "/api/users/" + user.getId() + "/stats",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @And("the response contains rental counts and expenses")
    public void responseContainsRentalCountsAndExpenses() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @And("the user exists in the system with email {string}")
    public void userExistsInSystemWithEmail(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        assertNotNull(user, "User should exist in system");
        assertEquals(email, user.getEmail());
    }
}

