import { type TaskFrequency, type TaskPriority } from "@/generated/prisma";

export function mapFrequency(input?: string | null): TaskFrequency {
  const normalized = input?.toLowerCase().trim();
  switch (normalized) {
    case "once":
      return "ONCE";
    case "daily":
      return "DAILY";
    case "weekly":
      return "WEEKLY";
    case "monthly":
      return "MONTHLY";
    default:
      return "UNKNOWN";
  }
}

export function mapPriority(input?: string | null): TaskPriority {
  const normalized = input?.toLowerCase().trim();
  switch (normalized) {
    case "high":
      return "HIGH";
    case "low":
      return "LOW";
    default:
      return "NORMAL";
  }
}
