"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import {
  SystemSettings,
  CompanySettings,
  InventorySettings,
  NotificationSettings,
  TeamMember,
} from "../types";
import {
  DEFAULT_SETTINGS,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  resetSettingsStorage,
} from "../mock-data";

// Hydration-safe initial store check for SSR
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useSettings() {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSettingsFromStorage();
    const handle = requestAnimationFrame(() => {
      setSettings(loaded);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const notifyChange = () => {
    setHasUnsavedChanges(true);
  };

  const updateCompany = useCallback((newCompany: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        company: { ...prev.company, ...newCompany },
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    notifyChange();
  }, []);

  const updateInventory = useCallback((newInventory: Partial<InventorySettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        inventory: { ...prev.inventory, ...newInventory },
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    notifyChange();
  }, []);

  const updateNotifications = useCallback((newNotifications: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        notifications: { ...prev.notifications, ...newNotifications },
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
    notifyChange();
  }, []);

  const addTeamMember = useCallback((member: Omit<TeamMember, "id" | "joinedAt" | "lastActive">) => {
    setSettings((prev) => {
      const newMember: TeamMember = {
        ...member,
        id: `usr-${Date.now().toString().slice(-4)}`,
        joinedAt: new Date().toISOString().split("T")[0],
        lastActive: "Just now",
      };
      const updated = {
        ...prev,
        team: [...prev.team, newMember],
        updatedAt: new Date().toISOString(),
      };
      saveSettingsToStorage(updated);
      return updated;
    });
    setLastSavedMessage("Anggota tim baru berhasil ditambahkan!");
    setTimeout(() => setLastSavedMessage(null), 3000);
  }, []);

  const removeTeamMember = useCallback((memberId: string) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        team: prev.team.filter((m) => m.id !== memberId),
        updatedAt: new Date().toISOString(),
      };
      saveSettingsToStorage(updated);
      return updated;
    });
    setLastSavedMessage("Anggota tim berhasil dihapus!");
    setTimeout(() => setLastSavedMessage(null), 3000);
  }, []);

  const updateMemberRole = useCallback((memberId: string, role: TeamMember["role"]) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        team: prev.team.map((m) => (m.id === memberId ? { ...m, role } : m)),
        updatedAt: new Date().toISOString(),
      };
      saveSettingsToStorage(updated);
      return updated;
    });
    setLastSavedMessage("Peran anggota tim berhasil diperbarui!");
    setTimeout(() => setLastSavedMessage(null), 3000);
  }, []);

  const saveAll = useCallback(() => {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    saveSettingsToStorage(updated);
    setSettings(updated);
    setHasUnsavedChanges(false);
    setLastSavedMessage("Semua pengaturan berhasil disimpan!");
    setTimeout(() => setLastSavedMessage(null), 3000);
  }, [settings]);

  const resetAll = useCallback(() => {
    const reset = resetSettingsStorage();
    setSettings(reset);
    setHasUnsavedChanges(false);
    setLastSavedMessage("Pengaturan dikembalikan ke standar awal!");
    setTimeout(() => setLastSavedMessage(null), 3000);
  }, []);

  return {
    isMounted,
    settings,
    hasUnsavedChanges,
    lastSavedMessage,
    updateCompany,
    updateInventory,
    updateNotifications,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,
    saveAll,
    resetAll,
  };
}
