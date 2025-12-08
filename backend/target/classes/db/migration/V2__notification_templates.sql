-- Notification Templates for Rent System
-- Author: Daniel (QA Engineer)
-- Sprint 3 - SCRUMDEMO-123

-- Insert RENT_APPROVED email template
INSERT INTO notification_templates (type, channel, subject, content, active, created_at, updated_at) VALUES
('RENT_APPROVED', 'EMAIL',
 'Reserva Aprovada - {{toolName}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1>✓ Reserva Aprovada</h1>
    </div>

    <div style="padding: 20px; background: #f9f9f9;">
        <p>Olá <strong>{{userName}}</strong>,</p>

        <p>Ótimas notícias! A sua reserva foi <strong>aprovada</strong> pelo proprietário.</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Reserva</h3>
            <p><strong>Ferramenta:</strong> {{toolName}}</p>
            <p><strong>Data início:</strong> {{startDate}}</p>
            <p><strong>Data fim:</strong> {{endDate}}</p>
            <p><strong>ID da reserva:</strong> #{{rentId}}</p>
        </div>

        <p>Pode levantar a ferramenta na data acordada.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            CraftingStable - Plataforma de Aluguer de Ferramentas<br>
        </p>
    </div>
</body>
</html>',
 true, NOW(), NOW());

-- Insert RENT_REJECTED email template
INSERT INTO notification_templates (type, channel, subject, content, active, created_at, updated_at) VALUES
('RENT_REJECTED', 'EMAIL',
 'Reserva Rejeitada - {{toolName}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
        <h1>✗ Reserva Rejeitada</h1>
    </div>

    <div style="padding: 20px; background: #f9f9f9;">
        <p>Olá <strong>{{userName}}</strong>,</p>

        <p>Infelizmente a sua reserva foi <strong>rejeitada</strong> pelo proprietário.</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Reserva</h3>
            <p><strong>Ferramenta:</strong> {{toolName}}</p>
            <p><strong>Data início:</strong> {{startDate}}</p>
            <p><strong>Data fim:</strong> {{endDate}}</p>
            <p><strong>ID da reserva:</strong> #{{rentId}}</p>
            <p><strong>Motivo:</strong> {{rejectReason}}</p>
        </div>

        <p>Pode procurar ferramentas alternativas no nosso catálogo.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            CraftingStable - Plataforma de Aluguer de Ferramentas<br>
        </p>
    </div>
</body>
</html>',
 true, NOW(), NOW());

-- Insert RENT_CANCELED email template
INSERT INTO notification_templates (type, channel, subject, content, active, created_at, updated_at) VALUES
('RENT_CANCELED', 'EMAIL',
 'Reserva Cancelada - {{toolName}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #FF9800; color: white; padding: 20px; text-align: center;">
        <h1>⚠ Reserva Cancelada</h1>
    </div>

    <div style="padding: 20px; background: #f9f9f9;">
        <p>Olá <strong>{{userName}}</strong>,</p>

        <p>A sua reserva foi <strong>cancelada</strong>.</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Reserva</h3>
            <p><strong>Ferramenta:</strong> {{toolName}}</p>
            <p><strong>Data início:</strong> {{startDate}}</p>
            <p><strong>Data fim:</strong> {{endDate}}</p>
            <p><strong>ID da reserva:</strong> #{{rentId}}</p>
            <p><strong>Cancelado em:</strong> {{canceledAt}}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            CraftingStable - Plataforma de Aluguer de Ferramentas<br>
        </p>
    </div>
</body>
</html>',
 true, NOW(), NOW());

-- Insert RENT_REMINDER email template
INSERT INTO notification_templates (type, channel, subject, content, active, created_at, updated_at) VALUES
('RENT_REMINDER', 'EMAIL',
 'Lembrete: Reserva amanhã - {{toolName}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
        <h1>🔔 Lembrete de Reserva</h1>
    </div>

    <div style="padding: 20px; background: #f9f9f9;">
        <p>Olá <strong>{{userName}}</strong>,</p>

        <p>Este é um lembrete de que a sua reserva começa <strong>amanhã</strong>!</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Reserva</h3>
            <p><strong>Ferramenta:</strong> {{toolName}}</p>
            <p><strong>Data início:</strong> {{startDate}}</p>
            <p><strong>Data fim:</strong> {{endDate}}</p>
            <p><strong>ID da reserva:</strong> #{{rentId}}</p>
        </div>

        <p>Não se esqueça de levantar a ferramenta no local acordado.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            CraftingStable - Plataforma de Aluguer de Ferramentas<br>
        </p>
    </div>
</body>
</html>',
 true, NOW(), NOW());

-- Insert RENT_FINISHED email template
INSERT INTO notification_templates (type, channel, subject, content, active, created_at, updated_at) VALUES
('RENT_FINISHED', 'EMAIL',
 'Reserva Finalizada - {{toolName}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #9C27B0; color: white; padding: 20px; text-align: center;">
        <h1>✓ Reserva Finalizada</h1>
    </div>

    <div style="padding: 20px; background: #f9f9f9;">
        <p>Olá <strong>{{userName}}</strong>,</p>

        <p>A sua reserva foi <strong>finalizada</strong> com sucesso!</p>

        <div style="background: white; padding: 15px; border-left: 4px solid #9C27B0; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes da Reserva</h3>
            <p><strong>Ferramenta:</strong> {{toolName}}</p>
            <p><strong>Data início:</strong> {{startDate}}</p>
            <p><strong>Data fim:</strong> {{endDate}}</p>
            <p><strong>ID da reserva:</strong> #{{rentId}}</p>
        </div>

        <p>Obrigado por usar a CraftingStable! Esperamos vê-lo novamente.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            CraftingStable - Plataforma de Aluguer de Ferramentas<br>
        </p>
    </div>
</body>
</html>',
 true, NOW(), NOW());
