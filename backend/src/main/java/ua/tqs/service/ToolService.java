package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository toolRepository;

    public Tool create(Tool tool) {
        return toolRepository.save(tool);
    }

    public List<Tool> listAll() {
        return toolRepository.findAll();
    }

    public List<Tool> listAvailable() {
        return toolRepository.findByAvailableTrue();
    }

    public List<Tool> findByType(String tipo) {
        return toolRepository.findByType(tipo);
    }

    public Optional<Tool> findById(Long id) {
        return toolRepository.findById(id);
    }

    public void delete(Long id) {
        toolRepository.deleteById(id);
    }
}
