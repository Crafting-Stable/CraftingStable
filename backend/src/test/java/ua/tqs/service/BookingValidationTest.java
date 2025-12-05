package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.model.Rent;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingValidationTest {

    @Mock
    private RentRepository rentRepository;

    @Mock
    private ToolRepository toolRepository;

    @InjectMocks
    private RentService rentService;

    private Rent testRent;

    @BeforeEach
    void setUp() {
        testRent = new Rent();
        testRent.setToolId(1L);
        testRent.setUserId(200L);
    }

    /**
     * DATE VALIDATION TESTS
     */
    @Test
    void whenEndDateBeforeStartDate_thenThrowException() {
        testRent.setStartDate(LocalDateTime.now().plusDays(5));
        testRent.setEndDate(LocalDateTime.now().plusDays(2));

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date must be after start date");
    }

    @Test
    void whenStartDateEqualsEndDate_thenThrowException() {
        LocalDateTime sameDate = LocalDateTime.now().plusDays(3);
        testRent.setStartDate(sameDate);
        testRent.setEndDate(sameDate);

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date must be after start date");
    }

    @Test
    void whenStartDateInPast_thenThrowException() {
        testRent.setStartDate(LocalDateTime.now().minusDays(1));
        testRent.setEndDate(LocalDateTime.now().plusDays(3));

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date cannot be in the past");
    }

    @Test
    void whenStartDateNull_thenThrowException() {
        testRent.setStartDate(null);
        testRent.setEndDate(LocalDateTime.now().plusDays(3));

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenEndDateNull_thenThrowException() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(null);

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenBothDatesNull_thenThrowException() {
        testRent.setStartDate(null);
        testRent.setEndDate(null);

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenValidDates_andNoOverlap_thenSuccess() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(LocalDateTime.now().plusDays(5));

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
        verify(rentRepository, times(1)).save(testRent);
    }

    @Test
    void whenStartDateExactlyNow_thenSuccess() {
        // Borderline case: start date is "now" - should pass as it's not "before" now
        LocalDateTime now = LocalDateTime.now();
        testRent.setStartDate(now.plusSeconds(1)); // Slightly in future to avoid race condition
        testRent.setEndDate(now.plusDays(3));

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
    }

    @Test
    void whenRentSpansMultipleMonths_thenSuccess() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(LocalDateTime.now().plusDays(60)); // 2 months

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
    }

    @Test
    void whenMinimumRentalPeriod_oneDayPlus_thenSuccess() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(LocalDateTime.now().plusDays(1).plusHours(1)); // Just over 1 day

        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
    }
}
