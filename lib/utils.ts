import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { publicTraceUrl } from "@/lib/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateContractId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CP-${code}`;
}

export const generateQRCode = (contractId: string): string => {
  return publicTraceUrl(contractId);
};

export function calculateMilestonePayment(
  totalAmount: number,
  milestoneIndex: number,
  totalMilestones: number
): number {
  // First 5 milestones get equal portions of 70% of total
  // Final milestone (harvest) gets 30%
  if (milestoneIndex === totalMilestones - 1) {
    return totalAmount * 0.3;
  }
  return (totalAmount * 0.7) / (totalMilestones - 1);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Waiting / in-progress
    pending: "text-amber-700 bg-amber-50",
    submitted: "text-sky-700 bg-sky-50",
    processing: "text-sky-700 bg-sky-50",
    in_progress: "text-sky-700 bg-sky-50",
    assigned: "text-sky-700 bg-sky-50",
    // Positive / success — brand emerald
    verified: "text-emerald-700 bg-emerald-50",
    active: "text-emerald-700 bg-emerald-50",
    paid: "text-emerald-700 bg-emerald-50",
    approved: "text-emerald-700 bg-emerald-50",
    // Terminal neutral
    completed: "text-slate-600 bg-slate-100",
    // Negative
    rejected: "text-red-700 bg-red-50",
    cancelled: "text-red-700 bg-red-50",
    failed: "text-red-700 bg-red-50",
    disputed: "text-red-700 bg-red-50",
  };
  return colors[status?.toLowerCase()] || "text-slate-600 bg-slate-100";
}
