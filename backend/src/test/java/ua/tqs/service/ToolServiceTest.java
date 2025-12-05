package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ToolServiceTest {

    @Mock
    private ToolRepository toolRepository;

    @InjectMocks
    private ToolService toolService;

    private Tool testTool;
    private Long ownerId = 100L;
    private Long otherUserId = 200L;

    @BeforeEach
    void setUp() {
        testTool = new Tool();
        testTool.setId(1L);
        testTool.setOwnerId(ownerId);
        testTool.setName("Electric Drill");
        testTool.setDescription("Professional grade electric drill");
        testTool.setDailyPrice(25.0);
        testTool.setDepositAmount(100.0);
        testTool.setStatus(ToolStatus.AVAILABLE);
        testTool.setLocation("Aveiro");
    }

    /**
     * TOOL CRUD TESTS
     */
    @Test
    void whenCreateTool_thenSuccess() {
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);

        Tool created = toolService.create(testTool);

        assertThat(created).isNotNull();
        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getName()).isEqualTo("Electric Drill");
        assertThat(created.getStatus()).isEqualTo(ToolStatus.AVAILABLE);
        verify(toolRepository, times(1)).save(testTool);
    }

    @Test
    void whenFindToolById_thenReturnTool() {
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        Optional<Tool> found = toolService.findById(1L);

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Electric Drill");
    }

    @Test
    void whenFindToolByIdNotExists_thenReturnEmpty() {
        when(toolRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<Tool> found = toolService.findById(999L);

        assertThat(found).isEmpty();
    }

    @Test
    void whenListAllTools_thenReturnAllTools() {
        Tool tool2 = new Tool();
        tool2.setName("Hammer");
        List<Tool> tools = Arrays.asList(testTool, tool2);
        
        when(toolRepository.findAll()).thenReturn(tools);

        List<Tool> found = toolService.listAll();

        assertThat(found).hasSize(2);
        assertThat(found).contains(testTool, tool2);
    }

    @Test
    void whenUpdateTool_thenSuccess() {
        Tool updates = new Tool();
        updates.setName("Updated Drill");
        updates.setDailyPrice(30.0);

        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);

        Tool updated = toolService.update(1L, updates);

        assertThat(updated.getName()).isEqualTo("Updated Drill");
        assertThat(updated.getDailyPrice()).isEqualTo(30.0);
    }

    @Test
    void whenDeleteTool_thenSuccess() {
        doNothing().when(toolRepository).deleteById(1L);

        toolService.delete(1L);

        verify(toolRepository, times(1)).deleteById(1L);
    }

    /**
     * TOOL OWNERSHIP VALIDATION TESTS
     */
    @Test
    void whenOwnerUpdatesTool_thenSuccess() {
        Tool updates = new Tool();
        updates.setName("Updated by Owner");

        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);

        Tool updated = toolService.updateByOwner(1L, ownerId, updates);

        assertThat(updated.getName()).isEqualTo("Updated by Owner");
        verify(toolRepository, times(1)).save(testTool);
    }

    @Test
    void whenNonOwnerTriesToUpdate_thenThrowException() {
        Tool updates = new Tool();
        updates.setName("Unauthorized Update");

        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> toolService.updateByOwner(1L, otherUserId, updates))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only the owner can update this tool");
    }

    @Test
    void whenOwnerDeletesTool_thenSuccess() {
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        doNothing().when(toolRepository).deleteById(1L);

        toolService.deleteByOwner(1L, ownerId);

        verify(toolRepository, times(1)).deleteById(1L);
    }

    @Test
    void whenNonOwnerTriesToDelete_thenThrowException() {
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));

        assertThatThrownBy(() -> toolService.deleteByOwner(1L, otherUserId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only the owner can delete this tool");
    }

    /**
     * TOOL STATUS TRANSITION TESTS
     */
    @Test
    void whenToolCreated_thenStatusIsAvailable() {
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);

        Tool created = toolService.create(testTool);

        assertThat(created.getStatus()).isEqualTo(ToolStatus.AVAILABLE);
    }

    @Test
    void whenToolMarkedAsRented_thenStatusChanges() {
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenAnswer(i -> i.getArgument(0));

        Tool updated = toolService.updateStatus(1L, ToolStatus.RENTED);

        assertThat(updated.getStatus()).isEqualTo(ToolStatus.RENTED);
        verify(toolRepository, times(1)).save(testTool);
    }

    @Test
    void whenToolMarkedAsUnavailable_thenStatusChanges() {
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenAnswer(i -> i.getArgument(0));

        Tool updated = toolService.updateStatus(1L, ToolStatus.UNAVAILABLE);

        assertThat(updated.getStatus()).isEqualTo(ToolStatus.UNAVAILABLE);
    }

    @Test
    void whenToolReturned_thenStatusBackToAvailable() {
        testTool.setStatus(ToolStatus.RENTED);
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenAnswer(i -> i.getArgument(0));

        Tool updated = toolService.updateStatus(1L, ToolStatus.AVAILABLE);

        assertThat(updated.getStatus()).isEqualTo(ToolStatus.AVAILABLE);
    }

    @Test
    void testCompleteToolLifecycle() {
        // Create: AVAILABLE
        when(toolRepository.save(any(Tool.class))).thenReturn(testTool);
        Tool tool = toolService.create(testTool);
        assertThat(tool.getStatus()).isEqualTo(ToolStatus.AVAILABLE);

        // Rent: AVAILABLE → RENTED
        when(toolRepository.findById(1L)).thenReturn(Optional.of(testTool));
        when(toolRepository.save(any(Tool.class))).thenAnswer(i -> i.getArgument(0));
        tool = toolService.updateStatus(1L, ToolStatus.RENTED);
        assertThat(tool.getStatus()).isEqualTo(ToolStatus.RENTED);

        // Return: RENTED → AVAILABLE
        tool = toolService.updateStatus(1L, ToolStatus.AVAILABLE);
        assertThat(tool.getStatus()).isEqualTo(ToolStatus.AVAILABLE);

        // Maintenance: AVAILABLE → UNAVAILABLE
        tool = toolService.updateStatus(1L, ToolStatus.UNAVAILABLE);
        assertThat(tool.getStatus()).isEqualTo(ToolStatus.UNAVAILABLE);

        // Back to service: UNAVAILABLE → AVAILABLE
        tool = toolService.updateStatus(1L, ToolStatus.AVAILABLE);
        assertThat(tool.getStatus()).isEqualTo(ToolStatus.AVAILABLE);
    }

    @Test
    void whenUpdateStatusOfNonExistentTool_thenThrowException() {
        when(toolRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> toolService.updateStatus(999L, ToolStatus.RENTED))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Tool not found");
    }

    /**
     * TOOL SEARCH/FILTER TESTS
     */
    @Test
    void whenFindToolsByOwner_thenReturnOwnerTools() {
        List<Tool> ownerTools = Arrays.asList(testTool);
        when(toolRepository.findByOwnerId(ownerId)).thenReturn(ownerTools);

        List<Tool> found = toolService.findByOwnerId(ownerId);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getOwnerId()).isEqualTo(ownerId);
    }

    @Test
    void whenFindToolsByStatus_thenReturnMatchingTools() {
        List<Tool> availableTools = Arrays.asList(testTool);
        when(toolRepository.findByStatus(ToolStatus.AVAILABLE)).thenReturn(availableTools);

        List<Tool> found = toolService.findByStatus(ToolStatus.AVAILABLE);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isEqualTo(ToolStatus.AVAILABLE);
    }

    @Test
    void whenFindToolsByLocation_thenReturnMatchingTools() {
        List<Tool> aveiro Tools = Arrays.asList(testTool);
        when(toolRepository.findByLocation("Aveiro")).thenReturn(aveiroTools);

        List<Tool> found = toolService.findByLocation("Aveiro");

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getLocation()).isEqualTo("Aveiro");
    }
}
