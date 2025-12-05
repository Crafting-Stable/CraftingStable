package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.UserRole;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword123");
        testUser.setName("Test User");
        testUser.setRole(UserRole.CUSTOMER);
    }

    /**
     * USER CRUD TESTS
     */
    @Test
    void whenCreateUser_thenSuccess() {
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User created = userService.create(testUser);

        assertThat(created).isNotNull();
        assertThat(created.getEmail()).isEqualTo("test@example.com");
        assertThat(created.getRole()).isEqualTo(UserRole.CUSTOMER);
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    void whenFindUserById_thenReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        Optional<User> found = userService.findById(1L);

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void whenFindUserByIdNotExists_thenReturnEmpty() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        Optional<User> found = userService.findById(999L);

        assertThat(found).isEmpty();
    }

    @Test
    void whenFindUserByEmail_thenReturnUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        Optional<User> found = userService.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test User");
    }

    @Test
    void whenFindUserByEmailNotExists_thenReturnEmpty() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        Optional<User> found = userService.findByEmail("nonexistent@example.com");

        assertThat(found).isEmpty();
    }

    @Test
    void whenListAllUsers_thenReturnAllUsers() {
        User user2 = new User();
        user2.setEmail("user2@example.com");
        List<User> users = Arrays.asList(testUser, user2);
        
        when(userRepository.findAll()).thenReturn(users);

        List<User> found = userService.listAll();

        assertThat(found).hasSize(2);
        assertThat(found).contains(testUser, user2);
    }

    @Test
    void whenUpdateUser_thenSuccess() {
        User updates = new User();
        updates.setName("Updated Name");
        updates.setEmail("updated@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updated = userService.update(1L, updates);

        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getEmail()).isEqualTo("updated@example.com");
    }

    @Test
    void whenUpdateNonExistentUser_thenThrowException() {
        User updates = new User();
        updates.setName("New Name");

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.update(999L, updates))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void whenDeleteUser_thenSuccess() {
        doNothing().when(userRepository).deleteById(1L);

        userService.delete(1L);

        verify(userRepository, times(1)).deleteById(1L);
    }

    /**
     * USER ROLE TESTS
     */
    @Test
    void whenUserCreated_defaultRoleIsCustomer() {
        User newUser = new User();
        newUser.setEmail("new@example.com");
        newUser.setPassword("password");
        newUser.setName("New User");
        // Role not explicitly set

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            if (u.getRole() == null) {
                u.setRole(UserRole.CUSTOMER);
            }
            return u;
        });

        User created = userService.create(newUser);

        assertThat(created.getRole()).isEqualTo(UserRole.CUSTOMER);
    }

    @Test
    void whenUpdateUserRole_thenRoleChanges() {
        User updates = new User();
        updates.setRole(UserRole.ADMIN);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updated = userService.update(1L, updates);

        assertThat(updated.getRole()).isEqualTo(UserRole.ADMIN);
    }

    /**
     * EMAIL UNIQUENESS TESTS
     */
    @Test
    void whenCreateUserWithDuplicateEmail_thenThrowException() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenThrow(
                new org.springframework.dao.DataIntegrityViolationException("Duplicate email")
        );

        User duplicateUser = new User();
        duplicateUser.setEmail("test@example.com");
        duplicateUser.setPassword("password");
        duplicateUser.setName("Duplicate");

        assertThatThrownBy(() -> userService.create(duplicateUser))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    /**
     * PASSWORD UPDATE TESTS
     */
    @Test
    void whenUpdatePassword_thenPasswordChanges() {
        User updates = new User();
        updates.setPassword("newHashedPassword");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updated = userService.update(1L, updates);

        assertThat(updated.getPassword()).isEqualTo("newHashedPassword");
    }

    @Test
    void whenUpdateOnlyName_passwordRemainsUnchanged() {
        String originalPassword = testUser.getPassword();
        User updates = new User();
        updates.setName("New Name Only");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        User updated = userService.update(1L, updates);

        assertThat(updated.getName()).isEqualTo("New Name Only");
        assertThat(updated.getPassword()).isEqualTo(originalPassword);
    }
}
