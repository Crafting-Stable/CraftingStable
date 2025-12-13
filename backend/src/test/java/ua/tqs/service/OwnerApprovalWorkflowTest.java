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
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnerApprovalWorkflowTest {

    @Mock
    private RentRepository rentRepository;

    @Mock
    private ToolRepository toolRepository;

    @InjectMocks
    private RentService rentService;

    private Tool testTool;
    private Rent testRent;
    private Long toolOwnerId = 100L;
    private Long renterId = 200L;
    private Long otherUserId = 300L;

    @BeforeEach
    void setUp() {
        LocalDateTime startDate = LocalDateTime.now().plusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(5);

        testTool = new Tool();
        testTool.setId(1L);
        testTool.setOwnerId(toolOwnerId);
        testTool.setName("Test Drill");
        testTool.setStatus(ToolStatus.AVAILABLE);

        testRent = new Rent();
        testRent.setId(1L);
        testRent.setToolId(1L);
        testRent.setUserId(renterId);
        testRent.setStartDate(startDate);
        testRent.setEndDate(endDate);
        testRent.setStatus(RentStatus.PENDING);
    }

    /**
     * OWNER APPROVAL TESTS
     */
    @Test
    void whenOwnerApprovesOwnToolRent_thenSuccess() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        Rent approved = rentService.approveRent(1L, toolOwnerId);

        assertThat(approved.getStatus()).isEqualTo(RentStatus.APPROVED);
        verify(rentRepository, times(1)).save(any(Rent.class));
    }

    @Test
    void whenNonOwnerTriesToApprove_thenThrowException() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.approveRent(1L, otherUserId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only the tool owner can approve");
    }

    @Test
    void whenRenterTriesToApproveOwnRent_thenThrowException() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.approveRent(1L, renterId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only the tool owner can approve");
    }

    @Test
    void whenApprovingNonPendingRent_thenThrowException() {
        testRent.setStatus(RentStatus.APPROVED);
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.approveRent(1L, toolOwnerId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only pending rents can be approved");
    }

    @Test
    void whenApprovingCanceledRent_thenThrowException() {
        testRent.setStatus(RentStatus.CANCELED);
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.approveRent(1L, toolOwnerId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only pending rents can be approved");
    }

    @Test
    void whenApproveNonExistentRent_thenThrowException() {
        when(rentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentService.approveRent(999L, toolOwnerId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Rent not found");
    }

    /**
     * OWNER REJECTION TESTS
     */
    @Test
    void whenOwnerRejectsOwnToolRent_thenSuccess() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(rentRepository.save(any(Rent.class))).thenReturn(testRent);

        String rejectionMessage = "Tool is under maintenance";
        Rent rejected = rentService.rejectRent(1L, toolOwnerId, rejectionMessage);

        assertThat(rejected.getStatus()).isEqualTo(RentStatus.REJECTED);
        // Ajustado para esperar o prefixo aplicado pelo serviço
        assertThat(rejected.getMessage()).isEqualTo("Rejeitado: " + rejectionMessage);
        verify(rentRepository, times(1)).save(any(Rent.class));
    }

    @Test
    void whenNonOwnerTriesToReject_thenThrowException() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.rejectRent(1L, otherUserId, "No reason"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only the tool owner can reject");
    }

    @Test
    void whenRejectingNonPendingRent_thenThrowException() {
        testRent.setStatus(RentStatus.APPROVED);
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> rentService.rejectRent(1L, toolOwnerId, "Changed mind"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only pending rents can be rejected");
    }

    @Test
    void whenRejectNonExistentRent_thenThrowException() {
        when(rentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentService.rejectRent(999L, toolOwnerId, "No reason"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Rent not found");
    }

    /**
     * RENT STATUS TRANSITION TESTS
     */
    @Test
    void testCompleteRentLifecycle_approvalPath() {
        // Start PENDING
        assertThat(testRent.getStatus()).isEqualTo(RentStatus.PENDING);

        // Owner approves → APPROVED
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(rentRepository.save(any(Rent.class))).thenAnswer(i -> {
            Rent rent = i.getArgument(0);
            testRent.setStatus(rent.getStatus());
            return rent;
        });

        rentService.approveRent(1L, toolOwnerId);
        assertThat(testRent.getStatus()).isEqualTo(RentStatus.APPROVED);

        // Cannot approve again
        assertThatThrownBy(() -> rentService.approveRent(1L, toolOwnerId))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void testCompleteRentLifecycle_rejectionPath() {
        // Start PENDING
        assertThat(testRent.getStatus()).isEqualTo(RentStatus.PENDING);

        // Owner rejects → REJECTED
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(rentRepository.save(any(Rent.class))).thenAnswer(i -> {
            Rent rent = i.getArgument(0);
            testRent.setStatus(rent.getStatus());
            return rent;
        });

        rentService.rejectRent(1L, toolOwnerId, "Not available");
        assertThat(testRent.getStatus()).isEqualTo(RentStatus.REJECTED);

        // Cannot reject again
        assertThatThrownBy(() -> rentService.rejectRent(1L, toolOwnerId, "Still no"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void whenToolNotFound_approvalFails() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentService.approveRent(1L, toolOwnerId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Tool not found");
    }

    @Test
    void whenToolNotFound_rejectionFails() {
        when(rentRepository.findById(1L)).thenReturn(Optional.of(testRent));
        when(toolRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentService.rejectRent(1L, toolOwnerId, "No reason"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Tool not found");
    }
}
