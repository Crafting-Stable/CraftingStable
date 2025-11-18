package ua.tqs.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.FerramentaDTO;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Ferramenta;
import ua.tqs.service.FerramentaService;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ferramentas")
@RequiredArgsConstructor
public class FerramentaController {

    private final FerramentaService ferramentaService;

    @PostMapping
    public ResponseEntity<FerramentaDTO> criar(@Valid @RequestBody FerramentaDTO dto) {
        Ferramenta toSave = dto.toModel();
        Ferramenta created = ferramentaService.criar(toSave);
        FerramentaDTO result = FerramentaDTO.fromModel(created);
        return ResponseEntity.created(URI.create("/api/ferramentas/" + result.getId())).body(result);
    }

    @GetMapping
    public ResponseEntity<List<FerramentaDTO>> listarTodas() {
        List<FerramentaDTO> dtos = ferramentaService.listarTodas()
                .stream()
                .map(FerramentaDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/disponiveis")
    public ResponseEntity<List<FerramentaDTO>> listarDisponiveis() {
        List<FerramentaDTO> dtos = ferramentaService.listarDisponiveis()
                .stream()
                .map(FerramentaDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<FerramentaDTO>> buscarPorTipo(@PathVariable String tipo) {
        List<FerramentaDTO> dtos = ferramentaService.buscarPorTipo(tipo)
                .stream()
                .map(FerramentaDTO::fromModel)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FerramentaDTO> buscarPorId(@PathVariable Long id) {
        Ferramenta f = ferramentaService.buscarPorId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ferramenta não encontrada: " + id));
        return ResponseEntity.ok(FerramentaDTO.fromModel(f));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagar(@PathVariable Long id) {
        ferramentaService.apagar(id);
        return ResponseEntity.noContent().build();
    }
}
