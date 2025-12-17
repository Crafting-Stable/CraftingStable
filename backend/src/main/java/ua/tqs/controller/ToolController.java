package ua.tqs.controller;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ua.tqs.dto.ToolDTO;
import ua.tqs.dto.RentResponseDTO;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.service.RentService;
import ua.tqs.service.ToolService;
import ua.tqs.service.UserDetailsServiceImpl;

@RestController
@RequestMapping("/api/tools")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ToolController {

    private static final String AVAILABLE_KEY = "available";
    private static final String REASON_KEY = "reason";

    private final ToolService toolService;
    private final RentService rentService;
    private final UserDetailsServiceImpl userDetailsService;

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
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/available")
    public ResponseEntity<List<ToolDTO>> listAvailable() {
        List<ToolDTO> dtos = toolService.listAvailable()
                .stream()
                .map(ToolDTO::fromModel)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ToolDTO>> findByType(@PathVariable String type) {
        List<ToolDTO> dtos = toolService.findByType(type)
                .stream()
                .map(ToolDTO::fromModel)
                .toList();
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
        return ResponseEntity.ok().build();
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

    @GetMapping("/{id}/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @PathVariable Long id,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @AuthenticationPrincipal UserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();

        try {
            Tool tool = toolService.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Tool not found"));

            Long userId = userDetailsService.getUserId(userDetails);
            boolean isOwner = tool.getOwnerId().equals(userId);

            if (isOwner) {
                response.put(AVAILABLE_KEY, false);
                response.put(REASON_KEY, "You cannot rent your own tool");
                return ResponseEntity.ok(response);
            }

            // estados que bloqueiam tudo, independentemente de datas
            if (tool.getStatus() == ToolStatus.UNDER_MAINTENANCE) {
                response.put(AVAILABLE_KEY, false);
                response.put(REASON_KEY, "A ferramenta está em manutenção");
                return ResponseEntity.ok(response);
            }

            if (tool.getStatus() == ToolStatus.INACTIVE) {
                response.put(AVAILABLE_KEY, false);
                response.put(REASON_KEY, "A ferramenta está inativa");
                return ResponseEntity.ok(response);
            }

            LocalDateTime start = LocalDateTime.parse(startDate);
            LocalDateTime end = LocalDateTime.parse(endDate);

            // Mesmo que o estado esteja RENTED, só bloqueia se houver overlap
            boolean available = rentService.checkAvailability(id, start, end);

            response.put(AVAILABLE_KEY, available);
            if (!available) {
                response.put(REASON_KEY, "A ferramenta já está reservada para o período selecionado");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put(AVAILABLE_KEY, false);
            response.put(REASON_KEY, "Erro ao verificar disponibilidade: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}/blocked-dates")
    public ResponseEntity<List<RentResponseDTO>> getBlockedDates(@PathVariable Long id) {
        // devolve apenas rents APPROVED + ACTIVE (mesmo conjunto usado em checkAvailability)
        List<Rent> rents = rentService.findBlockingRentsForTool(id);
        List<RentResponseDTO> dtos = rents.stream()
                .map(r -> new RentResponseDTO(
                        r.getId(),
                        r.getToolId(),
                        r.getUserId(),
                        r.getStatus() != null ? r.getStatus().name() : null,
                        r.getStartDate(),
                        r.getEndDate(),
                        r.getMessage()
                ))
                .toList();

        return ResponseEntity.ok(dtos);
    }
}
