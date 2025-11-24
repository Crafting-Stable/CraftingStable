package ua.tqs.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.AdminStatsDTO;
import ua.tqs.dto.ClientStatsDTO;
import ua.tqs.model.User;
import ua.tqs.service.UserService;

import java.util.List;

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
        return ResponseEntity.ok(userService.getAllUsers());
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