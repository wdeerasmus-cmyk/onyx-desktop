import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileSection from "@/pages/MobileSection";
import LaptopSection from "@/pages/LaptopSection";
import SettingsPage from "@/pages/SettingsPage";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("mobile-overview");

  const renderContent = () => {
    if (activeSection === "settings") return <SettingsPage />;
    if (activeSection.startsWith("mobile-")) return <MobileSection subview={activeSection} />;
    if (activeSection.startsWith("laptop-")) return <LaptopSection subview={activeSection} />;
    return null;
  };

  const getSectionTitle = () => {
    if (activeSection.startsWith("mobile-")) return "Mobile";
    if (activeSection.startsWith("laptop-")) return "Laptop";
    return "Settings";
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-[#111] px-6 py-3 flex items-center gap-2">
          <span className="text-xs text-zinc-600 uppercase tracking-widest">{getSectionTitle()}</span>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-400 capitalize">
            {activeSection.replace("mobile-", "").replace("laptop-", "").replace("-", " ")}
          </span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
