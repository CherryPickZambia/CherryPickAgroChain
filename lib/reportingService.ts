import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  getContractsByFarmer,
  getPaymentsByFarmer,
  getPlatformStats
} from './supabaseService';
import { type Contract, type Payment, type Milestone } from './supabase';

type PaymentWithDetails = Payment & {
  milestone?: Milestone;
  contract?: Contract;
};

// ==================== PDF REPORTS ====================

/**
 * Generate Contract Summary PDF
 */
export async function generateContractPDF(contractId: string, contractData: any) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(45, 95, 63);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('AgroChain360', 20, 20);
  doc.setFontSize(16);
  doc.text('Contract Summary Report', 20, 32);

  // Contract Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let yPos = 55;

  doc.setFont('helvetica', 'bold');
  doc.text('Contract Information', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 10;

  const contractInfo = [
    ['Contract ID:', contractData.id],
    ['Crop Type:', `${contractData.crop_type} - ${contractData.variety}`],
    ['Required Quantity:', `${contractData.required_quantity} kg`],
    ['Price per kg:', `K${contractData.discounted_price}`],
    ['Total Value:', `K${(contractData.required_quantity * contractData.discounted_price).toLocaleString()}`],
    ['Status:', contractData.status.toUpperCase()],
    ['Created Date:', new Date(contractData.created_at).toLocaleDateString()],
  ];

  contractInfo.forEach(([label, value]) => {
    doc.text(label, 20, yPos);
    doc.text(value, 80, yPos);
    yPos += 8;
  });

  // Milestones Table
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Milestones', 20, yPos);
  yPos += 5;

  const milestoneData = contractData.milestones?.map((m: Milestone) => [
    m.name,
    m.expected_date,
    m.status,
    `K${m.payment_amount}`,
    m.payment_status,
  ]) || [];

  autoTable(doc, {
    startY: yPos,
    head: [['Milestone', 'Expected Date', 'Status', 'Payment', 'Payment Status']],
    body: milestoneData,
    theme: 'grid',
    headStyles: { fillColor: [45, 95, 63] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }

  return doc;
}

/**
 * Generate Payment Report PDF
 */
export async function generatePaymentReportPDF(farmerId: string) {
  const payments = await getPaymentsByFarmer(farmerId);
  const doc = new jsPDF();

  // Header
  doc.setFillColor(45, 95, 63);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('AgroChain360', 20, 20);
  doc.setFontSize(16);
  doc.text('Payment History Report', 20, 32);

  // Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  let yPos = 55;

  const totalEarnings = (payments as PaymentWithDetails[])
    .filter((p: PaymentWithDetails) => p.status === 'completed')
    .reduce((sum: number, p: PaymentWithDetails) => sum + p.amount, 0);

  const completedPayments = (payments as PaymentWithDetails[]).filter((p: PaymentWithDetails) => p.status === 'completed').length;
  const pendingPayments = (payments as PaymentWithDetails[]).filter((p: PaymentWithDetails) => p.status === 'pending').length;

  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 10;

  doc.text(`Total Earnings: K${totalEarnings.toLocaleString()}`, 20, yPos);
  yPos += 8;
  doc.text(`Completed Payments: ${completedPayments}`, 20, yPos);
  yPos += 8;
  doc.text(`Pending Payments: ${pendingPayments}`, 20, yPos);
  yPos += 15;

  // Payments Table
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', 20, yPos);
  yPos += 5;

  const paymentData = (payments as PaymentWithDetails[]).map((p: PaymentWithDetails) => [
    new Date(p.created_at).toLocaleDateString(),
    p.milestone?.name || 'N/A',
    p.contract?.crop_type || 'N/A',
    `K${p.amount.toLocaleString()}`,
    p.status,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Milestone', 'Crop', 'Amount', 'Status']],
    body: paymentData,
    theme: 'grid',
    headStyles: { fillColor: [45, 95, 63] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Generate Platform Analytics PDF (Admin)
 */
export async function generatePlatformAnalyticsPDF() {
  const stats = await getPlatformStats();
  const doc = new jsPDF();

  // Header
  doc.setFillColor(45, 95, 63);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('AgroChain360', 20, 20);
  doc.setFontSize(16);
  doc.text('Platform Analytics Report', 20, 32);

  // Platform Stats
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  let yPos = 55;

  doc.setFont('helvetica', 'bold');
  doc.text('Platform Overview', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 15;

  // Stats boxes
  const statsData = [
    { label: 'Total Farmers', value: stats.totalFarmers },
    { label: 'Active Contracts', value: stats.totalContracts },
    { label: 'Extension Officers', value: stats.totalOfficers },
    { label: 'Platform Revenue', value: `K${stats.totalRevenue.toLocaleString()}` },
  ];

  statsData.forEach((stat, index) => {
    const xPos = 20 + (index % 2) * 90;
    const yOffset = Math.floor(index / 2) * 40;

    doc.setFillColor(240, 247, 244);
    doc.roundedRect(xPos, yPos + yOffset, 80, 30, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(stat.label, xPos + 5, yPos + yOffset + 10);

    doc.setFontSize(18);
    doc.setTextColor(45, 95, 63);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value.toString(), xPos + 5, yPos + yOffset + 23);
    doc.setFont('helvetica', 'normal');
  });

  yPos += 90;

  // Additional analytics can be added here
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, yPos);

  return doc;
}

// ==================== EXCEL/CSV EXPORTS ====================

/**
 * Export Contracts to Excel
 */
export async function exportContractsToExcel(farmerId: string) {
  const contracts = await getContractsByFarmer(farmerId);

  const data = contracts.map((contract: any) => ({
    'Contract ID': contract.id,
    'Crop Type': contract.crop_type,
    'Variety': contract.variety,
    'Quantity (kg)': contract.required_quantity,
    'Price per kg': contract.discounted_price,
    'Total Value': contract.required_quantity * contract.discounted_price,
    'Status': contract.status,
    'Created Date': new Date(contract.created_at).toLocaleDateString(),
    'Harvest Date': contract.harvest_date ? new Date(contract.harvest_date).toLocaleDateString() : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

  const maxWidth = data.reduce((w: Record<string, number>, r: Record<string, unknown>) => {
    return Object.keys(r).reduce((acc: Record<string, number>, k) => {
      acc[k] = Math.max(w[k] || 10, String(r[k]).length);
      return acc;
    }, w);
  }, {});

  worksheet['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: maxWidth[k] + 2 }));

  return workbook;
}

/**
 * Export Payments to Excel
 */
export async function exportPaymentsToExcel(farmerId: string) {
  const payments = await getPaymentsByFarmer(farmerId);

  const data = (payments as PaymentWithDetails[]).map((payment: PaymentWithDetails) => ({
    'Payment ID': payment.id,
    'Date': new Date(payment.created_at).toLocaleDateString(),
    'Milestone': payment.milestone?.name || 'N/A',
    'Crop Type': payment.contract?.crop_type || 'N/A',
    'Amount': payment.amount,
    'Status': payment.status,
    'Transaction Hash': payment.transaction_hash,
    'Completed Date': payment.completed_at ? new Date(payment.completed_at).toLocaleDateString() : 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  return workbook;
}

/**
 * Export to CSV
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================== DOWNLOAD HELPERS ====================

/**
 * Download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

/**
 * Download Excel
 */
export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ==================== PERFORMANCE ANALYTICS ====================

/**
 * Calculate Farmer Performance Metrics
 */
export async function calculateFarmerPerformance(farmerId: string) {
  const contracts = await getContractsByFarmer(farmerId);
  const payments = await getPaymentsByFarmer(farmerId);

  const totalContracts = contracts.length;
  const activeContracts = contracts.filter((c: Contract) => c.status === 'active').length;
  const completedContracts = contracts.filter((c: Contract) => c.status === 'completed').length;

  const totalEarnings = (payments as PaymentWithDetails[])
    .filter((p: PaymentWithDetails) => p.status === 'completed')
    .reduce((sum: number, p: PaymentWithDetails) => sum + p.amount, 0);

  const averageContractValue = totalContracts > 0
    ? contracts.reduce((sum: number, c: Contract) => sum + (c.required_quantity * (c as any).discounted_price || c.price_per_kg), 0) / totalContracts
    : 0;

  const completionRate = totalContracts > 0
    ? (completedContracts / totalContracts) * 100
    : 0;

  return {
    totalContracts,
    activeContracts,
    completedContracts,
    totalEarnings,
    averageContractValue,
    completionRate: completionRate.toFixed(2),
  };
}
