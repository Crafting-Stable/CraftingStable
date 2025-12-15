package ua.tqs.integration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@ActiveProfiles("test")
public class UserControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Long createUser(String name, String email, String password) throws Exception {
        JsonNode payload = objectMapper.createObjectNode()
                .put("name", name)
                .put("email", email)
                .put("password", password);

        String content = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode node = objectMapper.readTree(content);
        return node.get("id").asLong();
    }

    @Test
    public void shouldCreateAndGetUser() throws Exception {
        String name = "Alice";
        String email = "alice@example.com";
        String password = "secret";

        Long id = createUser(name, email, password);

        mockMvc.perform(get("/api/users/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    public void listShouldContainCreatedUser() throws Exception {
        String name = "Bob";
        String email = "bob@example.com";
        createUser(name, email, "pwd");

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].email").exists());
        String listContent = mockMvc.perform(get("/api/users"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode arr = objectMapper.readTree(listContent);
        boolean found = false;
        for (JsonNode n : arr) {
            if (email.equals(n.get("email").asText())) {
                found = true;
                break;
            }
        }
        assertThat(found).isTrue();
    }

    @Test
    public void deleteUserRemovesIt() throws Exception {
        Long id = createUser("Carol", "carol@example.com", "pwd");

        mockMvc.perform(delete("/api/users/{id}", id))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    public void totalUsersReflectsCount() throws Exception {
        createUser("D1", "d1@example.com", "pwd");
        createUser("D2", "d2@example.com", "pwd");

        mockMvc.perform(get("/api/users/total-users"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").value(2));
    }
}
