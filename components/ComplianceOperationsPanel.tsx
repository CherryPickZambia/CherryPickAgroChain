"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Download, Loader2, RefreshCw, Shield } from "lucide-react";
import toast from "react-hot-toast";
import {
  generateComplianceAuditPack,
  logCCPCheck,
  logRecallDrill,
  logSanitationCheck,
  type ComplianceAuditPack,
} from "@/lib/complianceService";
import { getAllBatches, type Batch } from "@/lib/traceabilityService";

export default function ComplianceOperationsPanel() {
  const [batches, setBatches] = useState<(Batch & { farmer_name?: string })[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<"ccp" | "sanitation" | "recall" | "audit" | null>(null);
  const [latestAuditPack, setLatestAuditPack] = useState<ComplianceAuditPack | null>(null);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const data = await getAllBatches();
        setBatches(data);
        if (data.length > 0) {
          setSelectedBatchId(data[0].id || "");
        }
      } catch (error) {
        console.error("Failed to load compliance batches:", error);
        toast.error("Failed to load batches for compliance workflows.");
      } finally {
        setLoading(false);
      }
    };

    void loadBatches();
  }, []);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  const ensureBatch = () => {
    if (!selectedBatch?.id) {
      toast.error("Select a batch to run a compliance workflow.");
      return null;
    }

    return selectedBatch;
  };

  const handleLogCCP = async () => {
    const batch = ensureBatch();
    if (!batch) return;

    setRunningAction("ccp");
    try {
      await logCCPCheck({
        batchId: batch.id!,
        contractId: batch.contract_id,
        actorName: "Admin Compliance Desk",
        controlPoint: "Cold-room receiving temperature",
        observedValue: 4.2,
        unit: "°C",
        minLimit: 2,
        maxLimit: 5,
        result: "pass",
        notes: `Receiving temperature verified for ${batch.batch_code}.`,
      });
      toast.success("CCP monitoring record logged.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to log CCP check.");
    } finally {
      setRunningAction(null);
    }
  };

  const handleLogSanitation = async () => {
    const batch = ensureBatch();
    if (!batch) return;

    setRunningAction("sanitation");
    try {
      await logSanitationCheck({
        batchId: batch.id!,
        contractId: batch.contract_id,
        actorName: "Warehouse QA",
        facility: "Lusaka aggregation hub",
        zone: "Receiving and wash line",
        result: "warning",
        notes: "Sanitation completed with one follow-up calibration action required.",
        checklist: [
          { label: "Surface sanitation verified", status: "complete" },
          { label: "Equipment calibration sticker current", status: "warning", notes: "Recalibrate scale before next intake." },
          { label: "Operator hygiene sign-off", status: "complete" },
        ],
        correctiveActions: [
          { action: "Recalibrate receiving scale", owner: "Maintenance", due_at: new Date(Date.now() + 86400000).toISOString(), status: "open" },
        ],
      });
      toast.success("Sanitation workflow record logged.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to log sanitation check.");
    } finally {
      setRunningAction(null);
    }
  };

  const handleRecallDrill = async () => {
    const batch = ensureBatch();
    if (!batch) return;

    setRunningAction("recall");
    try {
      await logRecallDrill({
        batchId: batch.id!,
        contractId: batch.contract_id,
        actorName: "Operations Lead",
        affectedLots: [batch.batch_code],
        simulatedBuyers: ["Fresh Foods Ltd", "City Mart Retail"],
        responseWindowMinutes: 43,
        result: "completed",
        notes: `Recall drill completed successfully for ${batch.batch_code}.`,
      });
      toast.success("Recall drill recorded.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to log recall drill.");
    } finally {
      setRunningAction(null);
    }
  };

  const handleGenerateAuditPack = async () => {
    if (!selectedBatch?.batch_code) {
      toast.error("Select a batch to generate the audit pack.");
      return;
    }

    setRunningAction("audit");
    try {
      const auditPack = await generateComplianceAuditPack(selectedBatch.batch_code);
      if (!auditPack) {
        toast.error("Unable to generate an audit pack for this batch.");
        return;
      }

      setLatestAuditPack(auditPack);
      toast.success("Compliance audit pack generated.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate audit pack.");
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="dashboard-panel rounded-2xl p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Compliance operations</h3>
          <p className="text-sm text-slate-600 mt-2">Run live CCP, sanitation, recall-drill, and audit-pack workflows against real tracked batches.</p>
        </div>
        <div className="min-w-[280px]">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">Active batch</label>
          <select
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm"
            disabled={loading || batches.length === 0}
          >
            {batches.map((batch) => (
              <option key={batch.id || batch.batch_code} value={batch.id}>
                {batch.batch_code} • {batch.crop_type} • {batch.farmer_name || "Unknown farmer"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-soft-card rounded-2xl p-6 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading compliance-ready batches...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <button
              onClick={handleLogCCP}
              disabled={!selectedBatch || runningAction !== null}
              className="dashboard-list-item rounded-2xl p-5 text-left disabled:opacity-60"
            >
              <AlertCircle className="h-6 w-6 text-amber-600 mb-4" />
              <p className="font-semibold text-slate-900">Log CCP check</p>
              <p className="text-sm text-slate-600 mt-2">Create a HACCP control-point record with limits and observed readings.</p>
              {runningAction === "ccp" && <Loader2 className="h-4 w-4 animate-spin text-amber-600 mt-4" />}
            </button>

            <button
              onClick={handleLogSanitation}
              disabled={!selectedBatch || runningAction !== null}
              className="dashboard-list-item rounded-2xl p-5 text-left disabled:opacity-60"
            >
              <Shield className="h-6 w-6 text-emerald-600 mb-4" />
              <p className="font-semibold text-slate-900">Log sanitation run</p>
              <p className="text-sm text-slate-600 mt-2">Capture GMP sanitation completion, checklist evidence, and corrective actions.</p>
              {runningAction === "sanitation" && <Loader2 className="h-4 w-4 animate-spin text-emerald-600 mt-4" />}
            </button>

            <button
              onClick={handleRecallDrill}
              disabled={!selectedBatch || runningAction !== null}
              className="dashboard-list-item rounded-2xl p-5 text-left disabled:opacity-60"
            >
              <RefreshCw className="h-6 w-6 text-sky-600 mb-4" />
              <p className="font-semibold text-slate-900">Run recall drill</p>
              <p className="text-sm text-slate-600 mt-2">Record a traceability recall simulation with buyers, affected lots, and response time.</p>
              {runningAction === "recall" && <Loader2 className="h-4 w-4 animate-spin text-sky-600 mt-4" />}
            </button>

            <button
              onClick={handleGenerateAuditPack}
              disabled={!selectedBatch || runningAction !== null}
              className="dashboard-list-item rounded-2xl p-5 text-left disabled:opacity-60"
            >
              <Download className="h-6 w-6 text-violet-600 mb-4" />
              <p className="font-semibold text-slate-900">Generate audit pack</p>
              <p className="text-sm text-slate-600 mt-2">Assemble an ISO/HACCP/GMP readiness bundle from logged compliance events.</p>
              {runningAction === "audit" && <Loader2 className="h-4 w-4 animate-spin text-violet-600 mt-4" />}
            </button>
          </div>

          {selectedBatch && (
            <div className="dashboard-soft-card rounded-2xl p-5 mt-6">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected lot</p>
                  <p className="text-lg font-semibold text-slate-900 mt-2">{selectedBatch.batch_code}</p>
                  <p className="text-sm text-slate-600 mt-1">{selectedBatch.crop_type} • {selectedBatch.current_status || "tracked"}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="dashboard-chip bg-white/70 text-slate-700 border-slate-200">{selectedBatch.farmer_name || "Unknown farmer"}</span>
                  <span className="dashboard-chip">{selectedBatch.total_quantity || 0} {selectedBatch.unit || "kg"}</span>
                </div>
              </div>
            </div>
          )}

          {latestAuditPack && (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
              <div className="dashboard-soft-card rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest audit pack</p>
                    <h4 className="text-xl font-bold text-slate-900 mt-2">{latestAuditPack.batchCode}</h4>
                    <p className="text-sm text-slate-600 mt-2">Generated {new Date(latestAuditPack.generatedAt).toLocaleString()}</p>
                  </div>
                  <div className="dashboard-chip bg-white/80 text-slate-700 border-slate-200">
                    <ClipboardCheck className="h-4 w-4" />
                    {latestAuditPack.standardsCovered.length || 1} standards covered
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="dashboard-list-item rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CCP checks</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{latestAuditPack.summary.ccpChecks}</p>
                  </div>
                  <div className="dashboard-list-item rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sanitation checks</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{latestAuditPack.summary.sanitationChecks}</p>
                  </div>
                  <div className="dashboard-list-item rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recall drills</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{latestAuditPack.summary.recallDrills}</p>
                  </div>
                  <div className="dashboard-list-item rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Open actions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{latestAuditPack.summary.openCorrectiveActions}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-soft-card rounded-2xl p-6">
                <h4 className="text-lg font-bold text-slate-900 mb-4">Missing controls</h4>
                <div className="space-y-3">
                  {latestAuditPack.missingControls.length === 0 ? (
                    <div className="dashboard-chip">
                      <CheckCircle2 className="h-4 w-4" />
                      No missing controls detected for this pack.
                    </div>
                  ) : (
                    latestAuditPack.missingControls.map((item) => (
                      <div key={item} className="dashboard-list-item rounded-2xl p-4 text-sm text-slate-600">
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
