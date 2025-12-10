package ua.tqs.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ClientStatsDTOTest {

    @Test
    void testClientStatsDTO() {
        ClientStatsDTO stats = new ClientStatsDTO();
        stats.setClientId(1L);
        stats.setTotalRents(10);
        stats.setActiveRents(2);
        stats.setPastRents(8);
        stats.setTotalSpent(500.0);

        assertEquals(1L, stats.getClientId());
        assertEquals(10, stats.getTotalRents());
        assertEquals(2, stats.getActiveRents());
        assertEquals(8, stats.getPastRents());
        assertEquals(500.0, stats.getTotalSpent());
    }

    @Test
    void testClientStatsDTOConstructor() {
        ClientStatsDTO stats = new ClientStatsDTO(1L, 10, 2, 8, 500.0);

        assertEquals(1L, stats.getClientId());
        assertEquals(10, stats.getTotalRents());
        assertEquals(2, stats.getActiveRents());
        assertEquals(8, stats.getPastRents());
        assertEquals(500.0, stats.getTotalSpent());
    }
}
