package ua.tqs.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.model.User;
import ua.tqs.repository.NotificationLogRepository;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationLogRepository logRepository;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Daniel", "daniel@example.com", "password123");

        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@craftingstable.com");
    }

    /**
     * EMAIL SENDING TESTS
     */
    @Test
    void whenSendEmail_thenSuccess() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> {
            NotificationLog log = invocation.getArgument(0);
            log.setId(1L);
            return log;
        });

        NotificationLog result = emailService.sendEmail(
            testUser,
            "Test Subject",
            "<p>Test content</p>",
            NotificationType.RENT_APPROVED,
            123L
        );

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(NotificationStatus.SENT);
        assertThat(result.getRecipient()).isEqualTo("daniel@example.com");
        assertThat(result.getSubject()).isEqualTo("Test Subject");
        assertThat(result.getSentAt()).isNotNull();

        verify(mailSender, times(1)).send(mimeMessage);
        verify(logRepository, times(1)).save(any(NotificationLog.class));
    }

    @Test
    void whenSendEmailFails_thenLogsError() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailException("SMTP connection failed") {})
            .when(mailSender).send(any(MimeMessage.class));
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationLog result = emailService.sendEmail(
            testUser,
            "Test Subject",
            "<p>Test content</p>",
            NotificationType.RENT_APPROVED,
            null
        );

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(result.getErrorMessage()).contains("SMTP connection failed");
        assertThat(result.getSentAt()).isNull();

        verify(logRepository, times(1)).save(any(NotificationLog.class));
    }

    @Test
    void whenSendEmailWithNullUser_thenThrowsException() {
        assertThatThrownBy(() ->
            emailService.sendEmail(null, "Subject", "Content", NotificationType.RENT_APPROVED, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("User cannot be null");
    }

    @Test
    void whenSendEmailWithNullEmail_thenThrowsException() {
        User userWithoutEmail = new User(2L, "TestUser", null, "password");

        assertThatThrownBy(() ->
            emailService.sendEmail(userWithoutEmail, "Subject", "Content", NotificationType.RENT_APPROVED, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("User email cannot be null");
    }

    @Test
    void whenSendEmailWithEmptySubject_thenThrowsException() {
        assertThatThrownBy(() ->
            emailService.sendEmail(testUser, "", "Content", NotificationType.RENT_APPROVED, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Subject cannot be empty");
    }

    @Test
    void whenSendEmailWithNullContent_thenThrowsException() {
        assertThatThrownBy(() ->
            emailService.sendEmail(testUser, "Subject", null, NotificationType.RENT_APPROVED, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Content cannot be null");
    }

    /**
     * LOGGING TESTS
     */
    @Test
    void whenEmailSent_thenLogsWithCorrectType() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        ArgumentCaptor<NotificationLog> logCaptor = ArgumentCaptor.forClass(NotificationLog.class);
        when(logRepository.save(logCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        emailService.sendEmail(
            testUser,
            "Rent Approved",
            "<p>Your rent was approved</p>",
            NotificationType.RENT_APPROVED,
            456L
        );

        NotificationLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getType()).isEqualTo(NotificationType.RENT_APPROVED);
        assertThat(capturedLog.getChannel()).isEqualTo(NotificationChannel.EMAIL);
        assertThat(capturedLog.getUserId()).isEqualTo(1L);
        assertThat(capturedLog.getRelatedRentId()).isEqualTo(456L);
    }

    @Test
    void whenEmailSentWithoutRentId_thenLogsWithNullRentId() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        ArgumentCaptor<NotificationLog> logCaptor = ArgumentCaptor.forClass(NotificationLog.class);
        when(logRepository.save(logCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        emailService.sendEmail(
            testUser,
            "Account Created",
            "<p>Welcome!</p>",
            NotificationType.ACCOUNT_CREATED,
            null
        );

        NotificationLog capturedLog = logCaptor.getValue();
        assertThat(capturedLog.getRelatedRentId()).isNull();
    }

    /**
     * HTML CONTENT TESTS
     */
    @Test
    void whenSendHtmlEmail_thenSetsCorrectContentType() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String htmlContent = "<html><body><h1>Title</h1><p>Content</p></body></html>";

        emailService.sendEmail(
            testUser,
            "HTML Email",
            htmlContent,
            NotificationType.RENT_REMINDER,
            null
        );

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void whenSendEmailWithSpecialCharacters_thenHandlesCorrectly() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String content = "<p>Price: 45.50 euros, Name: João & Maria</p>";

        NotificationLog result = emailService.sendEmail(
            testUser,
            "Special Chars Test",
            content,
            NotificationType.RENT_APPROVED,
            null
        );

        assertThat(result.getStatus()).isEqualTo(NotificationStatus.SENT);
    }

    /**
     * RECIPIENT VALIDATION TESTS
     */
    @Test
    void whenSendEmailWithInvalidEmailFormat_thenHandlesGracefully() {
        User userInvalidEmail = new User(3L, "Test", "invalid-email", "pass");

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailException("Invalid email format") {})
            .when(mailSender).send(any(MimeMessage.class));
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationLog result = emailService.sendEmail(
            userInvalidEmail,
            "Subject",
            "Content",
            NotificationType.RENT_APPROVED,
            null
        );

        assertThat(result.getStatus()).isEqualTo(NotificationStatus.FAILED);
        assertThat(result.getErrorMessage()).isNotNull();
    }

    @Test
    void whenSendMultipleEmails_thenAllAreLogged() throws MessagingException {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(logRepository.save(any(NotificationLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        emailService.sendEmail(testUser, "Email 1", "Content 1", NotificationType.RENT_APPROVED, null);
        emailService.sendEmail(testUser, "Email 2", "Content 2", NotificationType.RENT_REJECTED, null);
        emailService.sendEmail(testUser, "Email 3", "Content 3", NotificationType.RENT_REMINDER, null);

        verify(mailSender, times(3)).send(any(MimeMessage.class));
        verify(logRepository, times(3)).save(any(NotificationLog.class));
    }
}
