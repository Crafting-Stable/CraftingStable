package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationTemplate;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationTemplateService templateService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPreferencesService userPreferencesService;

    public void sendNotification(Long userId, NotificationType type,
                                  Map<String, Object> variables, Long relatedRentId) {
        if (!userPreferencesService.wantsNotification(userId, type)) {
            return;
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        NotificationTemplate template = templateService
            .getTemplate(type, NotificationChannel.EMAIL)
            .orElseThrow(() -> new IllegalArgumentException(
                "Template not found for type: " + type + " and channel: " + NotificationChannel.EMAIL));

        Map<String, Object> safeVariables = variables != null ? variables : new HashMap<>();

        String subject = templateService.renderSubject(template, safeVariables);
        String content = templateService.renderTemplate(template, safeVariables);

        emailService.sendEmail(user, subject, content, type, relatedRentId);
    }
}
