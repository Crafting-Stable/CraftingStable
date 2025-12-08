package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationStatus;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationLog;
import ua.tqs.model.NotificationTemplate;
import ua.tqs.model.User;
import ua.tqs.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationTemplateService templateService;

    @Mock
    private EmailService emailService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPreferencesService userPreferencesService;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private NotificationTemplate testTemplate;
    private Map<String, Object> testVariables;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Daniel", "daniel@example.com", "password123");

        testTemplate = NotificationTemplate.builder()
            .id(1L)
            .type(NotificationType.RENT_APPROVED)
            .channel(NotificationChannel.EMAIL)
            .subject("Reserva Aprovada - {{toolName}}")
            .content("Olá {{userName}}, a sua reserva foi aprovada!")
            .active(true)
            .build();

        testVariables = new HashMap<>();
        testVariables.put("userName", "Daniel");
        testVariables.put("toolName", "Berbequim");
        testVariables.put("rentId", 123L);
    }

    /**
     * SUCCESSFUL NOTIFICATION TESTS
     */
    @Test
    void whenSendNotification_thenSuccess() {
        NotificationLog expectedLog = NotificationLog.builder()
            .userId(1L)
            .status(NotificationStatus.SENT)
            .build();

        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));
        when(templateService.renderSubject(testTemplate, testVariables))
            .thenReturn("Reserva Aprovada - Berbequim");
        when(templateService.renderTemplate(testTemplate, testVariables))
            .thenReturn("Olá Daniel, a sua reserva foi aprovada!");
        when(emailService.sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.RENT_APPROVED), eq(123L)))
            .thenReturn(expectedLog);

        notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, testVariables, 123L);

        verify(userRepository, times(1)).findById(1L);
        verify(templateService, times(1)).getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL);
        verify(templateService, times(1)).renderSubject(testTemplate, testVariables);
        verify(templateService, times(1)).renderTemplate(testTemplate, testVariables);
        verify(emailService, times(1)).sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.RENT_APPROVED), eq(123L));
    }

    @Test
    void whenSendNotificationWithNullRentId_thenSuccess() {
        NotificationLog expectedLog = NotificationLog.builder()
            .userId(1L)
            .status(NotificationStatus.SENT)
            .build();

        when(userPreferencesService.wantsNotification(1L, NotificationType.ACCOUNT_CREATED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.ACCOUNT_CREATED, NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));
        when(templateService.renderSubject(testTemplate, testVariables))
            .thenReturn("Welcome");
        when(templateService.renderTemplate(testTemplate, testVariables))
            .thenReturn("Welcome Daniel!");
        when(emailService.sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.ACCOUNT_CREATED), isNull()))
            .thenReturn(expectedLog);

        notificationService.sendNotification(1L, NotificationType.ACCOUNT_CREATED, testVariables, null);

        verify(emailService, times(1)).sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.ACCOUNT_CREATED), isNull());
    }

    /**
     * USER NOT FOUND TESTS
     */
    @Test
    void whenUserNotFound_thenThrowsException() {
        when(userPreferencesService.wantsNotification(999L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            notificationService.sendNotification(999L, NotificationType.RENT_APPROVED, testVariables, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("User not found");

        verify(templateService, never()).getTemplate(any(), any());
        verify(emailService, never()).sendEmail(any(), any(), any(), any(), any());
    }

    /**
     * TEMPLATE NOT FOUND TESTS
     */
    @Test
    void whenTemplateNotFound_thenThrowsException() {
        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, testVariables, null)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Template not found");

        verify(emailService, never()).sendEmail(any(), any(), any(), any(), any());
    }

    /**
     * RENDERING TESTS
     */
    @Test
    void whenSendNotification_thenRendersSubjectAndContent() {
        NotificationLog expectedLog = NotificationLog.builder()
            .userId(1L)
            .status(NotificationStatus.SENT)
            .build();

        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));
        when(templateService.renderSubject(testTemplate, testVariables))
            .thenReturn("Reserva Aprovada - Berbequim");
        when(templateService.renderTemplate(testTemplate, testVariables))
            .thenReturn("Olá Daniel, a sua reserva foi aprovada!");
        when(emailService.sendEmail(eq(testUser), eq("Reserva Aprovada - Berbequim"),
                eq("Olá Daniel, a sua reserva foi aprovada!"),
                eq(NotificationType.RENT_APPROVED), isNull()))
            .thenReturn(expectedLog);

        notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, testVariables, null);

        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);

        verify(emailService).sendEmail(eq(testUser), subjectCaptor.capture(),
                contentCaptor.capture(), eq(NotificationType.RENT_APPROVED), isNull());

        assertThat(subjectCaptor.getValue()).isEqualTo("Reserva Aprovada - Berbequim");
        assertThat(contentCaptor.getValue()).isEqualTo("Olá Daniel, a sua reserva foi aprovada!");
    }

    /**
     * USER PREFERENCES TESTS
     */
    @Test
    void whenUserDoesNotWantNotification_thenDoNotSend() {
        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(false);

        notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, testVariables, 123L);

        verify(userRepository, never()).findById(any());
        verify(templateService, never()).getTemplate(any(), any());
        verify(emailService, never()).sendEmail(any(), any(), any(), any(), any());
    }

    /**
     * NULL/EMPTY VARIABLES TESTS
     */
    @Test
    void whenSendNotificationWithNullVariables_thenUsesEmptyMap() {
        NotificationLog expectedLog = NotificationLog.builder()
            .userId(1L)
            .status(NotificationStatus.SENT)
            .build();

        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));
        when(templateService.renderSubject(eq(testTemplate), any()))
            .thenReturn("Subject");
        when(templateService.renderTemplate(eq(testTemplate), any()))
            .thenReturn("Content");
        when(emailService.sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.RENT_APPROVED), isNull()))
            .thenReturn(expectedLog);

        notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, null, null);

        verify(templateService, times(1)).renderSubject(eq(testTemplate), any());
        verify(templateService, times(1)).renderTemplate(eq(testTemplate), any());
    }

    @Test
    void whenSendNotificationWithEmptyVariables_thenSuccess() {
        NotificationLog expectedLog = NotificationLog.builder()
            .userId(1L)
            .status(NotificationStatus.SENT)
            .build();

        when(userPreferencesService.wantsNotification(1L, NotificationType.RENT_APPROVED)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(templateService.getTemplate(NotificationType.RENT_APPROVED, NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));
        when(templateService.renderSubject(eq(testTemplate), any()))
            .thenReturn("Subject");
        when(templateService.renderTemplate(eq(testTemplate), any()))
            .thenReturn("Content");
        when(emailService.sendEmail(eq(testUser), anyString(), anyString(),
                eq(NotificationType.RENT_APPROVED), isNull()))
            .thenReturn(expectedLog);

        notificationService.sendNotification(1L, NotificationType.RENT_APPROVED, new HashMap<>(), null);

        verify(emailService, times(1)).sendEmail(any(), anyString(), anyString(), any(), any());
    }
}
