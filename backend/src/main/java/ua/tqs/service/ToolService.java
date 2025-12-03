package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ua.tqs.model.Tool;
import ua.tqs.repository.ToolRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository toolRepository;
    private final WikidataService wikidataService;

    public Tool create(Tool tool) {
        if ((tool.getImageUrl() == null || tool.getImageUrl().isBlank()) && tool.getName() != null) {
            wikidataService.findByLabel(tool.getName(), "pt")
                    .ifPresent(result -> {
                        tool.setImageUrl(result.getImageUrl());
                        tool.setWikidataId(result.getId());
                        tool.setImageFetchedAt(Instant.now());
                        tool.setImageSource("wikidata");
                    });
        }
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
