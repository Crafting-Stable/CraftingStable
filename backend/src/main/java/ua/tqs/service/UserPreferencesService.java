package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.UserNotificationPreferences;
import ua.tqs.repository.UserNotificationPreferencesRepository;

import java.util.Optional;

@Service
public class UserPreferencesService {

    @Autowired
    private UserNotificationPreferencesRepository repository;

    public UserNotificationPreferences createDefaultPreferences(Long userId) {
        UserNotificationPreferences preferences = UserNotificationPreferences.builder()
            .userId(userId)
            .emailEnabled(true)
            .rentApprovedEnabled(true)
            .rentRejectedEnabled(true)
            .rentCanceledEnabled(true)
            .rentReminderEnabled(true)
            .rentFinishedEnabled(true)
            .build();

        return repository.save(preferences);
    }

    public boolean wantsNotification(Long userId, NotificationType type) {
        Optional<UserNotificationPreferences> prefsOpt = repository.findByUserId(userId);

        UserNotificationPreferences prefs;
        if (prefsOpt.isEmpty()) {
            prefs = createDefaultPreferences(userId);
        } else {
            prefs = prefsOpt.get();
        }

        if (!prefs.getEmailEnabled()) {
            return false;
        }

        return switch (type) {
            case RENT_APPROVED -> prefs.getRentApprovedEnabled();
            case RENT_REJECTED -> prefs.getRentRejectedEnabled();
            case RENT_CANCELED -> prefs.getRentCanceledEnabled();
            case RENT_REMINDER -> prefs.getRentReminderEnabled();
            case RENT_FINISHED -> prefs.getRentFinishedEnabled();
            default -> false;
        };
    }

    public UserNotificationPreferences updatePreferences(Long userId, UserNotificationPreferences updates) {
        UserNotificationPreferences existing = repository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Preferences not found for user: " + userId));

        if (updates.getEmailEnabled() != null) {
            existing.setEmailEnabled(updates.getEmailEnabled());
        }
        if (updates.getRentApprovedEnabled() != null) {
            existing.setRentApprovedEnabled(updates.getRentApprovedEnabled());
        }
        if (updates.getRentRejectedEnabled() != null) {
            existing.setRentRejectedEnabled(updates.getRentRejectedEnabled());
        }
        if (updates.getRentCanceledEnabled() != null) {
            existing.setRentCanceledEnabled(updates.getRentCanceledEnabled());
        }
        if (updates.getRentReminderEnabled() != null) {
            existing.setRentReminderEnabled(updates.getRentReminderEnabled());
        }
        if (updates.getRentFinishedEnabled() != null) {
            existing.setRentFinishedEnabled(updates.getRentFinishedEnabled());
        }

        return repository.save(existing);
    }

    public Optional<UserNotificationPreferences> getPreferences(Long userId) {
        return repository.findByUserId(userId);
    }
}
