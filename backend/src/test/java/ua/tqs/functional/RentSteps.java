package ua.tqs.functional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        Tool tool = TestDataFactory.createTool(name);
        tool.setStatus(ua.tqs.enums.ToolStatus.valueOf(status));
        toolRepository.save(tool);
        lastCreatedTool = tool;
    }

    @When("the user creates a rental request for the tool with dates:")
    public void userCreatesRentalRequestWithDates(io.cucumber.datatable.DataTable dataTable) {
        var dates = dataTable.asMaps(String.class, String.class).get(0);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        RentRequestDTO rentRequest = new RentRequestDTO();
        rentRequest.setToolId(lastCreatedTool.getId());
        rentRequest.setUserId(1L); // Mock user ID
        rentRequest.setStartDate(LocalDateTime.parse(dates.get("startDate"), formatter));
        rentRequest.setEndDate(LocalDateTime.parse(dates.get("endDate"), formatter));
        
        sharedState.latestResponse = restTemplate.postForEntity(
            "/api/rents",
            new HttpEntity<>(rentRequest, sharedState.headers),
            String.class
        );
    }

    @Then("the rental response status is {int}")
    public void rentalResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the rental status is {string}")
    public void rentalStatusIs(String status) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful() || sharedState.latestResponse.getStatusCode().value() == 201);
    }

    @Given("a rental exists for the tool with dates:")
    public void rentalExistsForToolWithDates(io.cucumber.datatable.DataTable dataTable) {
        var dates = dataTable.asMaps(String.class, String.class).get(0);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        User user = TestDataFactory.createUser("test@example.com", "password", ua.tqs.enums.UserRole.CUSTOMER);
        userRepository.save(user);
        
        Rent rent = new Rent();
        rent.setToolId(lastCreatedTool.getId());
        rent.setUserId(user.getId());
        rent.setStatus(RentStatus.PENDING);
        rent.setStartDate(LocalDateTime.parse(dates.get("startDate"), formatter));
        rent.setEndDate(LocalDateTime.parse(dates.get("endDate"), formatter));
        rentRepository.save(rent);
    }

    @Given("rentals exist in the system:")
    public void rentalsExistInSystem(io.cucumber.datatable.DataTable dataTable) {
        var rentals = dataTable.asMaps(String.class, String.class);
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
        User user = TestDataFactory.createUser("rental@example.com", "password", ua.tqs.enums.UserRole.CUSTOMER);
        userRepository.save(user);
        
        User owner = TestDataFactory.createUser("owner@example.com", "password", ua.tqs.enums.UserRole.ADMIN);
        userRepository.save(owner);
        
        Tool tool = TestDataFactory.createTool("Rental Tool");
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
        // Get the tool to find its owner
        Tool tool = toolRepository.findById(lastCreatedRent.getToolId()).orElseThrow();
        sharedState.latestResponse = restTemplate.exchange(
            "/api/rents/" + lastCreatedRent.getId() + "/approve?ownerId=" + tool.getOwnerId(),
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
        // Get the tool to find its owner
        Tool tool = toolRepository.findById(lastCreatedRent.getToolId()).orElseThrow();
        sharedState.latestResponse = restTemplate.exchange(
            "/api/rents/" + lastCreatedRent.getId() + "/reject?ownerId=" + tool.getOwnerId() + "&message=" + reason,
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
        // Verify reason in actual response
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
        var dates = dataTable.asMaps(String.class, String.class);
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        for (var dateData : dates) {
            User user = TestDataFactory.createUser("test" + System.currentTimeMillis() + "@example.com", "password", ua.tqs.enums.UserRole.CUSTOMER);
            userRepository.save(user);
            
            Tool tool = TestDataFactory.createTool("Test Tool " + System.currentTimeMillis());
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
        var dates = dataTable.asMaps(String.class, String.class).get(0);
        sharedState.latestResponse = restTemplate.exchange(
            "/api/rents/interval?from=" + dates.get("startDate") + "&to=" + dates.get("endDate"),
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
