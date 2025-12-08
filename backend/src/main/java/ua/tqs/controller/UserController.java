package ua.tqs.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.AdminStatsDTO;
import ua.tqs.dto.ClientStatsDTO;
import ua.tqs.model.User;
import ua.tqs.service.UserService;

import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.listAll());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.create(user);
        URI location = URI.create("/api/users/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        Optional<User> opt = userService.findById(id);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total-users")
    public ResponseEntity<Long> getTotalUsers() {
        long totalUsers = userService.getTotalUsers();
        return ResponseEntity.ok(totalUsers);
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<AdminStatsDTO> getAdminStats() {
        return ResponseEntity.ok(userService.getAdminStats());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ClientStatsDTO> getClientStats(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getClientStats(id));
    }
}