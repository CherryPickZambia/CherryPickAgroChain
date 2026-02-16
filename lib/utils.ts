import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  return `https://cherrypick.co.zm/trace/${contractId}`;
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
    pending: "text-yellow-600 bg-yellow-50",
    submitted: "text-blue-600 bg-blue-50",
    verified: "text-green-600 bg-green-50",
    rejected: "text-red-600 bg-red-50",
    active: "text-green-600 bg-green-50",
    completed: "text-gray-600 bg-gray-50",
    cancelled: "text-red-600 bg-red-50",
    processing: "text-blue-600 bg-blue-50",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}
