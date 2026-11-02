import { useState } from "react";
import Sidebar, { type PageKey } from "./components/layout/Sidebar";
import OverviewPage from "./pages/OverviewPage";
import InventoryPage from "./pages/InventoryPage";
import IncidentsPage from "./pages/IncidentsPage";
import SlaPage from "./pages/SlaPage";
import ReportsPage from "./pages/ReportsPage";
import LiveMonitoringPage from "./pages/LiveMonitoringPage";
import TroubleshootingPage from "./pages/TroubleshootingPage";
import TopologyPage from "./pages/TopologyPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("overview");

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-900 text-slate-100">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      {activePage === "overview" && <OverviewPage />}
      {activePage === "inventory" && <InventoryPage />}
      {activePage === "monitoring" && <LiveMonitoringPage />}
      {activePage === "topology" && <TopologyPage />}
      {activePage === "incidents" && <IncidentsPage />}
      {activePage === "troubleshooting" && <TroubleshootingPage />}
      {activePage === "sla" && <SlaPage />}
      {activePage === "reports" && <ReportsPage />}
      {activePage === "settings" && <SettingsPage />}
    </div>
  );
}