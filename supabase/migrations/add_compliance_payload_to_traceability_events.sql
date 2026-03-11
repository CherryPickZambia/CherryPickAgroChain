ALTER TABLE traceability_events
ADD COLUMN IF NOT EXISTS compliance_data JSONB;

CREATE INDEX IF NOT EXISTS idx_traceability_events_compliance_data
ON traceability_events
USING GIN (compliance_data);

CREATE INDEX IF NOT EXISTS idx_traceability_events_compliance_workflow
ON traceability_events ((compliance_data->>'workflow_type'));
