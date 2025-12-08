package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationType;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.NotificationTemplate;
import ua.tqs.repository.NotificationTemplateRepository;

import java.util.Map;
import java.util.Optional;

@Service
public class NotificationTemplateService {

    @Autowired
    private NotificationTemplateRepository repository;

    /**
     * Get active template by type and channel
     * @param type Notification type
     * @param channel Notification channel (EMAIL, SMS, etc.)
     * @return Optional containing the template if found
     */
    public Optional<NotificationTemplate> getTemplate(NotificationType type, NotificationChannel channel) {
        return repository.findByTypeAndChannelAndActiveTrue(type, channel);
    }

    /**
     * Render template content with variables
     * @param template The template to render
     * @param variables Map of variable names to values
     * @return Rendered content with placeholders replaced
     */
    public String renderTemplate(NotificationTemplate template, Map<String, Object> variables) {
        return template.render(variables);
    }

    /**
     * Render template subject with variables
     * @param template The template to render
     * @param variables Map of variable names to values
     * @return Rendered subject with placeholders replaced
     */
    public String renderSubject(NotificationTemplate template, Map<String, Object> variables) {
        if (variables == null || variables.isEmpty()) {
            return template.getSubject();
        }

        String result = template.getSubject();
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? entry.getValue().toString() : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }

    /**
     * Create a new notification template
     * @param template Template to create
     * @return Created template
     */
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        return repository.save(template);
    }

    /**
     * Update an existing notification template
     * @param id Template ID
     * @param updates Template with updated fields
     * @return Updated template
     */
    public NotificationTemplate updateTemplate(Long id, NotificationTemplate updates) {
        NotificationTemplate existing = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Template not found with id: " + id));

        if (updates.getSubject() != null) {
            existing.setSubject(updates.getSubject());
        }
        if (updates.getContent() != null) {
            existing.setContent(updates.getContent());
        }
        if (updates.getType() != null) {
            existing.setType(updates.getType());
        }
        if (updates.getChannel() != null) {
            existing.setChannel(updates.getChannel());
        }
        if (updates.getActive() != null) {
            existing.setActive(updates.getActive());
        }

        return repository.save(existing);
    }

    /**
     * Deactivate a notification template
     * @param id Template ID
     */
    public void deactivateTemplate(Long id) {
        NotificationTemplate template = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Template not found with id: " + id));

        template.setActive(false);
        repository.save(template);
    }
}
