package ua.tqs.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.ToolDTO;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Tool;
import ua.tqs.service.ToolService;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ToolController {

    private final ToolService toolService;

    @PostMapping
    public ResponseEntity<ToolDTO> create(@Valid @RequestBody ToolDTO dto) {
        Tool toSave = dto.toModel();
        Tool created = toolService.create(toSave);
        ToolDTO result = ToolDTO.fromModel(created);
        return ResponseEntity.created(URI.create("/api/tools/" + result.getId())).body(result);
    }

    @GetMapping
    public ResponseEntity<List<ToolDTO>> listAll() {
        List<ToolDTO> dtos = toolService.listAll()
                .stream()
                .map(ToolDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/available")
    public ResponseEntity<List<ToolDTO>> listAvailable() {
        List<ToolDTO> dtos = toolService.listAvailable()
                .stream()
                .map(ToolDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ToolDTO>> findByType(@PathVariable String type) {
        List<ToolDTO> dtos = toolService.findByType(type)
                .stream()
                .map(ToolDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ToolDTO> findById(@PathVariable Long id) {
        Tool f = toolService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ferramenta não encontrada: " + id));
        return ResponseEntity.ok(ToolDTO.fromModel(f));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        toolService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ToolDTO> update(@PathVariable Long id, @Valid @RequestBody ToolDTO dto) {
        Tool updates = dto.toModel();
        Tool updated = toolService.update(id, updates);
        ToolDTO result = ToolDTO.fromModel(updated);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ToolDTO> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().build();
        }
        ToolStatus newStatus;
        try {
            newStatus = ToolStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        Tool updated = toolService.updateStatus(id, newStatus);
        ToolDTO result = ToolDTO.fromModel(updated);
        return ResponseEntity.ok(result);
    }
}
