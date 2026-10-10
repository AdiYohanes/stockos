"use server";

import { revalidatePath } from "next/cache";
import { updateShopSettings } from "./server";
import type { SettingsMutationResult } from "./schemas/settings-rpc.schema";

export async function updateShopSettingsAction(input: unknown): Promise<SettingsMutationResult> {
  const result = await updateShopSettings(input);
  if (result.ok) {
    revalidatePath("/settings");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/reports");
  }
  return result;
}
