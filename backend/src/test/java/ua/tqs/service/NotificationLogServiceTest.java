package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.repository.NotificationLogRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationLogServiceTest {

    @Mock
    private NotificationLogRepository repository;

    @InjectMocks
    private NotificationLogService service;

    private NotificationLog log1;
    private NotificationLog log2;
    private NotificationLog log3;

    @BeforeEach
    void setUp() {
        log1 = NotificationLog.builder()
            .id(1L)
            .userId(100L)
            .type(NotificationType.RENT_APPROVED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.SENT)
            .recipient("user@example.com")
            .subject("Rent Approved")
            .sentAt(LocalDateTime.now().minusDays(1))
            .relatedRentId(1L)
            .build();

        log2 = NotificationLog.builder()
            .id(2L)
            .userId(100L)
            .type(NotificationType.RENT_REJECTED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.FAILED)
            .recipient("user@example.com")
            .subject("Rent Rejected")
            .errorMessage("SMTP connection failed")
            .relatedRentId(2L)
            .build();

        log3 = NotificationLog.builder()
            .id(3L)
            .userId(200L)
            .type(NotificationType.RENT_APPROVED)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.SENT)
            .recipient("other@example.com")
            .subject("Rent Approved")
            .sentAt(LocalDateTime.now().minusHours(2))
            .relatedRentId(3L)
            .build();
    }

    /**
     * FIND BY USER ID TESTS
     */
    @Test
    void whenFindByUserId_thenReturnUserLogs() {
        when(repository.findByUserIdOrderByCreatedAtDesc(100L))
            .thenReturn(Arrays.asList(log2, log1));

        List<NotificationLog> logs = service.findByUserId(100L);

        assertThat(logs).hasSize(2);
        assertThat(logs).containsExactly(log2, log1);
        verify(repository, times(1)).findByUserIdOrderByCreatedAtDesc(100L);
    }

    @Test
    void whenFindByUserId_andNoLogs_thenReturnEmptyList() {
        when(repository.findByUserIdOrderByCreatedAtDesc(999L))
            .thenReturn(Arrays.asList());

        List<NotificationLog> logs = service.findByUserId(999L);

        assertThat(logs).isEmpty();
    }

    /**
     * FIND BY RENT ID TESTS
     */
    @Test
    void whenFindByRentId_thenReturnRentLogs() {
        when(repository.findByRelatedRentIdOrderByCreatedAtDesc(1L))
            .thenReturn(Arrays.asList(log1));

        List<NotificationLog> logs = service.findByRentId(1L);

        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getRelatedRentId()).isEqualTo(1L);
        verify(repository, times(1)).findByRelatedRentIdOrderByCreatedAtDesc(1L);
    }

    /**
     * FIND BY STATUS TESTS
     */
    @Test
    void whenFindByStatus_thenReturnMatchingLogs() {
        when(repository.findByStatusOrderByCreatedAtDesc(NotificationStatus.SENT))
            .thenReturn(Arrays.asList(log3, log1));

        List<NotificationLog> logs = service.findByStatus(NotificationStatus.SENT);

        assertThat(logs).hasSize(2);
        assertThat(logs).allMatch(log -> log.getStatus() == NotificationStatus.SENT);
    }

    @Test
    void whenFindByStatus_andNoLogs_thenReturnEmptyList() {
        when(repository.findByStatusOrderByCreatedAtDesc(NotificationStatus.PENDING))
            .thenReturn(Arrays.asList());

        List<NotificationLog> logs = service.findByStatus(NotificationStatus.PENDING);

        assertThat(logs).isEmpty();
    }

    /**
     * FIND FAILED NOTIFICATIONS TESTS
     */
    @Test
    void whenFindFailed_thenReturnFailedLogs() {
        when(repository.findByStatusOrderByCreatedAtDesc(NotificationStatus.FAILED))
            .thenReturn(Arrays.asList(log2));

        List<NotificationLog> logs = service.findFailed();

        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(logs.get(0).getErrorMessage()).isNotNull();
    }

    /**
     * COUNT BY STATUS TESTS
     */
    @Test
    void whenCountByStatus_thenReturnCount() {
        when(repository.countByStatus(NotificationStatus.SENT)).thenReturn(2L);

        Long count = service.countByStatus(NotificationStatus.SENT);

        assertThat(count).isEqualTo(2L);
        verify(repository, times(1)).countByStatus(NotificationStatus.SENT);
    }

    /**
     * COUNT BY TYPE TESTS
     */
    @Test
    void whenCountByType_thenReturnCount() {
        when(repository.countByType(NotificationType.RENT_APPROVED)).thenReturn(2L);

        Long count = service.countByType(NotificationType.RENT_APPROVED);

        assertThat(count).isEqualTo(2L);
        verify(repository, times(1)).countByType(NotificationType.RENT_APPROVED);
    }

    /**
     * STATISTICS TESTS
     */
    @Test
    void whenGetStatistics_thenReturnStats() {
        when(repository.countByStatus(NotificationStatus.SENT)).thenReturn(10L);
        when(repository.countByStatus(NotificationStatus.FAILED)).thenReturn(2L);
        when(repository.countByStatus(NotificationStatus.PENDING)).thenReturn(1L);
        when(repository.count()).thenReturn(13L);

        Map<String, Long> stats = service.getStatistics();

        assertThat(stats).containsEntry("total", 13L);
        assertThat(stats).containsEntry("sent", 10L);
        assertThat(stats).containsEntry("failed", 2L);
        assertThat(stats).containsEntry("pending", 1L);

        verify(repository, times(1)).count();
        verify(repository, times(1)).countByStatus(NotificationStatus.SENT);
        verify(repository, times(1)).countByStatus(NotificationStatus.FAILED);
        verify(repository, times(1)).countByStatus(NotificationStatus.PENDING);
    }

    /**
     * FIND BY ID TESTS
     */
    @Test
    void whenFindById_andExists_thenReturnLog() {
        when(repository.findById(1L)).thenReturn(Optional.of(log1));

        Optional<NotificationLog> log = service.findById(1L);

        assertThat(log).isPresent();
        assertThat(log.get().getId()).isEqualTo(1L);
    }

    @Test
    void whenFindById_andNotExists_thenReturnEmpty() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        Optional<NotificationLog> log = service.findById(999L);

        assertThat(log).isEmpty();
    }

    /**
     * FIND RECENT LOGS TESTS
     */
    @Test
    void whenFindRecentLogs_thenReturnLimitedLogs() {
        when(repository.findTopNOrderByCreatedAtDesc(10))
            .thenReturn(Arrays.asList(log2, log1));

        List<NotificationLog> logs = service.findRecentLogs(10);

        assertThat(logs).hasSize(2);
        verify(repository, times(1)).findTopNOrderByCreatedAtDesc(10);
    }
}
