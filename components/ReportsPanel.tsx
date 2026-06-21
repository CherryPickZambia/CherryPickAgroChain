"use client";

import { useState } from "react";
import { FileText, Download, TrendingUp, DollarSign, BarChart3, Loader2 } from "lucide-react";
import {
  generateContractPDF,
  generatePaymentReportPDF,
  generatePlatformAnalyticsPDF,
  exportContractsToExcel,
  exportPaymentsToExcel,
  exportToCSV,
  downloadPDF,
  downloadExcel,
  calculateFarmerPerformance,
} from "@/lib/reportingService";

interface ReportsPanelProps {
  userId: string;
  userRole: "farmer" | "officer" | "admin";
}

export default function ReportsPanel({ userId, userRole }: ReportsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState("");

  const handleGenerateContractPDF = async (contractId: string, contractData: any) => {
    setIsGenerating(true);
    setSelectedReport("contract");
    try {
      const doc = await generateContractPDF(contractId, contractData);
      downloadPDF(doc, `Contract_${contractId}_${Date.now()}`);
    } catch (error) {
      console.error("Failed to generate contract PDF:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const handleGeneratePaymentReport = async () => {
    setIsGenerating(true);
    setSelectedReport("payment");
    try {
      const doc = await generatePaymentReportPDF(userId);
      downloadPDF(doc, `Payment_Report_${Date.now()}`);
    } catch (error) {
      console.error("Failed to generate payment report:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const handleGeneratePlatformAnalytics = async () => {
    setIsGenerating(true);
    setSelectedReport("analytics");
    try {
      const doc = await generatePlatformAnalyticsPDF();
      downloadPDF(doc, `Platform_Analytics_${Date.now()}`);
    } catch (error) {
      console.error("Failed to generate analytics:", error);
      alert("Failed to generate report");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const handleExportContractsExcel = async () => {
    setIsGenerating(true);
    setSelectedReport("contracts-excel");
    try {
      const workbook = await exportContractsToExcel(userId);
      downloadExcel(workbook, `Contracts_${Date.now()}`);
    } catch (error) {
      console.error("Failed to export contracts:", error);
      alert("Failed to export data");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const handleExportPaymentsExcel = async () => {
    setIsGenerating(true);
    setSelectedReport("payments-excel");
    try {
      const workbook = await exportPaymentsToExcel(userId);
      downloadExcel(workbook, `Payments_${Date.now()}`);
    } catch (error) {
      console.error("Failed to export payments:", error);
      alert("Failed to export data");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const handleViewPerformance = async () => {
    setIsGenerating(true);
    setSelectedReport("performance");
    try {
      const metrics = await calculateFarmerPerformance(userId);
      alert(
        `Performance Metrics:\n\n` +
        `Total Contracts: ${metrics.totalContracts}\n` +
        `Active: ${metrics.activeContracts}\n` +
        `Completed: ${metrics.completedContracts}\n` +
        `Total Earnings: K${metrics.totalEarnings.toLocaleString()}\n` +
        `Avg Contract Value: K${metrics.averageContractValue.toLocaleString()}\n` +
        `Completion Rate: ${metrics.completionRate}%`
      );
    } catch (error) {
      console.error("Failed to calculate performance:", error);
      alert("Failed to load performance metrics");
    } finally {
      setIsGenerating(false);
      setSelectedReport("");
    }
  };

  const reports = {
    farmer: [
      {
        id: "payment-pdf",
        title: "Payment History Report",
        description: "Generate PDF report of all your payments",
        icon: DollarSign,
        color: "purple",
        action: handleGeneratePaymentReport,
      },
      {
        id: "contracts-excel",
        title: "Export Contracts",
        description: "Download all contracts as Excel file",
        icon: FileText,
        color: "blue",
        action: handleExportContractsExcel,
      },
      {
        id: "payments-excel",
        title: "Export Payments",
        description: "Download payment history as Excel file",
        icon: Download,
        color: "green",
        action: handleExportPaymentsExcel,
      },
      {
        id: "performance",
        title: "Performance Analytics",
        description: "View your farming performance metrics",
        icon: TrendingUp,
        color: "orange",
        action: handleViewPerformance,
      },
    ],
    officer: [
      {
        id: "payment-pdf",
        title: "Earnings Report",
        description: "Generate PDF report of your earnings",
        icon: DollarSign,
        color: "purple",
        action: handleGeneratePaymentReport,
      },
      {
        id: "payments-excel",
        title: "Export Earnings",
        description: "Download earnings as Excel file",
        icon: Download,
        color: "green",
        action: handleExportPaymentsExcel,
      },
    ],
    admin: [
      {
        id: "analytics-pdf",
        title: "Platform Analytics",
        description: "Generate comprehensive platform report",
        icon: BarChart3,
        color: "blue",
        action: handleGeneratePlatformAnalytics,
      },
      {
        id: "contracts-excel",
        title: "Export All Contracts",
        description: "Download all platform contracts",
        icon: FileText,
        color: "green",
        action: handleExportContractsExcel,
      },
      {
        id: "payments-excel",
        title: "Export All Payments",
        description: "Download all platform payments",
        icon: DollarSign,
        color: "purple",
        action: handleExportPaymentsExcel,
      },
    ],
  };

  const userReports = reports[userRole] || [];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-100 to-blue-50 text-blue-600",
      green: "from-emerald-100 to-emerald-50 text-emerald-600",
      purple: "from-emerald-100 to-emerald-50 text-emerald-600",
      orange: "from-orange-100 to-orange-50 text-orange-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="card-premium">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Reports & Analytics</h2>
          <p className="text-gray-600">Generate and export your data</p>
        </div>
        <FileText className="h-8 w-8 text-[#2d5f3f]" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {userReports.map((report) => {
          const Icon = report.icon;
          const isActive = isGenerating && selectedReport === report.id;

          return (
            <button
              key={report.id}
              onClick={report.action}
              disabled={isGenerating}
              className="card-premium text-left hover:shadow-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${getColorClasses(report.color)} group-hover:scale-110 transition-transform`}>
                  {isActive ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1a1a1a] mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                  {isActive && (
                    <p className="text-xs text-[#2d5f3f] font-semibold mt-2">
                      Generating...
                    </p>
                  )}
                </div>
                <Download className="h-5 w-5 text-gray-400 group-hover:text-[#2d5f3f] transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {userReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No reports available for your role</p>
        </div>
      )}
    </div>
  );
}
