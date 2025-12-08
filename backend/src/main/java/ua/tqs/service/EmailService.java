package ua.tqs.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.model.User;
import ua.tqs.repository.NotificationLogRepository;

import java.time.LocalDateTime;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private NotificationLogRepository logRepository;

    @Value("${app.email.from:noreply@craftingstable.com}")
    private String fromEmail;

    public NotificationLog sendEmail(User user, String subject, String htmlContent,
                                      NotificationType type, Long relatedRentId) {
        validateInputs(user, subject, htmlContent);

        NotificationLog log = NotificationLog.builder()
            .userId(user.getId())
            .type(type)
            .channel(NotificationChannel.EMAIL)
            .status(NotificationStatus.PENDING)
            .recipient(user.getEmail())
            .subject(subject)
            .relatedRentId(relatedRentId)
            .build();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.setStatus(NotificationStatus.SENT);
            log.setSentAt(LocalDateTime.now());

        } catch (MessagingException | MailException e) {
            log.setStatus(NotificationStatus.FAILED);
            log.setErrorMessage(e.getMessage());
        }

        return logRepository.save(log);
    }

    private void validateInputs(User user, String subject, String htmlContent) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (user.getEmail() == null) {
            throw new IllegalArgumentException("User email cannot be null");
        }
        if (subject == null || subject.trim().isEmpty()) {
            throw new IllegalArgumentException("Subject cannot be empty");
        }
        if (htmlContent == null) {
            throw new IllegalArgumentException("Content cannot be null");
        }
    }
}
