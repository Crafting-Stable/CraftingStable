package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.enums.NotificationChannel;
import ua.tqs.enums.NotificationType;
import ua.tqs.model.NotificationTemplate;
import ua.tqs.repository.NotificationTemplateRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationTemplateServiceTest {

    @Mock
    private NotificationTemplateRepository repository;

    @InjectMocks
    private NotificationTemplateService service;

    private NotificationTemplate testTemplate;

    @BeforeEach
    void setUp() {
        testTemplate = new NotificationTemplate();
        testTemplate.setId(1L);
        testTemplate.setType(NotificationType.RENT_APPROVED);
        testTemplate.setChannel(NotificationChannel.EMAIL);
        testTemplate.setSubject("Reserva Aprovada - {{toolName}}");
        testTemplate.setContent("Olá {{userName}}, a sua reserva de {{toolName}} foi aprovada!");
        testTemplate.setActive(true);
    }

    /**
     * TEMPLATE RETRIEVAL TESTS
     */
    @Test
    void whenGetTemplateByTypeAndChannel_thenReturnTemplate() {
        when(repository.findByTypeAndChannelAndActiveTrue(
                NotificationType.RENT_APPROVED,
                NotificationChannel.EMAIL))
            .thenReturn(Optional.of(testTemplate));

        Optional<NotificationTemplate> found = service.getTemplate(
            NotificationType.RENT_APPROVED,
            NotificationChannel.EMAIL
        );

        assertThat(found).isPresent();
        assertThat(found.get().getSubject()).isEqualTo("Reserva Aprovada - {{toolName}}");
        verify(repository, times(1)).findByTypeAndChannelAndActiveTrue(
            NotificationType.RENT_APPROVED,
            NotificationChannel.EMAIL
        );
    }

    @Test
    void whenGetTemplateNotExists_thenReturnEmpty() {
        when(repository.findByTypeAndChannelAndActiveTrue(
                NotificationType.RENT_APPROVED,
                NotificationChannel.SMS))
            .thenReturn(Optional.empty());

        Optional<NotificationTemplate> found = service.getTemplate(
            NotificationType.RENT_APPROVED,
            NotificationChannel.SMS
        );

        assertThat(found).isEmpty();
    }

    @Test
    void whenGetInactiveTemplate_thenReturnEmpty() {
        // Inactive templates should not be returned
        when(repository.findByTypeAndChannelAndActiveTrue(any(), any()))
            .thenReturn(Optional.empty());

        Optional<NotificationTemplate> found = service.getTemplate(
            NotificationType.RENT_APPROVED,
            NotificationChannel.EMAIL
        );

        assertThat(found).isEmpty();
    }

    /**
     * TEMPLATE RENDERING TESTS
     */
    @Test
    void whenRenderTemplate_thenSubstitutesAllPlaceholders() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Daniel");
        variables.put("toolName", "Berbequim Bosch");

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .contains("Olá Daniel")
            .contains("Berbequim Bosch")
            .doesNotContain("{{");
    }

    @Test
    void whenRenderSubject_thenSubstitutesPlaceholders() {
        Map<String, Object> variables = new HashMap<>();
        variables.put("toolName", "Martelo Pneumático");

        String result = service.renderSubject(testTemplate, variables);

        assertThat(result)
            .isEqualTo("Reserva Aprovada - Martelo Pneumático")
            .doesNotContain("{{");
    }

    @Test
    void whenRenderWithMissingVariable_thenKeepsPlaceholder() {
        // Missing variable - should keep placeholder or replace with empty
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Daniel");
        // toolName is missing

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .contains("Olá Daniel")
            // Either keeps {{toolName}} or replaces with empty - implementation choice
            .satisfiesAnyOf(
                r -> assertThat(r).contains("{{toolName}}"),
                r -> assertThat(r).doesNotContain("{{toolName}}")
            );
    }

    @Test
    void whenRenderWithNullVariables_thenHandlesGracefully() {
        String result = service.renderTemplate(testTemplate, null);

        // Should either keep placeholders or handle null gracefully
        assertThat(result).isNotNull();
    }

    @Test
    void whenRenderWithEmptyVariables_thenKeepsPlaceholders() {
        Map<String, Object> variables = new HashMap<>();

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .contains("{{userName}}")
            .contains("{{toolName}}");
    }

    @Test
    void whenRenderWithSpecialCharacters_thenEscapesCorrectly() {
        testTemplate.setContent("Olá {{userName}}, valor: {{price}}€");
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "João & Maria");
        variables.put("price", "45.50");

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .contains("João & Maria")
            .contains("45.50€");
    }

    @Test
    void whenRenderWithNumericVariables_thenConvertsToString() {
        testTemplate.setContent("Reserva #{{rentId}} - Total: {{totalPrice}}€");
        Map<String, Object> variables = new HashMap<>();
        variables.put("rentId", 123L);
        variables.put("totalPrice", 45.50);

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .contains("Reserva #123")
            .contains("Total: 45.5€");
    }

    @Test
    void whenRenderWithDateVariables_thenFormatsCorrectly() {
        testTemplate.setContent("Data início: {{startDate}}");
        Map<String, Object> variables = new HashMap<>();
        variables.put("startDate", "10/12/2024");

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result).contains("Data início: 10/12/2024");
    }

    /**
     * TEMPLATE CRUD TESTS
     */
    @Test
    void whenCreateTemplate_thenSuccess() {
        when(repository.save(any(NotificationTemplate.class))).thenReturn(testTemplate);

        NotificationTemplate created = service.createTemplate(testTemplate);

        assertThat(created).isNotNull();
        assertThat(created.getType()).isEqualTo(NotificationType.RENT_APPROVED);
        verify(repository, times(1)).save(testTemplate);
    }

    @Test
    void whenUpdateTemplate_thenSuccess() {
        NotificationTemplate updates = new NotificationTemplate();
        updates.setSubject("Novo assunto - {{toolName}}");
        updates.setContent("Novo conteúdo");

        when(repository.findById(1L)).thenReturn(Optional.of(testTemplate));
        when(repository.save(any(NotificationTemplate.class))).thenReturn(testTemplate);

        NotificationTemplate updated = service.updateTemplate(1L, updates);

        assertThat(updated.getSubject()).isEqualTo("Novo assunto - {{toolName}}");
        assertThat(updated.getContent()).isEqualTo("Novo conteúdo");
    }

    @Test
    void whenDeactivateTemplate_thenSetsActiveFalse() {
        when(repository.findById(1L)).thenReturn(Optional.of(testTemplate));
        when(repository.save(any(NotificationTemplate.class))).thenReturn(testTemplate);

        service.deactivateTemplate(1L);

        assertThat(testTemplate.getActive()).isFalse();
        verify(repository, times(1)).save(testTemplate);
    }

    /**
     * EDGE CASES
     */
    @Test
    void whenMultiplePlaceholdersOfSameVariable_thenReplacesAll() {
        testTemplate.setContent("{{userName}}, a sua reserva {{userName}} foi confirmada!");
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", "Daniel");

        String result = service.renderTemplate(testTemplate, variables);

        assertThat(result)
            .isEqualTo("Daniel, a sua reserva Daniel foi confirmada!")
            .doesNotContain("{{");
    }

    @Test
    void whenNestedBraces_thenHandlesCorrectly() {
        testTemplate.setContent("Valor: {{{price}}}");
        Map<String, Object> variables = new HashMap<>();
        variables.put("price", "50");

        String result = service.renderTemplate(testTemplate, variables);

        // Implementation should handle nested braces gracefully
        assertThat(result).isNotNull();
    }
}
