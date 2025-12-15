package ua.tqs.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ua.tqs.dto.AdminStatsDTO;
import ua.tqs.dto.ClientStatsDTO;
import ua.tqs.enums.UserRole;
import ua.tqs.model.User;
import ua.tqs.service.UserService;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        userService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/total-users")
    public ResponseEntity<Long> getTotalUsers() {
        long totalUsers = userService.getTotalUsers();
        return ResponseEntity.ok(totalUsers);
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getUserCount() {
        long adminCount = userService.listAll().stream()
                .filter(u -> u.getType() != null && u.getType() == UserRole.ADMIN)
                .count();
        return ResponseEntity.ok(adminCount);
    }

    @GetMapping("/stats/admin")
    public ResponseEntity<AdminStatsDTO> getAdminStats() {
        return ResponseEntity.ok(userService.getAdminStats());
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ClientStatsDTO> getClientStats(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getClientStats(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable("id") Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<User> activateUser(@PathVariable("id") Long id) {
        User user = userService.activateUser(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<User> deactivateUser(@PathVariable("id") Long id) {
        User user = userService.deactivateUser(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> changeUserRole(@PathVariable("id") Long id, @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().build();
        }

        UserRole newRole;
        try {
            newRole = UserRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        User user = userService.changeUserRole(id, newRole);
        return ResponseEntity.ok(user);
    }
}