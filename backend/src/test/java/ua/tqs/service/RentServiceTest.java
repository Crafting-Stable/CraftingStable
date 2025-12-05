package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.RentStatus;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentServiceTest {

    @Mock
    private RentRepository rentRepository;

    @Mock
    private ToolRepository toolRepository;

    @InjectMocks
    private RentService rentService;

    private Tool testTool;
    private Rent testRent;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    @BeforeEach
    void setUp() {
        startDate = LocalDateTime.now().plusDays(1);
        endDate = LocalDateTime.now().plusDays(5);

        testTool = new Tool();
        testTool.setId(1L);
        testTool.setOwnerId(100L);
        testTool.setName("Test Drill");
        testTool.setStatus(ToolStatus.AVAILABLE);

        testRent = new Rent();
        testRent.setId(1L);
        testRent.setToolId(1L);
        testRent.setUserId(200L);
        testRent.setStartDate(startDate);
        testRent.setEndDate(endDate);
        testRent.setStatus(RentStatus.PENDING);
    }

    @Test
    void whenCreateRent_thenSuccess() {
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getStatus()).isEqualTo(RentStatus.PENDING);
        verify(rentRepository, times(1)).save(testRent);
    }

    @Test
    void whenFindById_thenReturnRent() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));

        Optional<Rent> found = rentService.findById(1L);

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(1L);
    }

    @Test
    void whenFindByIdNotExists_thenReturnEmpty() {
        when(rentRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Rent> found = rentService.findById(999L);

        assertThat(found).isEmpty();
    }

    @Test
    void whenListAll_thenReturnAllRents() {
        List<Rent> rents = Arrays.asList(testRent, new Rent());
        when(rentRepository.findAll()).thenReturn(rents);

        List<Rent> found = rentService.listAll();

        assertThat(found).hasSize(2);
    }

    @Test
    void whenDeleteRent_thenSuccess() {
        doNothing().when(rentRepository).deleteById(1L);

        rentService.delete(1L);

        verify(rentRepository, times(1)).deleteById(1L);
    }

    @Test
    void whenFindByInterval_thenReturnRentsInInterval() {
        LocalDateTime from = LocalDateTime.now();
        LocalDateTime to = LocalDateTime.now().plusDays(10);
        
        when(rentRepository.findByStartDateBetween(from, to))
                .thenReturn(Collections.singletonList(testRent));

        List<Rent> found = rentService.findByInterval(from, to);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getId()).isEqualTo(1L);
    }

    /**
     * OVERLAP PREVENTION TESTS
     */
    @Test
    void whenCheckOverlap_exactSameDates_thenOverlapDetected() {
        // Given: existing rent from day 1 to day 5
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate);
        existingRent.setEndDate(endDate);
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent request for same dates
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(endDate);

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isTrue();
    }

    @Test
    void whenCheckOverlap_newStartsDuringExisting_thenOverlapDetected() {
        // Given: existing rent from day 1 to day 5
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate);
        existingRent.setEndDate(endDate);
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent starts day 3, ends day 7 (overlaps at the start)
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate.plusDays(2)); // day 3
        newRent.setEndDate(endDate.plusDays(2));     // day 7

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isTrue();
    }

    @Test
    void whenCheckOverlap_newEndsDuringExisting_thenOverlapDetected() {
        // Given: existing rent from day 3 to day 7
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate.plusDays(2));
        existingRent.setEndDate(endDate.plusDays(2));
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent starts day 1, ends day 5 (overlaps at the end)
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(endDate);

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isTrue();
    }

    @Test
    void whenCheckOverlap_newEncompassesExisting_thenOverlapDetected() {
        // Given: existing rent from day 3 to day 5
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate.plusDays(2));
        existingRent.setEndDate(endDate.minusDays(2));
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent from day 1 to day 7 (encompasses existing)
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(endDate.plusDays(2));

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isTrue();
    }

    @Test
    void whenCheckOverlap_noOverlap_beforeExisting_thenNoOverlap() {
        // Given: existing rent from day 5 to day 10
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate.plusDays(4));
        existingRent.setEndDate(endDate.plusDays(5));
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent from day 1 to day 3 (before existing)
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(startDate.plusDays(2));

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: no overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isFalse();
    }

    @Test
    void whenCheckOverlap_noOverlap_afterExisting_thenNoOverlap() {
        // Given: existing rent from day 1 to day 3
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate);
        existingRent.setEndDate(startDate.plusDays(2));
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent from day 5 to day 10 (after existing)
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate.plusDays(4));
        newRent.setEndDate(endDate.plusDays(5));

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.singletonList(existingRent));

        // Then: no overlap should be detected
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isFalse();
    }

    @Test
    void whenCheckOverlap_onlyCanceledRents_thenNoOverlap() {
        // Given: existing CANCELED rent with same dates
        Rent canceledRent = new Rent();
        canceledRent.setToolId(1L);
        canceledRent.setStartDate(startDate);
        canceledRent.setEndDate(endDate);
        canceledRent.setStatus(RentStatus.CANCELED);

        // When: new rent with same dates
        Rent newRent = new Rent();
        newRent.setToolId(1L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(endDate);

        when(rentRepository.findByToolIdAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.emptyList()); // canceled rents are excluded

        // Then: no overlap (canceled rents don't block)
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isFalse();
    }

    @Test
    void whenCheckOverlap_differentTools_thenNoOverlap() {
        // Given: existing rent for tool 1
        Rent existingRent = new Rent();
        existingRent.setToolId(1L);
        existingRent.setStartDate(startDate);
        existingRent.setEndDate(endDate);
        existingRent.setStatus(RentStatus.APPROVED);

        // When: new rent for tool 2 with same dates
        Rent newRent = new Rent();
        newRent.setToolId(2L);
        newRent.setStartDate(startDate);
        newRent.setEndDate(endDate);

        when(rentRepository.findByToolIdAndStatusIn(eq(2L), anyList()))
                .thenReturn(Collections.emptyList());

        // Then: no overlap (different tools)
        boolean hasOverlap = rentService.hasOverlap(newRent);
        assertThat(hasOverlap).isFalse();
    }
}
