package ua.tqs.model;

import org.junit.jupiter.api.Test;
import ua.tqs.enums.RentStatus;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class RentTest {

    @Test
    void testRentModelWithBuilder() {
        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = LocalDateTime.now().plusDays(1);

        Rent rent = Rent.builder()
                .id(1L)
                .toolId(1L)
                .userId(1L)
                .startDate(startDate)
                .endDate(endDate)
                .status(RentStatus.PENDING)
                .message("Test message")
                .build();

        assertEquals(1L, rent.getId());
        assertEquals(1L, rent.getToolId());
        assertEquals(1L, rent.getUserId());
        assertEquals(startDate, rent.getStartDate());
        assertEquals(endDate, rent.getEndDate());
        assertEquals(RentStatus.PENDING, rent.getStatus());
        assertEquals("Test message", rent.getMessage());
    }

    @Test
    void testRentDefaultConstructor() {
        Rent rent = new Rent();
        assertNull(rent.getId());
        assertEquals(RentStatus.ACTIVE, rent.getStatus());
    }
}
