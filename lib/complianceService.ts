import { supabase } from './supabase';
import {
  addTraceabilityEvent,
  getTraceabilityByBatchCode,
  type TraceabilityEvent,
} from './traceabilityService';

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

export type ComplianceWorkflowType = 'ccp_monitoring' | 'sanitation_check' | 'recall_drill' | 'audit_bundle';
export type ComplianceStandard = 'ISO_22005' | 'GMP' | 'HACCP' | 'GAP';
export type ComplianceResult = 'pass' | 'warning' | 'failed' | 'scheduled' | 'completed';

export interface ComplianceChecklistItem {
  label: string;
  status: 'complete' | 'missing' | 'warning';
  notes?: string;
}

export interface ComplianceCorrectiveAction {
  action: string;
  owner?: string;
  due_at?: string;
  closed_at?: string;
  status: 'open' | 'in_progress' | 'closed';
}

export interface CompliancePayload {
  workflow_type: ComplianceWorkflowType;
  standard: ComplianceStandard;
  result: ComplianceResult;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  control_point?: string;
  observed_value?: number;
  unit?: string;
  min_limit?: number;
  max_limit?: number;
  scheduled_at?: string;
  completed_at?: string;
  owner?: string;
  checklist?: ComplianceChecklistItem[];
  corrective_actions?: ComplianceCorrectiveAction[];
  metadata?: Record<string, unknown>;
}

export type ComplianceEventRecord = Omit<TraceabilityEvent, 'compliance_data'> & {
  compliance_data?: CompliancePayload;
};

export interface LogCCPCheckInput {
  batchId: string;
  actorId?: string;
  actorName?: string;
  contractId?: string;
  controlPoint: string;
  observedValue: number;
  unit: string;
  minLimit?: number;
  maxLimit?: number;
  result: ComplianceResult;
  notes?: string;
  severity?: CompliancePayload['severity'];
  correctiveActions?: ComplianceCorrectiveAction[];
  documents?: string[];
}

export interface LogSanitationCheckInput {
  batchId: string;
  actorId?: string;
  actorName?: string;
  contractId?: string;
  facility: string;
  zone: string;
  checklist: ComplianceChecklistItem[];
  result: ComplianceResult;
  notes?: string;
  completedAt?: string;
  correctiveActions?: ComplianceCorrectiveAction[];
}

export interface LogRecallDrillInput {
  batchId: string;
  actorId?: string;
  actorName?: string;
  contractId?: string;
  initiatedAt?: string;
  completedAt?: string;
  affectedLots: string[];
  simulatedBuyers: string[];
  responseWindowMinutes: number;
  result: ComplianceResult;
  notes?: string;
  correctiveActions?: ComplianceCorrectiveAction[];
}

export interface ComplianceAuditPack {
  batchCode: string;
  cropType?: string;
  currentStatus?: string;
  generatedAt: string;
  standardsCovered: ComplianceStandard[];
  complianceEvents: ComplianceEventRecord[];
  missingControls: string[];
  summary: {
    ccpChecks: number;
    sanitationChecks: number;
    recallDrills: number;
    openCorrectiveActions: number;
  };
}

function normalizeCompliancePayload(event: Record<string, unknown>): CompliancePayload | undefined {
  const payload = event.compliance_data;
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return payload as CompliancePayload;
}

function buildTraceabilityPayload(
  event: Omit<TraceabilityEvent, 'id' | 'created_at'>,
  complianceData: CompliancePayload
) {
  return {
    ...event,
    compliance_data: complianceData,
  } as unknown as Omit<TraceabilityEvent, 'id' | 'created_at'>;
}

export async function logCCPCheck(input: LogCCPCheckInput) {
  const complianceData: CompliancePayload = {
    workflow_type: 'ccp_monitoring',
    standard: 'HACCP',
    result: input.result,
    severity: input.severity,
    control_point: input.controlPoint,
    observed_value: input.observedValue,
    unit: input.unit,
    min_limit: input.minLimit,
    max_limit: input.maxLimit,
    completed_at: new Date().toISOString(),
    corrective_actions: input.correctiveActions,
    metadata: {
      notes: input.notes,
    },
  };

  return addTraceabilityEvent(buildTraceabilityPayload({
    batch_id: input.batchId,
    contract_id: input.contractId,
    event_type: 'quality_check',
    event_title: `CCP Check • ${input.controlPoint}`,
    event_description: input.notes || `Observed ${input.observedValue}${input.unit} at ${input.controlPoint}`,
    actor_id: input.actorId,
    actor_type: 'admin',
    actor_name: input.actorName || 'Compliance Officer',
    documents: input.documents,
  }, complianceData));
}

export async function logSanitationCheck(input: LogSanitationCheckInput) {
  const completedAt = input.completedAt || new Date().toISOString();
  const complianceData: CompliancePayload = {
    workflow_type: 'sanitation_check',
    standard: 'GMP',
    result: input.result,
    completed_at: completedAt,
    checklist: input.checklist,
    corrective_actions: input.correctiveActions,
    metadata: {
      facility: input.facility,
      zone: input.zone,
      notes: input.notes,
    },
  };

  return addTraceabilityEvent(buildTraceabilityPayload({
    batch_id: input.batchId,
    contract_id: input.contractId,
    event_type: 'processing',
    event_title: `Sanitation Check • ${input.facility} / ${input.zone}`,
    event_description: input.notes || `Sanitation verification completed for ${input.zone}`,
    actor_id: input.actorId,
    actor_type: 'admin',
    actor_name: input.actorName || 'Warehouse QA',
    storage_facility: input.facility,
  }, complianceData));
}

export async function logRecallDrill(input: LogRecallDrillInput) {
  const initiatedAt = input.initiatedAt || new Date().toISOString();
  const completedAt = input.completedAt || new Date().toISOString();
  const complianceData: CompliancePayload = {
    workflow_type: 'recall_drill',
    standard: 'ISO_22005',
    result: input.result,
    scheduled_at: initiatedAt,
    completed_at: completedAt,
    corrective_actions: input.correctiveActions,
    metadata: {
      affected_lots: input.affectedLots,
      simulated_buyers: input.simulatedBuyers,
      response_window_minutes: input.responseWindowMinutes,
      notes: input.notes,
    },
  };

  return addTraceabilityEvent(buildTraceabilityPayload({
    batch_id: input.batchId,
    contract_id: input.contractId,
    event_type: 'distribution',
    event_title: 'Recall Drill Executed',
    event_description: input.notes || `Recall drill completed in ${input.responseWindowMinutes} minutes`,
    actor_id: input.actorId,
    actor_type: 'admin',
    actor_name: input.actorName || 'Operations Lead',
  }, complianceData));
}

export async function getComplianceEventsByBatch(batchId: string): Promise<ComplianceEventRecord[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('traceability_events')
    .select('*')
    .eq('batch_id', batchId)
    .not('compliance_data', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((event: Record<string, unknown>) => ({
    ...((event as unknown) as ComplianceEventRecord),
    compliance_data: normalizeCompliancePayload(event),
  }));
}

export async function generateComplianceAuditPack(batchCodeOrContractId: string): Promise<ComplianceAuditPack | null> {
  const traceability = await getTraceabilityByBatchCode(batchCodeOrContractId);
  if (!traceability?.batch?.id) {
    return null;
  }

  const complianceEvents = await getComplianceEventsByBatch(traceability.batch.id);
  const standardsCovered = Array.from(new Set(
    complianceEvents
      .map((event) => event.compliance_data?.standard)
      .filter((standard): standard is ComplianceStandard => Boolean(standard))
  ));

  const workflowSet = new Set(
    complianceEvents
      .map((event) => event.compliance_data?.workflow_type)
      .filter((workflow): workflow is ComplianceWorkflowType => Boolean(workflow))
  );

  const openCorrectiveActions = complianceEvents.reduce((count, event) => {
    const correctiveActions = event.compliance_data?.corrective_actions || [];
    return count + correctiveActions.filter((action) => action.status !== 'closed').length;
  }, 0);

  const missingControls: string[] = [];
  if (!workflowSet.has('ccp_monitoring')) {
    missingControls.push('No CCP monitoring records logged for this batch.');
  }
  if (!workflowSet.has('sanitation_check')) {
    missingControls.push('No sanitation or GMP verification records logged for this batch.');
  }
  if (!workflowSet.has('recall_drill')) {
    missingControls.push('No recall drill evidence linked to this batch or contract.');
  }
  if (openCorrectiveActions > 0) {
    missingControls.push(`${openCorrectiveActions} corrective action(s) remain open.`);
  }

  const bundleEventPayload = buildTraceabilityPayload({
    batch_id: traceability.batch.id,
    contract_id: traceability.batch.contract_id,
    event_type: 'quality_check',
    event_title: 'Compliance Audit Pack Generated',
    event_description: `Audit pack prepared with ${complianceEvents.length} compliance event(s).`,
    actor_type: 'admin',
    actor_name: 'Compliance Service',
  }, {
    workflow_type: 'audit_bundle',
    standard: 'ISO_22005',
    result: missingControls.length === 0 ? 'completed' : 'warning',
    completed_at: new Date().toISOString(),
    metadata: {
      standards_covered: standardsCovered,
      missing_controls: missingControls,
      open_corrective_actions: openCorrectiveActions,
    },
  });

  await addTraceabilityEvent(bundleEventPayload);

  return {
    batchCode: traceability.batch.batch_code,
    cropType: traceability.batch.crop_type,
    currentStatus: traceability.batch.current_status,
    generatedAt: new Date().toISOString(),
    standardsCovered,
    complianceEvents,
    missingControls,
    summary: {
      ccpChecks: complianceEvents.filter((event) => event.compliance_data?.workflow_type === 'ccp_monitoring').length,
      sanitationChecks: complianceEvents.filter((event) => event.compliance_data?.workflow_type === 'sanitation_check').length,
      recallDrills: complianceEvents.filter((event) => event.compliance_data?.workflow_type === 'recall_drill').length,
      openCorrectiveActions,
    },
  };
}


