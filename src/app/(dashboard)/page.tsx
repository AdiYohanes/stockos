import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockAuthState } from "@/features/auth/mock-auth";

export default async function DashboardHomePage() {
  const { user } = await getMockAuthState();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Welcome to StockOS Stock Management System.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Authentication State</CardDescription>
            <CardTitle className="text-lg">Mock Session Active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium text-foreground">{user?.name || "Demo User"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-mono text-foreground">{user?.email || "demo@stockos.com"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-mono uppercase text-foreground">{user?.role || "admin"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
