package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ToolService {

    private static final String TOOL_NOT_FOUND = "Tool not found";

    private final ToolRepository toolRepository;

    @Transactional
    public Tool create(Tool tool) {
        // Set default status if not specified
        if (tool.getStatus() == null) {
            tool.setStatus(ToolStatus.AVAILABLE);
        }
        return toolRepository.save(tool);
    }

    public List<Tool> listAll() {
        return toolRepository.findAll();
    }

    public List<Tool> listAvailable() {
        return toolRepository.findByStatus(ToolStatus.AVAILABLE);
    }

    public List<Tool> findByType(String tipo) {
        return toolRepository.findByType(tipo);
    }

    public Optional<Tool> findById(Long id) {
        return toolRepository.findById(id);
    }

    @Transactional
    public Tool update(Long id, Tool updates) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(TOOL_NOT_FOUND));

        updateToolFields(tool, updates);
        return toolRepository.save(tool);
    }

    @Transactional
    public Tool updateByOwner(Long id, Long ownerId, Tool updates) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(TOOL_NOT_FOUND));

        // Verify ownership
        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the owner can update this tool");
        }

        updateToolFields(tool, updates);
        return toolRepository.save(tool);
    }

    @Transactional
    public void delete(Long id) {
        toolRepository.deleteById(id);
    }

    @Transactional
    public void deleteByOwner(Long id, Long ownerId) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(TOOL_NOT_FOUND));

        // Verify ownership
        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the owner can delete this tool");
        }

        toolRepository.deleteById(id);
    }

    @Transactional
    public Tool updateStatus(Long id, ToolStatus status) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(TOOL_NOT_FOUND));

        tool.setStatus(status);
        return toolRepository.save(tool);
    }

    public List<Tool> findByOwnerId(Long ownerId) {
        return toolRepository.findByOwnerId(ownerId);
    }

    public List<Tool> findByStatus(ToolStatus status) {
        return toolRepository.findByStatus(status);
    }

    public List<Tool> findByLocation(String location) {
        return toolRepository.findByLocation(location);
    }

    private void updateToolFields(Tool tool, Tool updates) {
        if (updates.getName() != null) {
            tool.setName(updates.getName());
        }
        if (updates.getDescription() != null) {
            tool.setDescription(updates.getDescription());
        }
        if (updates.getDailyPrice() != null) {
            tool.setDailyPrice(updates.getDailyPrice());
        }
        if (updates.getDepositAmount() != null) {
            tool.setDepositAmount(updates.getDepositAmount());
        }
        if (updates.getLocation() != null) {
            tool.setLocation(updates.getLocation());
        }
        if (updates.getStatus() != null) {
            tool.setStatus(updates.getStatus());
        }
    }
}
