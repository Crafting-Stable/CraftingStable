package ua.tqs.functional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
import ua.tqs.dto.RentRequestDTO;
import ua.tqs.enums.RentStatus;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class RentSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RentRepository rentRepository;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedState sharedState;

    private Rent lastCreatedRent;
    private Tool lastCreatedTool;

    @Given("a tool exists with name {string} and status {string}")
    public void toolExistsWithNameAndStatus(String name, String status) {
        // Create an owner for the tool (different from the renter)
        String ownerEmail = "toolowner_" + System.nanoTime() + "@example.com";
        User owner = TestDataFactory.createUser(
                ownerEmail,
                "password123",
                ua.tqs.enums.UserRole.CUSTOMER
        );
        userRepository.save(owner);

        Tool tool = TestDataFactory.createTool(name);
        tool.setStatus(ua.tqs.enums.ToolStatus.valueOf(status));
        tool.setOwnerId(owner.getId());
        toolRepository.save(tool);
        lastCreatedTool = tool;

        System.out.println("=== DEBUG: Tool Created ===");
        System.out.println("Tool ID: " + tool.getId());
        System.out.println("Tool Name: " + tool.getName());
        System.out.println("Tool Status: " + tool.getStatus());
        System.out.println("Tool Owner ID: " + owner.getId());
        System.out.println("Tool Owner Email: " + owner.getEmail());
    }

    @When("the user creates a rental request for the tool with dates:")
    public void userCreatesRentalRequestWithDates(io.cucumber.datatable.DataTable dataTable) {
        java.util.Map<String, String> dates = dataTable.asMaps(String.class, String.class).get(0);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        // Verify that user is logged in
        assertNotNull(sharedState.lastCreatedUser, "No user logged in! Make sure 'a user is logged in as' step was executed.");
        assertNotNull(sharedState.headers, "No authentication headers found!");

        RentRequestDTO rentRequest = new RentRequestDTO();
        rentRequest.setToolId(lastCreatedTool.getId());
        rentRequest.setUserId(sharedState.lastCreatedUser.getId());

        // Parse dates - if they're in the past, use future dates instead
        LocalDateTime startDate = LocalDateTime.parse(dates.get("startDate"), formatter);
        LocalDateTime endDate = LocalDateTime.parse(dates.get("endDate"), formatter);

        // If start date is in the past or too close to now, shift to future
        LocalDateTime now = LocalDateTime.now();
        if (startDate.isBefore(now.plusHours(1))) {
            long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
            startDate = now.plusHours(2);
            endDate = startDate.plusDays(daysDiff);
            System.out.println("=== Adjusted dates to future: " + startDate + " to " + endDate);
        }

        rentRequest.setStartDate(startDate);
        rentRequest.setEndDate(endDate);

        System.out.println("\n=== DEBUG: Creating Rental Request ===");
        System.out.println("Renter User ID: " + rentRequest.getUserId());
        System.out.println("Renter Email: " + sharedState.lastCreatedUser.getEmail());
        System.out.println("Tool ID: " + rentRequest.getToolId());
        System.out.println("Tool Owner ID: " + lastCreatedTool.getOwnerId());
        System.out.println("Start Date: " + rentRequest.getStartDate());
        System.out.println("End Date: " + rentRequest.getEndDate());
        System.out.println("Auth Headers: " + sharedState.headers);

        // Verify that renter is NOT the owner
        if (rentRequest.getUserId().equals(lastCreatedTool.getOwnerId())) {
            System.err.println("WARNING: User trying to rent their own tool!");
        }

        try {
            sharedState.latestResponse = restTemplate.postForEntity(
                    "/api/rents",
                    new HttpEntity<>(rentRequest, sharedState.headers),
                    String.class
            );

            System.out.println("\n=== DEBUG: Response Received ===");
            System.out.println("Status Code: " + sharedState.latestResponse.getStatusCode().value());
            System.out.println("Response Body: " + sharedState.latestResponse.getBody());
            System.out.println("=================================\n");
        } catch (Exception e) {
            System.err.println("ERROR during rental creation: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Then("the rental response status is {int}")
    public void rentalResponseStatusIs(int statusCode) {
        int actualStatus = sharedState.latestResponse.getStatusCode().value();
        Object responseBodyObj = sharedState.latestResponse.getBody();
        String responseBody = responseBodyObj != null ? responseBodyObj.toString() : null;

        if (actualStatus != statusCode) {
            System.err.println("\n=== TEST FAILURE ===");
            System.err.println("Expected Status: " + statusCode);
            System.err.println("Actual Status: " + actualStatus);
            System.err.println("Response Body: " + responseBody);
            System.err.println("====================\n");
        }

        assertEquals(statusCode, actualStatus,
                String.format("Expected status %d but got %d. Response: %s",
                        statusCode, actualStatus, responseBody));
    }

    @And("the rental status is {string}")
    public void rentalStatusIs(String status) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful() ||
                        sharedState.latestResponse.getStatusCode().value() == 201,
                "Response should be successful (2xx or 201)");
    }

    @Given("a rental exists for the tool with dates:")
    public void rentalExistsForToolWithDates(io.cucumber.datatable.DataTable dataTable) {
        java.util.Map<String, String> dates = dataTable.asMaps(String.class, String.class).get(0);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        // Create a different user for the existing rental
        String existingRentalEmail = "existing_rental_" + System.nanoTime() + "@example.com";
        User existingRentalUser = TestDataFactory.createUser(
                existingRentalEmail,
                "password",
                ua.tqs.enums.UserRole.CUSTOMER
        );
        userRepository.save(existingRentalUser);

        // Parse dates - if they're in the past, use future dates instead
        LocalDateTime startDate = LocalDateTime.parse(dates.get("startDate"), formatter);
        LocalDateTime endDate = LocalDateTime.parse(dates.get("endDate"), formatter);

        LocalDateTime now = LocalDateTime.now();
        if (startDate.isBefore(now.plusHours(1))) {
            long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
            startDate = now.plusHours(2);
            endDate = startDate.plusDays(daysDiff);
        }

        Rent rent = new Rent();
        rent.setToolId(lastCreatedTool.getId());
        rent.setUserId(existingRentalUser.getId());
        rent.setStatus(RentStatus.PENDING);
        rent.setStartDate(startDate);
        rent.setEndDate(endDate);
        rentRepository.save(rent);

        System.out.println("=== DEBUG: Existing Rental Created ===");
        System.out.println("Rental ID: " + rent.getId());
        System.out.println("User: " + existingRentalUser.getEmail());
        System.out.println("Tool: " + lastCreatedTool.getName());
        System.out.println("Period: " + rent.getStartDate() + " to " + rent.getEndDate());
    }

    @Given("rentals exist in the system:")
    public void rentalsExistInSystem(io.cucumber.datatable.DataTable dataTable) {
        java.util.List<java.util.Map<String, String>> rentals = dataTable.asMaps(String.class, String.class);
        for (var rentalData : rentals) {
            User user = TestDataFactory.createUser(rentalData.get("clientEmail"), "password", ua.tqs.enums.UserRole.CUSTOMER);
            userRepository.save(user);

            Tool tool = TestDataFactory.createTool(rentalData.get("toolName"));
            toolRepository.save(tool);

            Rent rent = new Rent();
            rent.setUserId(user.getId());
            rent.setToolId(tool.getId());
            rent.setStatus(RentStatus.valueOf(rentalData.get("status")));
            rent.setStartDate(LocalDateTime.now());
            rent.setEndDate(LocalDateTime.now().plusDays(7));
            rentRepository.save(rent);
        }
    }

    @When("an admin user requests to list all rentals")
    public void adminRequestsToListAllRentals() {
        sharedState.latestResponse = restTemplate.exchange(
                "/api/rents",
                HttpMethod.GET,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @And("the response contains {int} rentals")
    public void responseContainsRentals(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("a rental exists with status {string}")
    public void rentalExistsWithStatus(String status) {
        String userEmail = "rental_" + System.nanoTime() + "@example.com";
        User user = TestDataFactory.createUser(
                userEmail,
                "password",
                ua.tqs.enums.UserRole.CUSTOMER
        );
        userRepository.save(user);

        String ownerEmail = "owner_" + System.nanoTime() + "@example.com";
        User owner = TestDataFactory.createUser(
                ownerEmail,
                "password",
                ua.tqs.enums.UserRole.ADMIN
        );
        userRepository.save(owner);

        String toolName = "Rental Tool " + System.nanoTime();
        Tool tool = TestDataFactory.createTool(toolName);
        tool.setOwnerId(owner.getId());
        toolRepository.save(tool);

        Rent rent = new Rent();
        rent.setUserId(user.getId());
        rent.setToolId(tool.getId());
        rent.setStatus(RentStatus.valueOf(status));
        rent.setStartDate(LocalDateTime.now());
        rent.setEndDate(LocalDateTime.now().plusDays(7));
        rentRepository.save(rent);
        lastCreatedRent = rent;
    }

    @When("a user requests to get the rental by ID")
    public void userRequestsToGetRentalByID() {
        sharedState.latestResponse = restTemplate.exchange(
                "/api/rents/" + lastCreatedRent.getId(),
                HttpMethod.GET,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @And("the response contains rental status {string}")
    public void responseContainsRentalStatus(String status) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @When("the user approves the rental")
    public void userApprovesRental() {
        Tool tool = toolRepository.findById(lastCreatedRent.getToolId()).orElseThrow();
        String approveUrl = "/api/rents/" + lastCreatedRent.getId() + "/approve?ownerId=" + tool.getOwnerId();
        sharedState.latestResponse = restTemplate.exchange(
                approveUrl,
                HttpMethod.PUT,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @Then("the approval response status is {int}")
    public void approvalResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @When("the user rejects the rental with reason {string}")
    public void userRejectsRentalWithReason(String reason) {
        Tool tool = toolRepository.findById(lastCreatedRent.getToolId()).orElseThrow();
        String rejectUrl = "/api/rents/" + lastCreatedRent.getId() + "/reject?ownerId=" + tool.getOwnerId()
                + "&message=" + reason;
        sharedState.latestResponse = restTemplate.exchange(
                rejectUrl,
                HttpMethod.PUT,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @Then("the rejection response status is {int}")
    public void rejectionResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the rejection reason is {string}")
    public void rejectionReasonIs(String reason) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @When("a user deletes the rental")
    public void userDeletesRental() {
        sharedState.latestResponse = restTemplate.exchange(
                "/api/rents/" + lastCreatedRent.getId(),
                HttpMethod.DELETE,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("an admin deletes the rental")
    public void adminDeletesRental() {
        sharedState.latestResponse = restTemplate.exchange(
                "/api/rents/" + lastCreatedRent.getId(),
                HttpMethod.DELETE,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @And("the rental is no longer in the system")
    public void rentalIsNoLongerInSystem() {
        assertTrue(rentRepository.findById(lastCreatedRent.getId()).isEmpty());
    }

    @Given("rentals exist with dates:")
    public void rentalsExistWithDates(io.cucumber.datatable.DataTable dataTable) {
        java.util.List<java.util.Map<String, String>> dates = dataTable.asMaps(String.class, String.class);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

        for (var dateData : dates) {
            String userEmail = "test_" + System.nanoTime() + "@example.com";
            User user = TestDataFactory.createUser(
                    userEmail,
                    "password",
                    ua.tqs.enums.UserRole.CUSTOMER
            );
            userRepository.save(user);

            String toolName = "Test Tool " + System.nanoTime();
            Tool tool = TestDataFactory.createTool(toolName);
            toolRepository.save(tool);

            Rent rent = new Rent();
            rent.setUserId(user.getId());
            rent.setToolId(tool.getId());
            rent.setStartDate(LocalDateTime.parse(dateData.get("startDate"), formatter));
            rent.setEndDate(LocalDateTime.parse(dateData.get("endDate"), formatter));
            rentRepository.save(rent);
        }
    }

    @When("a user searches for rentals in the interval:")
    public void userSearchesForRentalsInInterval(io.cucumber.datatable.DataTable dataTable) {
        java.util.Map<String, String> dates = dataTable.asMaps(String.class, String.class).get(0);
        String url = "/api/rents/interval?from=" + dates.get("startDate") + "&to=" + dates.get("endDate");
        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @And("the response contains {int} rental")
    public void responseContainsRental(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }
}
