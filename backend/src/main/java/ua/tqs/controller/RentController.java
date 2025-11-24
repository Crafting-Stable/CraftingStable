package ua.tqs.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.model.Rent;
import ua.tqs.service.RentService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rents")
@RequiredArgsConstructor
public class RentController {

    private final RentService rentService;

    @PostMapping
    public ResponseEntity<Rent> create(@Valid @RequestBody Rent rent) {
        Rent created = rentService.create(rent);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Rent>> listAll() {
        return ResponseEntity.ok(rentService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rent> findById(@PathVariable Long id) {
        return rentService.findById(id)
                .map(r -> ResponseEntity.ok(r))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        rentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/interval")
    public ResponseEntity<List<Rent>> findByInterval(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(rentService.findByInterval(from, to));
    }
}