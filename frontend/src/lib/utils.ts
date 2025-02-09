import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatProbability(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function getSeverityColor(probability: number): string {
  if (probability > 0.9) return "text-red-600";
  if (probability > 0.7) return "text-orange-500";
  return "text-green-600";
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}
