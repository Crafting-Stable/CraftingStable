package ua.tqs.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import ua.tqs.controller.ToolController;
import ua.tqs.model.Tool;
import ua.tqs.service.ToolService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ToolControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private ToolService toolService;

    @InjectMocks
    private ToolController toolController;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(toolController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private Tool sampleTool(Long id) {
        return Tool.builder()
                .id(id)
                .name("Drill")
                .type("Power")
                .dailyPrice(new BigDecimal("10.50"))
                .depositAmount(new BigDecimal("20.00"))
                .description("Good drill")
                .location("Porto")
                .available(true)
                .imageUrl("http://example.com/img.png")
                .ownerId(42L)
                .build();
    }

    @Test
    void create_returnsCreatedAndLocation() throws Exception {
        Tool created = sampleTool(1L);

        when(toolService.create(any(Tool.class))).thenReturn(created);

        String payload = """
                {
                  "name":"Drill",
                  "type":"Power",
                  "dailyPrice":10.50,
                  "depositAmount":20.00,
                  "description":"Good drill",
                  "location":"Porto",
                  "available":true,
                  "imageUrl":"http://example.com/img.png",
                  "ownerId":42
                }
                """;

        mockMvc.perform(post("/api/tools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tools/1"))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Drill")));

        verify(toolService, times(1)).create(any(Tool.class));
    }

    @Test
    void listAll_returnsList() throws Exception {
        Tool t1 = sampleTool(1L);
        Tool t2 = sampleTool(2L);
        t2.setName("Saw");

        when(toolService.listAll()).thenReturn(List.of(t1, t2));

        mockMvc.perform(get("/api/tools"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Drill")))
                .andExpect(jsonPath("$[1].name", is("Saw")));

        verify(toolService, times(1)).listAll();
    }

    @Test
    void listAvailable_returnsOnlyAvailable() throws Exception {
        Tool t1 = sampleTool(1L);

        when(toolService.listAvailable()).thenReturn(List.of(t1));

        mockMvc.perform(get("/api/tools/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].available", is(true)));

        verify(toolService, times(1)).listAvailable();
    }

    @Test
    void findByType_returnsMatchingTools() throws Exception {
        Tool t1 = sampleTool(1L);

        when(toolService.findByType(eq("Power"))).thenReturn(List.of(t1));

        mockMvc.perform(get("/api/tools/type/Power"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type", is("Power")));

        verify(toolService, times(1)).findByType("Power");
    }

    @Test
    void findById_whenFound_returnsTool() throws Exception {
        Tool t1 = sampleTool(1L);

        when(toolService.findById(1L)).thenReturn(Optional.of(t1));

        mockMvc.perform(get("/api/tools/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Drill")));

        verify(toolService, times(1)).findById(1L);
    }

    @Test
    void findById_whenNotFound_returns404() throws Exception {
        when(toolService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/tools/99"))
                .andExpect(status().isNotFound());

        verify(toolService, times(1)).findById(99L);
    }

    @Test
    void delete_callsServiceAndReturnsNoContent() throws Exception {
        doNothing().when(toolService).delete(1L);

        mockMvc.perform(delete("/api/tools/1"))
                .andExpect(status().isNoContent());

        verify(toolService, times(1)).delete(1L);
    }
}
