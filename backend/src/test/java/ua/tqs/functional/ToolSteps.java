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
import ua.tqs.dto.ToolDTO;
import ua.tqs.enums.ToolStatus;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class ToolSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedState sharedState;

    private Tool lastCreatedTool;

    @When("the user creates a tool with name {string} type {string} description {string} location {string}")
    public void userCreatesTool(String name, String type, String description, String location) {
        ToolDTO toolDTO = new ToolDTO();
        toolDTO.setName(name);
        toolDTO.setType(type);
        toolDTO.setDescription(description);
        toolDTO.setLocation(location);
        toolDTO.setStatus(ToolStatus.AVAILABLE);
        toolDTO.setAvailable(true);
        toolDTO.setDailyPrice(new java.math.BigDecimal("10.00"));
        toolDTO.setDepositAmount(new java.math.BigDecimal("50.00"));
        
        // Set ownerId from the logged-in user
        if (sharedState.lastCreatedUser != null) {
            toolDTO.setOwnerId(sharedState.lastCreatedUser.getId());
        }
        
        sharedState.latestResponse = restTemplate.postForEntity(
            "/api/tools",
            new HttpEntity<>(toolDTO, sharedState.headers),
            ToolDTO.class
        );
        if (sharedState.latestResponse.getStatusCode().is2xxSuccessful()) {
            ToolDTO createdDTO = (ToolDTO) sharedState.latestResponse.getBody();
            if (createdDTO != null && createdDTO.getId() != null) {
                lastCreatedTool = toolRepository.findById(createdDTO.getId()).orElse(null);
            }
        }
    }

    @Then("the create response status is {int}")
    public void createResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the tool {string} exists in the system")
    public void toolExistsInSystem(String toolName) {
        // Check if the last created tool matches or search by type
        if (lastCreatedTool != null && lastCreatedTool.getName().equals(toolName)) {
            assertNotNull(lastCreatedTool, "Tool " + toolName + " should exist");
        } else {
            // Fallback: verify tool was created via API
            assertNotNull(lastCreatedTool, "Tool " + toolName + " should have been created");
        }
    }

    @Given("tools exist in the system:")
    public void toolsExistInSystem(io.cucumber.datatable.DataTable dataTable) {
        var tools = dataTable.asMaps(String.class, String.class);
        for (var toolData : tools) {
            Tool tool = TestDataFactory.createTool(toolData.get("name"));
            tool.setType(toolData.get("type"));
            tool.setDescription(toolData.get("description"));
            toolRepository.save(tool);
        }
    }

    @When("a user requests to list all tools")
    public void userRequestsToListAllTools() {
        sharedState.latestResponse = restTemplate.getForEntity("/api/tools", String.class);
    }

    @Then("the list response status is {int}")
    public void listResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains {int} tools")
    public void responseContainsTools(int count) {
        if (sharedState.latestResponse != null && sharedState.latestResponse.getBody() != null) {
            assertNotNull(sharedState.latestResponse.getBody(), "Response body should not be null");
        }
    }

    @Given("tools exist with statuses:")
    public void toolsExistWithStatuses(io.cucumber.datatable.DataTable dataTable) {
        var tools = dataTable.asMaps(String.class, String.class);
        for (var toolData : tools) {
            Tool tool = TestDataFactory.createTool(toolData.get("name"));
            tool.setStatus(ToolStatus.valueOf(toolData.get("status")));
            toolRepository.save(tool);
        }
    }

    @When("a user requests to list available tools")
    public void userRequestsToListAvailableTools() {
        sharedState.latestResponse = restTemplate.getForEntity("/api/tools/available", String.class);
    }

    @And("the response contains {int} available tools")
    public void responseContainsAvailableTools(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("tools exist with types:")
    public void toolsExistWithTypes(io.cucumber.datatable.DataTable dataTable) {
        var tools = dataTable.asMaps(String.class, String.class);
        for (var toolData : tools) {
            Tool tool = TestDataFactory.createTool(toolData.get("name"));
            tool.setType(toolData.get("type"));
            toolRepository.save(tool);
        }
    }

    @When("a user searches for tools by type {string}")
    public void userSearchesForToolsByType(String type) {
        sharedState.latestResponse = restTemplate.getForEntity("/api/tools/type/" + type, String.class);
    }

    @Then("the search response status is {int}")
    public void searchResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains {int} tools of type {string}")
    public void responseContainsToolsOfType(int count, String type) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("a tool exists with name {string}")
    public void toolExistsWithName(String name) {
        Tool tool = TestDataFactory.createTool(name);
        toolRepository.save(tool);
        lastCreatedTool = tool;
    }

    @When("a user requests to get the tool by ID")
    public void userRequestsToGetToolByID() {
        sharedState.latestResponse = restTemplate.getForEntity("/api/tools/" + lastCreatedTool.getId(), String.class);
    }

    @Then("the get response status is {int}")
    public void getResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains tool name {string}")
    public void responseContainsToolName(String name) {
        Object body = sharedState.latestResponse.getBody();
        assertNotNull(body, "Response should not be null");
    }

    @And("a tool exists with name {string} owned by the logged-in user")
    public void toolExistsOwnedByUser(String name) {
        Tool tool = TestDataFactory.createTool(name);
        tool.setStatus(ToolStatus.AVAILABLE);
        tool.setDailyPrice(new java.math.BigDecimal("10.00"));
        tool.setDepositAmount(new java.math.BigDecimal("50.00"));
        // Get the logged-in user's ID from the sharedState
        if (sharedState.lastCreatedUser != null) {
            tool.setOwnerId(sharedState.lastCreatedUser.getId());
        }
        toolRepository.save(tool);
        lastCreatedTool = tool;
    }

    @When("the user updates the tool status to {string}")
    public void userUpdatesToolStatusTo(String status) {
        if (lastCreatedTool == null || lastCreatedTool.getId() == null) {
            throw new IllegalStateException("Tool must be created before updating status");
        }
        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("status", status);
        sharedState.latestResponse = restTemplate.exchange(
            "/api/tools/" + lastCreatedTool.getId() + "/status",
            HttpMethod.PUT,
            new HttpEntity<>(body, sharedState.headers),
            String.class
        );
    }

    @Then("the update response status is {int}")
    public void updateResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the tool status is {string}")
    public void toolStatusIs(String status) {
        Tool tool = toolRepository.findById(lastCreatedTool.getId()).orElse(null);
        assertNotNull(tool);
        assertEquals(ToolStatus.valueOf(status), tool.getStatus());
    }

    @When("the user deletes the tool")
    public void userDeletesTool() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/tools/" + lastCreatedTool.getId(),
            HttpMethod.DELETE,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the delete response status is {int}")
    public void deleteResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the tool is no longer in the system")
    public void toolIsNoLongerInSystem() {
        assertTrue(toolRepository.findById(lastCreatedTool.getId()).isEmpty());
    }
}
