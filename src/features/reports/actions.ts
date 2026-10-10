"use server";

import { exportReport } from "./server";

export async function exportReportAction(input: unknown) {
  return exportReport(input, true);
}
