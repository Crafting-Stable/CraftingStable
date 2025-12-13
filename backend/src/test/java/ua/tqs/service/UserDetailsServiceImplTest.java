package ua.tqs.service;

import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import ua.tqs.enums.UserRole;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void whenValidUsername_thenUserShouldBeFound() {
        User user = new User();
        user.setEmail("test@user.com");
        user.setPassword("password");
        user.setType(UserRole.CUSTOMER);

        when(userRepository.findByEmail("test@user.com")).thenReturn(Optional.of(user));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@user.com");
        assertEquals("test@user.com", userDetails.getUsername());
        assertTrue(userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER")));
    }

    @Test
    void whenInvalidUsername_thenThrowUsernameNotFoundException() {
        when(userRepository.findByEmail("nonexistent@user.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("nonexistent@user.com");
        });
    }

    @Test
    void whenUserExists_thenReturnTrue() {
        when(userRepository.findByEmail("test@user.com")).thenReturn(Optional.of(new User()));
        assertTrue(userDetailsService.userExists("test@user.com"));
    }

    @Test
    void whenUserDoesNotExist_thenReturnFalse() {
        when(userRepository.findByEmail("nonexistent@user.com")).thenReturn(Optional.empty());
        assertFalse(userDetailsService.userExists("nonexistent@user.com"));
    }

    @Test
    void whenRegisterUserWithValidRole_thenUserIsSaved() {
        when(userRepository.findByEmail("new@user.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        userDetailsService.registerUser("new@user.com", "password", "New User", "CUSTOMER");
        verify(userRepository, times(1)).save(any(User.class));
        verify(passwordEncoder, times(1)).encode("password");
    }

    @Test
    void whenRegisterUserWithInvalidRole_thenThrowIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> {
            userDetailsService.registerUser("new@user.com", "password", "New User", "INVALID_ROLE");
        });
    }

    @Test
    void whenRegisterExistingUser_thenThrowIllegalArgumentException() {
        when(userRepository.findByEmail("existing@user.com")).thenReturn(Optional.of(new User()));
        assertThrows(IllegalArgumentException.class, () -> {
            userDetailsService.registerUser("existing@user.com", "password", "Existing User", "CUSTOMER");
        });
    }

    @Test
    void whenGetUserId_thenReturnId() {
        User user = new User(1L, "Test User", "test@user.com", "password");
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("test@user.com");
        when(userRepository.findByEmail("test@user.com")).thenReturn(Optional.of(user));

        assertEquals(1L, userDetailsService.getUserId(userDetails));
    }

    @Test
    void whenGetUserName_thenReturnName() {
        User user = new User();
        user.setName("Test User");
        user.setEmail("test@user.com");
        UserDetails userDetails = mock(UserDetails.class);
        when(userDetails.getUsername()).thenReturn("test@user.com");
        when(userRepository.findByEmail("test@user.com")).thenReturn(Optional.of(user));

        assertEquals("Test User", userDetailsService.getUserName(userDetails));
    }
}
