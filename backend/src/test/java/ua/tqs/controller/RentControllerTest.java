package ua.tqs.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

import ua.tqs.enums.RentStatus;
import ua.tqs.login.JwtUtil;
import ua.tqs.model.Rent;
import ua.tqs.service.RentService;
import ua.tqs.service.UserDetailsServiceImpl;

@WebMvcTest(controllers = RentController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(RentControllerTest.TestConfig.class)
class RentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RentService rentService; // mock fornecido pela TestConfig

    @Test
    void shouldReturnListOfRents() throws Exception {
        LocalDateTime start = LocalDateTime.parse("2025-01-01T10:00:00");
        LocalDateTime end = LocalDateTime.parse("2025-01-05T18:00:00");

        Rent rent = Rent.builder()
                .id(1L)
                .toolId(2L)
                .userId(3L)
                .startDate(start)
                .endDate(end)
                .status(RentStatus.PENDING)
                .message(null)
                .build();

        when(rentService.listAll()).thenReturn(List.of(rent));

        mockMvc.perform(get("/api/rents")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].toolId").value(2))
                .andExpect(jsonPath("$[0].userId").value(3))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    void shouldCreateRent() throws Exception {
        LocalDateTime start = LocalDateTime.parse("2025-02-01T09:00:00");
        LocalDateTime end = LocalDateTime.parse("2025-02-03T17:00:00");

        Map<String,Object> requestMap = Map.of(
                "toolId", 2,
                "userId", 3,
                "startDate", start.toString(),
                "endDate", end.toString()
        );

        Rent created = Rent.builder()
                .id(10L)
                .toolId(2L)
                .userId(3L)
                .startDate(start)
                .endDate(end)
                .status(RentStatus.PENDING)
                .message(null)
                .build();

        when(rentService.create(any(Rent.class))).thenReturn(created);

        mockMvc.perform(post("/api/rents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestMap)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.toolId").value(2))
                .andExpect(jsonPath("$.userId").value(3));
    }
    @Test
    void shouldFindByIdWhenExists() throws Exception {
        LocalDateTime start = LocalDateTime.parse("2025-01-01T10:00:00");
        LocalDateTime end = LocalDateTime.parse("2025-01-05T18:00:00");

        Rent rent = Rent.builder()
                .id(1L)
                .toolId(2L)
                .userId(3L)
                .startDate(start)
                .endDate(end)
                .status(RentStatus.PENDING)
                .message(null)
                .build();

        when(rentService.findById(1L)).thenReturn(java.util.Optional.of(rent));

        mockMvc.perform(get("/api/rents/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.toolId").value(2))
                .andExpect(jsonPath("$.userId").value(3))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void shouldReturnNotFoundForFindByIdWhenMissing() throws Exception {
        when(rentService.findById(99L)).thenReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/rents/99")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeleteRentWhenExists() throws Exception {
        LocalDateTime start = LocalDateTime.parse("2025-01-01T10:00:00");
        LocalDateTime end = LocalDateTime.parse("2025-01-05T18:00:00");

        Rent rent = Rent.builder()
                .id(1L)
                .toolId(2L)
                .userId(3L)
                .startDate(start)
                .endDate(end)
                .status(RentStatus.PENDING)
                .message(null)
                .build();

        when(rentService.findById(1L)).thenReturn(java.util.Optional.of(rent));
        // rentService.delete(...) não precisa de stubbing se for void

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/rents/1"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturnNotFoundWhenDeletingMissing() throws Exception {
        when(rentService.findById(5L)).thenReturn(java.util.Optional.empty());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/rents/5"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldFindByInterval() throws Exception {
        LocalDateTime from = LocalDateTime.parse("2025-03-01T00:00:00");
        LocalDateTime to = LocalDateTime.parse("2025-03-10T23:59:59");

        Rent rent = Rent.builder()
                .id(7L)
                .toolId(4L)
                .userId(8L)
                .startDate(from)
                .endDate(to)
                .status(RentStatus.APPROVED)
                .message(null)
                .build();

        when(rentService.findByInterval(from, to)).thenReturn(List.of(rent));

        mockMvc.perform(get("/api/rents/interval")
                        .param("from", from.toString())
                        .param("to", to.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(7))
                .andExpect(jsonPath("$[0].status").value("APPROVED"));
    }


    @TestConfiguration
    static class TestConfig {
        @Bean
        public RentService rentService() {
            return Mockito.mock(RentService.class);
        }

        @Bean
        public JwtUtil jwtUtil() {
            return Mockito.mock(JwtUtil.class);
        }

        @Bean
        public UserDetailsServiceImpl userDetailsServiceImpl() {
            return Mockito.mock(UserDetailsServiceImpl.class);
        }
    }
}
