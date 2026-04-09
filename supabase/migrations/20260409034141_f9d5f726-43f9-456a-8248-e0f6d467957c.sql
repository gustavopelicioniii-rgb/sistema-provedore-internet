
-- =====================================================
-- 1. Drop and recreate ALL "Tenant isolation" policies 
--    from public → authenticated
-- =====================================================

-- automation_logs
DROP POLICY IF EXISTS "Tenant isolation" ON public.automation_logs;
CREATE POLICY "Tenant isolation" ON public.automation_logs FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- automations
DROP POLICY IF EXISTS "Tenant isolation" ON public.automations;
CREATE POLICY "Tenant isolation" ON public.automations FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- bank_reconciliations
DROP POLICY IF EXISTS "Tenant isolation" ON public.bank_reconciliations;
CREATE POLICY "Tenant isolation" ON public.bank_reconciliations FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- bank_transactions
DROP POLICY IF EXISTS "Tenant isolation" ON public.bank_transactions;
CREATE POLICY "Tenant isolation" ON public.bank_transactions FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- billing_rule_executions
DROP POLICY IF EXISTS "Tenant isolation" ON public.billing_rule_executions;
CREATE POLICY "Tenant isolation" ON public.billing_rule_executions FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- billing_rules
DROP POLICY IF EXISTS "Tenant isolation" ON public.billing_rules;
CREATE POLICY "Tenant isolation" ON public.billing_rules FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- contracts
DROP POLICY IF EXISTS "Tenant isolation" ON public.contracts;
CREATE POLICY "Tenant isolation" ON public.contracts FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- credit_analyses
DROP POLICY IF EXISTS "Tenant isolation" ON public.credit_analyses;
CREATE POLICY "Tenant isolation" ON public.credit_analyses FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- customers
DROP POLICY IF EXISTS "Tenant isolation" ON public.customers;
CREATE POLICY "Tenant isolation" ON public.customers FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- fiscal_invoices
DROP POLICY IF EXISTS "Tenant isolation" ON public.fiscal_invoices;
CREATE POLICY "Tenant isolation" ON public.fiscal_invoices FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ftth_nodes (keep anon SELECT for coverage map, but fix tenant policy)
DROP POLICY IF EXISTS "Tenant isolation" ON public.ftth_nodes;
CREATE POLICY "Tenant isolation" ON public.ftth_nodes FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- fuel_logs
DROP POLICY IF EXISTS "Tenant isolation" ON public.fuel_logs;
CREATE POLICY "Tenant isolation" ON public.fuel_logs FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- inventory_items
DROP POLICY IF EXISTS "Tenant isolation" ON public.inventory_items;
CREATE POLICY "Tenant isolation" ON public.inventory_items FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- inventory_movements
DROP POLICY IF EXISTS "Tenant isolation" ON public.inventory_movements;
CREATE POLICY "Tenant isolation" ON public.inventory_movements FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- invoice_installments
DROP POLICY IF EXISTS "Tenant isolation" ON public.invoice_installments;
CREATE POLICY "Tenant isolation" ON public.invoice_installments FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- invoices
DROP POLICY IF EXISTS "Tenant isolation" ON public.invoices;
CREATE POLICY "Tenant isolation" ON public.invoices FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- leads
DROP POLICY IF EXISTS "Tenant isolation" ON public.leads;
CREATE POLICY "Tenant isolation" ON public.leads FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- network_devices
DROP POLICY IF EXISTS "Tenant isolation" ON public.network_devices;
CREATE POLICY "Tenant isolation" ON public.network_devices FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- plans
DROP POLICY IF EXISTS "Tenant isolation" ON public.plans;
CREATE POLICY "Tenant isolation" ON public.plans FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- service_orders
DROP POLICY IF EXISTS "Tenant isolation" ON public.service_orders;
CREATE POLICY "Tenant isolation" ON public.service_orders FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- sla_configs
DROP POLICY IF EXISTS "Tenant isolation" ON public.sla_configs;
CREATE POLICY "Tenant isolation" ON public.sla_configs FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- technician_availability
DROP POLICY IF EXISTS "Tenant isolation" ON public.technician_availability;
CREATE POLICY "Tenant isolation" ON public.technician_availability FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- technician_schedules
DROP POLICY IF EXISTS "Tenant isolation" ON public.technician_schedules;
CREATE POLICY "Tenant isolation" ON public.technician_schedules FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- technicians
DROP POLICY IF EXISTS "Tenant isolation" ON public.technicians;
CREATE POLICY "Tenant isolation" ON public.technicians FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- tickets
DROP POLICY IF EXISTS "Tenant isolation" ON public.tickets;
CREATE POLICY "Tenant isolation" ON public.tickets FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- traffic_usage
DROP POLICY IF EXISTS "Tenant isolation" ON public.traffic_usage;
CREATE POLICY "Tenant isolation" ON public.traffic_usage FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- vehicles
DROP POLICY IF EXISTS "Tenant isolation" ON public.vehicles;
CREATE POLICY "Tenant isolation" ON public.vehicles FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- 2. Secure subscriber_credentials (block direct access)
-- =====================================================
DROP POLICY IF EXISTS "Service role only" ON public.subscriber_credentials;
CREATE POLICY "No direct access" ON public.subscriber_credentials FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- =====================================================
-- 3. Profiles: public → authenticated
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 4. Organizations: fix public SELECT → keep anon for slug lookup, restrict authenticated
-- =====================================================
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT TO authenticated
  USING (id = get_user_organization_id());

-- =====================================================
-- 5. Update has_role() to validate organization scope
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = _role
      AND organization_id = get_user_organization_id()
  )
$$;

-- =====================================================
-- 6. Create secure view for network_devices (hide passwords)
-- =====================================================
CREATE OR REPLACE VIEW public.network_devices_safe
WITH (security_invoker = on) AS
  SELECT id, organization_id, name, ip_address, mac_address, manufacturer, device_type,
         model, firmware_version, serial_number, location, api_port, api_username,
         status, uptime, cpu_usage, memory_usage, connected_clients, last_seen_at,
         created_at, updated_at, notes
  FROM public.network_devices;
