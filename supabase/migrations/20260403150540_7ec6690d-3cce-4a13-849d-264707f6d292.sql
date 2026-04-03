
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Generic function to dispatch automation events via edge function
CREATE OR REPLACE FUNCTION public.dispatch_automation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_name TEXT;
  event_payload JSONB;
  org_id UUID;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get event info from trigger args
  event_name := TG_ARGV[0];
  org_id := NEW.organization_id;

  -- Build payload based on table
  event_payload := jsonb_build_object(
    'record_id', NEW.id,
    'table', TG_TABLE_NAME
  );

  -- Add table-specific fields
  IF TG_TABLE_NAME = 'invoices' THEN
    event_payload := event_payload || jsonb_build_object(
      'customer_id', NEW.customer_id,
      'amount', NEW.amount,
      'due_date', NEW.due_date,
      'status', NEW.status
    );
  ELSIF TG_TABLE_NAME = 'contracts' THEN
    event_payload := event_payload || jsonb_build_object(
      'customer_id', NEW.customer_id,
      'plan_id', NEW.plan_id,
      'status', NEW.status
    );
  ELSIF TG_TABLE_NAME = 'tickets' THEN
    event_payload := event_payload || jsonb_build_object(
      'customer_id', NEW.customer_id,
      'subject', NEW.subject,
      'priority', NEW.priority,
      'status', NEW.status
    );
  ELSIF TG_TABLE_NAME = 'service_orders' THEN
    event_payload := event_payload || jsonb_build_object(
      'customer_id', NEW.customer_id,
      'type', NEW.type,
      'status', NEW.status
    );
  END IF;

  -- Get Supabase URL and anon key from vault or hardcode project ref
  supabase_url := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';

  -- Call edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/automation-event-dispatch',
    body := jsonb_build_object(
      'event', event_name,
      'organization_id', org_id,
      'payload', event_payload
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger: invoice becomes overdue
CREATE OR REPLACE FUNCTION public.trigger_invoice_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Invoice marked as overdue
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'overdue') THEN
    NEW := dispatch_automation_event_inline('invoice.overdue', NEW.organization_id, NEW);
  END IF;

  -- Invoice paid
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid') THEN
    NEW := dispatch_automation_event_inline('invoice.paid', NEW.organization_id, NEW);
  END IF;

  RETURN NEW;
END;
$$;

-- Inline dispatch helper that uses pg_net directly
CREATE OR REPLACE FUNCTION public.dispatch_automation_event_inline(
  p_event TEXT,
  p_org_id UUID,
  p_record RECORD
)
RETURNS RECORD
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'event', p_event,
    'organization_id', p_org_id,
    'payload', jsonb_build_object('record_id', p_record.id)
  );

  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/automation-event-dispatch',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )
  );

  RETURN p_record;
END;
$$;

-- Drop the complex approach and use simpler per-table triggers

-- INVOICE EVENTS
CREATE OR REPLACE FUNCTION public.on_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_name TEXT;
  supabase_url TEXT := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'overdue' THEN event_name := 'invoice.overdue';
    ELSIF NEW.status = 'paid' THEN event_name := 'invoice.paid';
    END IF;

    IF event_name IS NOT NULL THEN
      PERFORM extensions.http_post(
        url := supabase_url || '/functions/v1/automation-event-dispatch',
        body := jsonb_build_object(
          'event', event_name,
          'organization_id', NEW.organization_id,
          'payload', jsonb_build_object(
            'record_id', NEW.id,
            'customer_id', NEW.customer_id,
            'amount', NEW.amount,
            'due_date', NEW.due_date,
            'status', NEW.status
          )
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_automation_events
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.on_invoice_change();

-- CONTRACT EVENTS
CREATE OR REPLACE FUNCTION public.on_contract_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';
BEGIN
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/automation-event-dispatch',
    body := jsonb_build_object(
      'event', 'contract.created',
      'organization_id', NEW.organization_id,
      'payload', jsonb_build_object(
        'record_id', NEW.id,
        'customer_id', NEW.customer_id,
        'plan_id', NEW.plan_id,
        'status', NEW.status
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contract_automation_events
  AFTER INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_contract_create();

-- TICKET EVENTS
CREATE OR REPLACE FUNCTION public.on_ticket_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'resolved' THEN
    PERFORM extensions.http_post(
      url := supabase_url || '/functions/v1/automation-event-dispatch',
      body := jsonb_build_object(
        'event', 'ticket.resolved',
        'organization_id', NEW.organization_id,
        'payload', jsonb_build_object(
          'record_id', NEW.id,
          'customer_id', NEW.customer_id,
          'subject', NEW.subject,
          'priority', NEW.priority
        )
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_automation_events
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.on_ticket_resolved();

-- SERVICE ORDER EVENTS
CREATE OR REPLACE FUNCTION public.on_service_order_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://nqkhnkwudrsjuuhspknq.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2hua3d1ZHJzanV1aHNwa25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzMxNTYsImV4cCI6MjA5MDc0OTE1Nn0.uUzuGrl7VEdvewDx_cICIOibvZD2WNQ6jsDVym8zWPc';
BEGIN
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/automation-event-dispatch',
    body := jsonb_build_object(
      'event', 'service_order.created',
      'organization_id', NEW.organization_id,
      'payload', jsonb_build_object(
        'record_id', NEW.id,
        'customer_id', NEW.customer_id,
        'type', NEW.type,
        'status', NEW.status
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_service_order_automation_events
  AFTER INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_service_order_create();
