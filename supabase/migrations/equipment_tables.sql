-- =====================================================
-- EQUIPMENT TABLES - Multi-tenant Equipment Management
-- =====================================================

-- Equipment Types Enum
CREATE TYPE equipment_type AS ENUM (
  'mikrotik',
  'intelbras', 
  'huawei_olt',
  'huawei_ont',
  'nokia_olt',
  'unifi',
  'juniper',
  'datacom',
  'raisecom',
  'generic_snmp',
  'generic_api'
);

-- Equipment Status Enum
CREATE TYPE equipment_status AS ENUM (
  'online',
  'offline',
  'maintenance',
  'unknown'
);

-- =====================================================
-- EQUIPMENTS TABLE
-- =====================================================
CREATE TABLE equipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificação
  name VARCHAR(255) NOT NULL,
  type equipment_type NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  port INTEGER DEFAULT 80,
  
  -- Localização
  location VARCHAR(255),
  model VARCHAR(255),
  firmware VARCHAR(255),
  
  -- Status
  status equipment_status DEFAULT 'unknown',
  last_check TIMESTAMPTZ,
  
  -- Metadados JSON para dados extras
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_equipments_org ON equipments(organization_id);
CREATE INDEX idx_equipments_type ON equipments(type);
CREATE INDEX idx_equipments_status ON equipments(status);

-- =====================================================
-- EQUIPMENT CREDENTIALS TABLE (criptografado)
-- =====================================================
CREATE TABLE equipment_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  
  -- Tipo de credencial
  auth_type VARCHAR(50) NOT NULL, -- 'basic', 'api_key', 'snmp', 'certificate'
  
  -- Dados criptografados (usar sempre encrypted_fields no Supabase)
  username_encrypted TEXT,
  password_encrypted TEXT, -- Criptografado com pgp_sym_encrypt
  api_key_encrypted TEXT,
  snmp_community_encrypted TEXT,
  
  -- Dados não sensíveis
  extra_data JSONB DEFAULT '{}', -- Outras configurações em JSON
  
  -- Validade
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_equipment_credentials_equipment ON equipment_credentials(equipment_id);

-- =====================================================
-- EQUIPMENT LOGS (histórico de operações)
-- =====================================================
CREATE TABLE equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
  
  -- Ação
  action VARCHAR(100) NOT NULL, -- 'connect', 'provision', 'suspend', etc
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'pending'
  
  -- Dados
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  
  -- Contexto
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_equipment_logs_org ON equipment_logs(organization_id);
CREATE INDEX idx_equipment_logs_equipment ON equipment_logs(equipment_id);
CREATE INDEX idx_equipment_logs_created ON equipment_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER tr_equipments_updated_at
  BEFORE UPDATE ON equipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_equipment_credentials_updated_at
  BEFORE UPDATE ON equipment_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function para buscar equipamentos com status
CREATE OR REPLACE FUNCTION check_equipment_status(p_equipment_id UUID)
RETURNS equipment_status AS $$
DECLARE
  v_status equipment_status;
BEGIN
  -- Lógica de проверка status baseada no tipo
  -- Por enquanto retorna unknown, a aplicação faz o check real
  SELECT status INTO v_status FROM equipments WHERE id = p_equipment_id;
  RETURN COALESCE(v_status, 'unknown');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;

-- Equipments: Organization-based access
CREATE POLICY "Users can view own organization equipments"
  ON equipments FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Users can insert own organization equipments"
  ON equipments FOR INSERT
  WITH CHECK (organization_id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Users can update own organization equipments"
  ON equipments FOR UPDATE
  USING (organization_id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Users can delete own organization equipments"
  ON equipments FOR DELETE
  USING (organization_id = auth.jwt() ->> 'organization_id');

-- Equipment Credentials: Same org only
CREATE POLICY "Users can view own organization credentials"
  ON equipment_credentials FOR SELECT
  USING (
    equipment_id IN (
      SELECT id FROM equipments 
      WHERE organization_id = auth.jwt() ->> 'organization_id'
    )
  );

CREATE POLICY "Users can manage own organization credentials"
  ON equipment_credentials FOR ALL
  USING (
    equipment_id IN (
      SELECT id FROM equipments 
      WHERE organization_id = auth.jwt() ->> 'organization_id'
    )
  );

-- Equipment Logs: Same org only
CREATE POLICY "Users can view own organization logs"
  ON equipment_logs FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Users can insert own organization logs"
  ON equipment_logs FOR INSERT
  WITH CHECK (organization_id = auth.jwt() ->> 'organization_id');

-- =====================================================
-- FINISH
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Equipment tables created successfully!';
END $$;
