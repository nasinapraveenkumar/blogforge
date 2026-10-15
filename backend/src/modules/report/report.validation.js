import { z } from "zod";

export const createReportSchema = z.object({
  reason: z.string().trim().min(5, "Reason must be at least 5 characters").max(1000),
});

export const reviewReportSchema = z.object({
  status: z.enum(["DISMISSED", "ACTION_TAKEN"]),
  note: z.string().trim().max(1000).optional().default(""),
});
