"use client";

import * as React from "react";
import { TeamMember, TeamRole } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Shield, Trash2, CheckCircle, Clock, X } from "lucide-react";

interface TeamSettingsPanelProps {
  members: TeamMember[];
  onAddMember: (member: Omit<TeamMember, "id" | "joinedAt" | "lastActive">) => void;
  onRemoveMember: (id: string) => void;
  onUpdateRole: (id: string, role: TeamRole) => void;
}

export function TeamSettingsPanel({
  members,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: TeamSettingsPanelProps) {
  const { language, t } = useI18n();
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [newMemberName, setNewMemberName] = React.useState("");
  const [newMemberEmail, setNewMemberEmail] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState<TeamRole>("Inventory Clerk");

  const totalMembers = members.length;
  const activeAdmins = members.filter((m) => m.role === "Admin").length;
  const pendingInvites = members.filter((m) => m.status === "Invited").length;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    onAddMember({
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      avatar: newMemberName.slice(0, 2).toUpperCase(),
      status: "Invited",
      permissions: getPermissionsForRole(newMemberRole),
    });

    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("Inventory Clerk");
    setIsInviteOpen(false);
  };

  function getPermissionsForRole(role: TeamRole): string[] {
    switch (role) {
      case "Admin":
        return ["Full Access", "Settings Management", "User Control"];
      case "Store Manager":
        return ["Shop Operations", "Stock In/Out", "Adjustment"];
      case "Inventory Clerk":
        return ["Stock Receiving", "Stock In/Out", "Audit"];
      case "Viewer":
        return ["Read Only Reports", "View Stock"];
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-ink shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.settings.totalTeamMembers}
              </p>
              <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">{totalMembers}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-none border-[3px] border-ink bg-purple-50 text-[#543afd]">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.settings.systemAdmins}
              </p>
              <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">{activeAdmins}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-none border-[3px] border-ink bg-emerald-50 text-emerald-700">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink shadow-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.settings.pendingInvites}
              </p>
              <h3 className="font-heading text-2xl font-bold text-slate-900 mt-1">{pendingInvites}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-none border-[3px] border-ink bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Team Table Card */}
      <Card className="border-ink shadow-none">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Users className="h-5 w-5 text-[#543afd]" /> {t.settings.teamRoles}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {t.settings.teamRolesDesc}
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="h-9 border-1.5 border-black bg-[#543afd] font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-[#462ee0] active:translate-y-px"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> {t.settings.inviteMember}
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">{t.settings.nameAndEmail}</TableHead>
                <TableHead className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">{t.settings.role}</TableHead>
                <TableHead className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">{t.common.status}</TableHead>
                <TableHead className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600">{t.settings.lastActive}</TableHead>
                <TableHead className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 text-right">{t.common.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-slate-50/70">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-none border-[3px] border-ink bg-purple-100 font-mono text-xs font-bold text-[#543afd]">
                        {member.avatar || member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.name}</p>
                        <p className="font-mono text-[11px] text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-3">
                    <Select
                      value={member.role}
                      onValueChange={(val) => onUpdateRole(member.id, (val || "Inventory Clerk") as TeamRole)}
                    >
                      <SelectTrigger className="h-7 w-44 text-xs font-mono font-semibold focus:ring-[#543afd]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">{t.settings.adminFullAccess}</SelectItem>
                        <SelectItem value="Store Manager">{t.settings.storeManager}</SelectItem>
                        <SelectItem value="Inventory Clerk">Inventory Clerk</SelectItem>
                        <SelectItem value="Viewer">{t.settings.viewerReadOnly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="py-3">
                    {member.status === "Active" ? (
                      <span className="inline-flex items-center gap-1 rounded-none border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                        <CheckCircle className="h-3 w-3 text-emerald-600" /> {t.settings.statusActive}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                        <Clock className="h-3 w-3 text-amber-600" /> {t.settings.statusInvited}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 font-mono text-xs text-slate-600">
                    {member.lastActive}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.id)}
                      disabled={members.length <= 1}
                      className="h-7 px-2 text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-30"
                      title={t.settings.removeAccess}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-none border-1.5 border-black bg-white shadow-neo overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-ink bg-purple-50 px-5 py-4">
              <div className="flex items-center gap-2 text-slate-900">
                <UserPlus className="h-5 w-5 text-[#543afd]" />
                <h2 className="font-heading text-base font-bold">{t.settings.inviteNewMember}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-none p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="memberName" className="text-xs font-semibold text-slate-700">
                  {t.settings.fullName}
                </Label>
                <Input
                  id="memberName"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder={t.settings.namePlaceholder}
                  required
                  className="h-9 text-xs focus-visible:ring-[#543afd]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="memberEmail" className="text-xs font-semibold text-slate-700">
                  {t.settings.operationalEmail}
                </Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder={t.settings.emailPlaceholder}
                  required
                  className="h-9 text-xs focus-visible:ring-[#543afd]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  {t.settings.selectRoleAccess}
                </Label>
                <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole((v || "Inventory Clerk") as TeamRole)}>
                  <SelectTrigger className="h-9 text-xs focus:ring-[#543afd]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">{t.settings.adminFullSystem}</SelectItem>
                    <SelectItem value="Store Manager">{t.settings.storeManagerStock}</SelectItem>
                    <SelectItem value="Inventory Clerk">{t.settings.inventoryClerkStock}</SelectItem>
                    <SelectItem value="Viewer">{t.settings.viewerReports}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-9 border-black text-xs font-semibold"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 border-1.5 border-black bg-[#543afd] font-mono text-xs font-bold text-white shadow-neo-sm hover:bg-[#462ee0]"
                >
                  {t.settings.sendInvite}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
