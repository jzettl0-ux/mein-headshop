-- ============================================
-- Blueprint Teil 18: Ultimate End-Level & Enterprise Backend Operations
-- FBA Reimbursement, Third-Party Warranties, Vendor Central (1P),
-- Wave Picking, MAP Enforcement
-- ============================================

CREATE SCHEMA IF NOT EXISTS warehouse_ops;
CREATE SCHEMA IF NOT EXISTS vendor_central;
CREATE SCHEMA IF NOT EXISTS brand_enforcement;

-- =================================================================
-- 1. FBA LOST & DAMAGED INVENTORY REIMBURSEMENT
-- =================================================================
CREATE TABLE IF NOT EXISTS warehouse_ops.inventory_discrepancies (
    discrepancy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location_id VARCHAR(50) NOT NULL,
    quantity_lost_or_damaged INT NOT NULL,
    reason_code VARCHAR(50) CHECK (reason_code IN ('WAREHOUSE_DAMAGE', 'LOST_IN_TRANSIT', 'MISPLACED_IN_FC')),
    status VARCHAR(20) DEFAULT 'PENDING_REIMBURSEMENT' CHECK (status IN ('PENDING_REIMBURSEMENT', 'REIMBURSED', 'DISPUTED')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_ops.reimbursements (
    reimbursement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discrepancy_id UUID UNIQUE NOT NULL REFERENCES warehouse_ops.inventory_discrepancies(discrepancy_id),
    calculated_fair_market_value NUMERIC(10,2) NOT NULL,
    deducted_fees NUMERIC(10,2) NOT NULL,
    net_payout_amount NUMERIC(10,2) GENERATED ALWAYS AS (calculated_fair_market_value - deducted_fees) STORED,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_discrepancies_vendor ON warehouse_ops.inventory_discrepancies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_discrepancies_status ON warehouse_ops.inventory_discrepancies(status);

-- =================================================================
-- 2. THIRD-PARTY WARRANTIES (CROSS-SELLING)
-- =================================================================
CREATE TABLE IF NOT EXISTS catalog.warranty_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicable_category TEXT,
    min_product_price NUMERIC(10,2) NOT NULL,
    max_product_price NUMERIC(10,2) NOT NULL,
    insurance_provider_id VARCHAR(100) NOT NULL,
    plan_price NUMERIC(10,2) NOT NULL,
    broker_commission_percentage NUMERIC(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 3. 1P VENDOR CENTRAL (GROSSHANDELS-PURCHASE ORDERS)
-- =================================================================
CREATE TABLE IF NOT EXISTS vendor_central.suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'NET_60',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_central.purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES vendor_central.suppliers(supplier_id) ON DELETE RESTRICT,
    target_warehouse_id VARCHAR(50) NOT NULL,
    total_cost_value NUMERIC(12,2) NOT NULL,
    expected_delivery_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'ACCEPTED', 'SHIPPED', 'RECEIVING', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_central.po_items (
    po_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES vendor_central.purchase_orders(po_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    requested_quantity INT NOT NULL,
    received_quantity INT DEFAULT 0,
    unit_wholesale_cost NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON vendor_central.po_items(po_id);

-- =================================================================
-- 4. WAREHOUSE WAVE PICKING & ROUTING
-- =================================================================
CREATE TABLE IF NOT EXISTS warehouse_ops.picking_waves (
    wave_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_zone VARCHAR(50) NOT NULL,
    assigned_picker_id UUID,
    total_items_to_pick INT NOT NULL,
    status VARCHAR(20) DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_ops.pick_tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wave_id UUID NOT NULL REFERENCES warehouse_ops.picking_waves(wave_id) ON DELETE CASCADE,
    order_line_id UUID NOT NULL REFERENCES fulfillment.order_lines(id) ON DELETE CASCADE,
    bin_location VARCHAR(50) NOT NULL,
    optimized_pick_sequence INT NOT NULL,
    picked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pick_tasks_wave ON warehouse_ops.pick_tasks(wave_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_waves_status ON warehouse_ops.picking_waves(status);

-- =================================================================
-- 5. DYNAMIC MAP ENFORCEMENT
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'transparency_brands') THEN
    CREATE TABLE IF NOT EXISTS brand_enforcement.map_policies (
        policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_registry_id UUID NOT NULL REFERENCES security.transparency_brands(enrollment_id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        minimum_advertised_price NUMERIC(10,2) NOT NULL,
        enforcement_action VARCHAR(50) DEFAULT 'SUPPRESS_BUY_BOX' CHECK (enforcement_action IN ('SUPPRESS_BUY_BOX', 'HIDE_PRICE', 'SUSPEND_LISTING')),
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(brand_registry_id, product_id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  ELSE
    CREATE TABLE IF NOT EXISTS brand_enforcement.map_policies (
        policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_registry_id UUID NOT NULL,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        minimum_advertised_price NUMERIC(10,2) NOT NULL,
        enforcement_action VARCHAR(50) DEFAULT 'SUPPRESS_BUY_BOX' CHECK (enforcement_action IN ('SUPPRESS_BUY_BOX', 'HIDE_PRICE', 'SUSPEND_LISTING')),
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(brand_registry_id, product_id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS brand_enforcement.map_violations (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES brand_enforcement.map_policies(policy_id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    detected_price NUMERIC(10,2) NOT NULL,
    action_taken BOOLEAN DEFAULT TRUE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brand_map_violations ON brand_enforcement.map_violations(vendor_id);
