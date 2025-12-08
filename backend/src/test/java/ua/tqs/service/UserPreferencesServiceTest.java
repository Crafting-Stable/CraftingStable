package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.UserNotificationPreferences;
import ua.tqs.repository.UserNotificationPreferencesRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserPreferencesServiceTest {

    @Mock
    private UserNotificationPreferencesRepository repository;

    @InjectMocks
    private UserPreferencesService service;

    private UserNotificationPreferences testPreferences;

    @BeforeEach
    void setUp() {
        testPreferences = UserNotificationPreferences.builder()
            .id(1L)
            .userId(100L)
            .emailEnabled(true)
            .rentApprovedEnabled(true)
            .rentRejectedEnabled(true)
            .rentCanceledEnabled(false)
            .rentReminderEnabled(true)
            .rentFinishedEnabled(true)
            .build();
    }

    /**
     * CREATE DEFAULT PREFERENCES TESTS
     */
    @Test
    void whenCreateDefaultPreferences_thenAllEnabled() {
        when(repository.save(any(UserNotificationPreferences.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        UserNotificationPreferences created = service.createDefaultPreferences(200L);

        assertThat(created.getUserId()).isEqualTo(200L);
        assertThat(created.getEmailEnabled()).isTrue();
        assertThat(created.getRentApprovedEnabled()).isTrue();
        assertThat(created.getRentRejectedEnabled()).isTrue();
        assertThat(created.getRentCanceledEnabled()).isTrue();
        assertThat(created.getRentReminderEnabled()).isTrue();
        assertThat(created.getRentFinishedEnabled()).isTrue();

        verify(repository, times(1)).save(any(UserNotificationPreferences.class));
    }

    /**
     * WANTS NOTIFICATION TESTS
     */
    @Test
    void whenUserWantsRentApproved_andPreferencesExist_thenReturnTrue() {
        when(repository.findByUserId(100L)).thenReturn(Optional.of(testPreferences));

        boolean wants = service.wantsNotification(100L, NotificationType.RENT_APPROVED);

        assertThat(wants).isTrue();
    }

    @Test
    void whenUserDoesNotWantRentCanceled_andPreferencesExist_thenReturnFalse() {
        when(repository.findByUserId(100L)).thenReturn(Optional.of(testPreferences));

        boolean wants = service.wantsNotification(100L, NotificationType.RENT_CANCELED);

        assertThat(wants).isFalse();
    }

    @Test
    void whenPreferencesNotExist_thenCreateDefaultAndReturnTrue() {
        when(repository.findByUserId(300L)).thenReturn(Optional.empty());
        when(repository.save(any(UserNotificationPreferences.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        boolean wants = service.wantsNotification(300L, NotificationType.RENT_APPROVED);

        assertThat(wants).isTrue();
        verify(repository, times(1)).save(any(UserNotificationPreferences.class));
    }

    @Test
    void whenEmailDisabled_thenReturnFalse() {
        testPreferences.setEmailEnabled(false);
        when(repository.findByUserId(100L)).thenReturn(Optional.of(testPreferences));

        boolean wants = service.wantsNotification(100L, NotificationType.RENT_APPROVED);

        assertThat(wants).isFalse();
    }

    /**
     * UPDATE PREFERENCES TESTS
     */
    @Test
    void whenUpdatePreferences_thenSuccess() {
        UserNotificationPreferences updates = UserNotificationPreferences.builder()
            .rentApprovedEnabled(false)
            .rentReminderEnabled(false)
            .build();

        when(repository.findByUserId(100L)).thenReturn(Optional.of(testPreferences));
        when(repository.save(any(UserNotificationPreferences.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        UserNotificationPreferences updated = service.updatePreferences(100L, updates);

        assertThat(updated.getRentApprovedEnabled()).isFalse();
        assertThat(updated.getRentReminderEnabled()).isFalse();
        assertThat(updated.getRentRejectedEnabled()).isTrue();
        verify(repository, times(1)).save(testPreferences);
    }

    @Test
    void whenUpdateNonExistentPreferences_thenThrowsException() {
        when(repository.findByUserId(999L)).thenReturn(Optional.empty());

        UserNotificationPreferences updates = UserNotificationPreferences.builder()
            .rentApprovedEnabled(false)
            .build();

        assertThatThrownBy(() -> service.updatePreferences(999L, updates))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Preferences not found");
    }

    /**
     * GET PREFERENCES TESTS
     */
    @Test
    void whenGetPreferences_andExist_thenReturnPreferences() {
        when(repository.findByUserId(100L)).thenReturn(Optional.of(testPreferences));

        Optional<UserNotificationPreferences> prefs = service.getPreferences(100L);

        assertThat(prefs).isPresent();
        assertThat(prefs.get().getUserId()).isEqualTo(100L);
    }

    @Test
    void whenGetPreferences_andNotExist_thenReturnEmpty() {
        when(repository.findByUserId(999L)).thenReturn(Optional.empty());

        Optional<UserNotificationPreferences> prefs = service.getPreferences(999L);

        assertThat(prefs).isEmpty();
    }
}
