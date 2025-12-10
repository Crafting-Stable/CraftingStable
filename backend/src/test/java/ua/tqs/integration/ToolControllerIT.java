package ua.tqs.integration;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

import ua.tqs.enums.ToolStatus;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@WithMockUser
public class ToolControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        toolRepository.deleteAll();
    }

    @Test
    void contextLoads() {
        assertNotNull(mockMvc);
    }

    @Test
    void createTool_returnsCreated() throws Exception {
        Map<String, Object> dto = new HashMap<>();
        dto.put("name", "Furadeira X");
        dto.put("type", "drill");
        dto.put("dailyPrice", new BigDecimal("12.50"));
        dto.put("depositAmount", new BigDecimal("30.00"));
        dto.put("available", true);
        dto.put("status", ToolStatus.AVAILABLE);

        mockMvc.perform(post("/api/tools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.name").value("Furadeira X"))
                .andExpect(jsonPath("$.type").value("drill"));
    }

    @Test
    void listAll_returnsOk() throws Exception {
        Tool saved = toolRepository.save(Tool.builder()
                .name("Chave Inglesa")
                .type("wrench")
                .dailyPrice(new BigDecimal("5.00"))
                .depositAmount(new BigDecimal("10.00"))
                .available(true)
                .status(ToolStatus.AVAILABLE)
                .build());

        mockMvc.perform(get("/api/tools")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(saved.getId()))
                .andExpect(jsonPath("$[0].name").value("Chave Inglesa"));
    }

    @Test
    void listAvailable_returnsOk() throws Exception {
        Tool saved = toolRepository.save(Tool.builder()
                .name("Serra")
                .type("saw")
                .dailyPrice(new BigDecimal("8.00"))
                .depositAmount(new BigDecimal("20.00"))
                .available(true)
                .status(ToolStatus.AVAILABLE)
                .build());

        mockMvc.perform(get("/api/tools/available")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(saved.getId()))
                .andExpect(jsonPath("$[0].status").value("AVAILABLE"));
    }

    @Test
    void findByType_returnsOk() throws Exception {
        Tool saved = toolRepository.save(Tool.builder()
                .name("Parafusadeira")
                .type("drill")
                .dailyPrice(new BigDecimal("9.00"))
                .depositAmount(new BigDecimal("15.00"))
                .available(true)
                .status(ToolStatus.AVAILABLE)
                .build());

        mockMvc.perform(get("/api/tools/type/{type}", "drill")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("drill"))
                .andExpect(jsonPath("$[0].id").value(saved.getId()));
    }

    @Test
    void findById_returnsOk() throws Exception {
        Tool saved = toolRepository.save(Tool.builder()
                .name("Martelo")
                .type("hammer")
                .dailyPrice(new BigDecimal("3.00"))
                .depositAmount(new BigDecimal("5.00"))
                .available(true)
                .status(ToolStatus.AVAILABLE)
                .build());

        mockMvc.perform(get("/api/tools/{id}", saved.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.name").value("Martelo"));
    }

    @Test
    void delete_returnsNoContent() throws Exception {
        Tool saved = toolRepository.save(Tool.builder()
                .name("Alicate")
                .type("pliers")
                .dailyPrice(new BigDecimal("2.50"))
                .depositAmount(new BigDecimal("4.00"))
                .available(true)
                .status(ToolStatus.AVAILABLE)
                .build());

        mockMvc.perform(delete("/api/tools/{id}", saved.getId()))
                .andExpect(status().isOk());

        // confirmar remoção
        mockMvc.perform(get("/api/tools/{id}", saved.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }
}
