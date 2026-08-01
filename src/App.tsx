import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { ToastProvider } from "@/components/ui/toast";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/protected-route";
import { LoginPage } from "@/pages/login-page";
import { SetupPage } from "@/pages/setup-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { PropertiesPage } from "@/pages/properties-page";
import { UnitsPage } from "@/pages/units-page";
import { TenantsPage } from "@/pages/tenants-page";
import { LeasesPage } from "@/pages/leases-page";
import { TransactionsPage } from "@/pages/transactions-page";
import { RentRollPage } from "@/pages/rent-roll-page";
import { CalendarPage } from "@/pages/calendar-page";
import { TurnsPage } from "@/pages/turns-page";
import { DepositsPage } from "@/pages/deposits-page";
import { MortgagesPage } from "@/pages/mortgages-page";
import { MaintenancePage } from "@/pages/maintenance-page";
import { VendorsPage } from "@/pages/vendors-page";
import { InspectionsPage } from "@/pages/inspections-page";
import { CommunicationsPage } from "@/pages/communications-page";
import { RecurringPage } from "@/pages/recurring-page";
import { DocumentsPage } from "@/pages/documents-page";
import { BudgetsPage } from "@/pages/budgets-page";
import { DealsPage } from "@/pages/deals-page";
import { ScenariosPage } from "@/pages/scenarios-page";
import { TaxExportPage } from "@/pages/tax-export-page";
import { BackupPage } from "@/pages/backup-page";
import { LedgerImportPage } from "@/pages/ledger-import-page";
import { PropertyPnlPage } from "@/pages/property-pnl-page";
import { MapPage } from "@/pages/map-page";
import { AuditPage } from "@/pages/audit-page";
import { QuickAddPage } from "@/pages/quick-add-page";
import { isSoloMode } from "@/lib/demo";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  const solo = isSoloMode();

  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            {solo ? (
              <>
                <Route path="/setup" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/login" element={<LoginPage />} />
              </>
            )}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="properties" element={<PropertiesPage />} />
                <Route path="units" element={<UnitsPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="leases" element={<LeasesPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="rent-roll" element={<RentRollPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="turns" element={<TurnsPage />} />
                <Route path="deposits" element={<DepositsPage />} />
                <Route path="mortgages" element={<MortgagesPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="inspections" element={<InspectionsPage />} />
                <Route path="communications" element={<CommunicationsPage />} />
                <Route path="recurring" element={<RecurringPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="budgets" element={<BudgetsPage />} />
                <Route path="deals" element={<DealsPage />} />
                <Route path="scenarios" element={<ScenariosPage />} />
                <Route path="tax-export" element={<TaxExportPage />} />
                <Route path="backup" element={<BackupPage />} />
                <Route path="ledger-import" element={<LedgerImportPage />} />
                <Route path="property-pnl" element={<PropertyPnlPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="quick-add" element={<QuickAddPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
