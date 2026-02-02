-- Function to handle new chat messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.receiver_id,
        'chat',
        'Nova Mensagem',
        'Você recebeu uma nova mensagem.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Chat Messages
DROP TRIGGER IF EXISTS on_chat_message ON public.chat_messages;

CREATE TRIGGER on_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Function to handle new appointments
CREATE OR REPLACE FUNCTION handle_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify Professional
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.professional_id,
        'appointment',
        'Novo Agendamento',
        'Um novo agendamento foi solicitado.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New Appointments
DROP TRIGGER IF EXISTS on_new_appointment ON public.appointments;

CREATE TRIGGER on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION handle_new_appointment();

-- Function to handle appointment status changes (e.g. Confirmed)
CREATE OR REPLACE FUNCTION handle_appointment_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        -- Notify Client
        INSERT INTO public.notifications (user_id, type, title, message, read)
        VALUES (
            NEW.client_id,
            'appointment_update',
            'Status do Agendamento',
            'Seu agendamento foi atualizado para: ' || NEW.status,
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Appointment Updates
DROP TRIGGER IF EXISTS on_appointment_update ON public.appointments;

CREATE TRIGGER on_appointment_update
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION handle_appointment_update();

-- Function to handle new transactions
CREATE OR REPLACE FUNCTION handle_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, read)
    VALUES (
        NEW.user_id,
        'finance',
        'Nova Transação',
        'Uma nova transação foi registrada em sua conta.',
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Transactions
DROP TRIGGER IF EXISTS on_new_transaction ON public.transactions;

CREATE TRIGGER on_new_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION handle_new_transaction();