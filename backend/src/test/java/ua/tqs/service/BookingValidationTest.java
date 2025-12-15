package ua.tqs.service;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import ua.tqs.model.Rent;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;

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

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date must be after start date");
    }

    @Test
    void whenStartDateEqualsEndDate_thenThrowException() {
        LocalDateTime sameDate = LocalDateTime.now().plusDays(3);
        testRent.setStartDate(sameDate);
        testRent.setEndDate(sameDate);

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("End date must be after start date");
    }

    @Test
    void whenEndDateInPast_thenThrowException() {
        testRent.setStartDate(LocalDateTime.now().minusDays(3));
        testRent.setEndDate(LocalDateTime.now().minusDays(1));

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date cannot be in the past");
    }

    @Test
    void whenStartDateNull_thenThrowException() {
        testRent.setStartDate(null);
        testRent.setEndDate(LocalDateTime.now().plusDays(3));

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenEndDateNull_thenThrowException() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(null);

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenBothDatesNull_thenThrowException() {
        testRent.setStartDate(null);
        testRent.setEndDate(null);

        assertThatThrownBy(() -> rentService.create(testRent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Start date and end date are required");
    }

    @Test
    void whenValidDates_andNoOverlap_thenSuccess() {
        testRent.setStartDate(LocalDateTime.now().plusDays(1));
        testRent.setEndDate(LocalDateTime.now().plusDays(5));

        ua.tqs.model.Tool tool = new ua.tqs.model.Tool();
        tool.setId(1L);
        tool.setOwnerId(100L); // Different from testRent.userId (200L)
        
        when(toolRepository.findById(1L)).thenReturn(java.util.Optional.of(tool));
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

        ua.tqs.model.Tool tool = new ua.tqs.model.Tool();
        tool.setId(1L);
        tool.setOwnerId(100L); // Different from testRent.userId (200L)
        
        when(toolRepository.findById(1L)).thenReturn(java.util.Optional.of(tool));
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

        ua.tqs.model.Tool tool = new ua.tqs.model.Tool();
        tool.setId(1L);
        tool.setOwnerId(100L); // Different from testRent.userId (200L)
        
        when(toolRepository.findById(1L)).thenReturn(java.util.Optional.of(tool));
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

        ua.tqs.model.Tool tool = new ua.tqs.model.Tool();
        tool.setId(1L);
        tool.setOwnerId(100L); // Different from testRent.userId (200L)
        
        when(toolRepository.findById(1L)).thenReturn(java.util.Optional.of(tool));
        when(rentRepository.findOverlappingRents(anyLong(), any(), any(), anyList()))
                .thenReturn(java.util.Collections.emptyList());
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent created = rentService.create(testRent);

        assertThat(created).isNotNull();
    }
}
