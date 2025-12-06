package ua.tqs.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class RentDTOTest {

    @Test
    void rentRequestDTO_gettersSettersAndConstructor() {
        LocalDateTime start = LocalDateTime.of(2025, 1, 10, 9, 30);
        LocalDateTime end = LocalDateTime.of(2025, 1, 12, 18, 0);

        // testar setters/getters no construtor padrão
        RentRequestDTO req = new RentRequestDTO();
        req.setToolId(2L);
        req.setUserId(3L);
        req.setStartDate(start);
        req.setEndDate(end);

        assertEquals(2L, req.getToolId());
        assertEquals(3L, req.getUserId());
        assertEquals(start, req.getStartDate());
        assertEquals(end, req.getEndDate());

        // testar construtor parametrizado
        RentRequestDTO req2 = new RentRequestDTO(10L, 11L, start, end);
        assertEquals(10L, req2.getToolId());
        assertEquals(11L, req2.getUserId());
        assertEquals(start, req2.getStartDate());
        assertEquals(end, req2.getEndDate());
    }

    @Test
    void rentResponseDTO_gettersSettersAndConstructor() {
        LocalDateTime start = LocalDateTime.of(2025, 2, 1, 8, 0);
        LocalDateTime end = LocalDateTime.of(2025, 2, 3, 17, 0);

        // testar construtor parametrizado
        RentResponseDTO res = new RentResponseDTO(1L, 2L, 3L, "ACTIVE", start, end, "ok");
        assertEquals(1L, res.getId());
        assertEquals(2L, res.getToolId());
        assertEquals(3L, res.getUserId());
        assertEquals("ACTIVE", res.getStatus());
        assertEquals(start, res.getStartDate());
        assertEquals(end, res.getEndDate());
        assertEquals("ok", res.getMessage());

        // testar setters/getters no construtor padrão e toString()
        RentResponseDTO res2 = new RentResponseDTO();
        res2.setId(5L);
        res2.setMessage("done");

        assertEquals(5L, res2.getId());
        assertEquals("done", res2.getMessage());
        assertNotNull(res2.toString());
        assertTrue(res2.toString().length() > 0);
    }
}
