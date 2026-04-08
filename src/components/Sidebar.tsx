import {
  Shield, Smartphone, Monitor, Settings, ChevronDown, ChevronRight,
  Wifi, Activity, Globe, Camera, Lock, FolderSearch, LogOut, Bell
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const mobileItems = [
  { id: "mobile-overview", label: "Overview", icon: Activity },
  { id: "mobile-network", label: "Network Scan", icon: Wifi },
  { id: "mobile-alerts", label: "Alerts", icon: Bell },
];

const laptopItems = [
  { id: "laptop-processes", label: "Process Monitor", icon: Activity },
  { id: "laptop-network", label: "Network Traffic", icon: Wifi },
  { id: "laptop-darkweb", label: "Dark Web Monitor", icon: Globe },
  { id: "laptop-webcam", label: "Webcam / Mic Log", icon: Camera },
  { id: "laptop-vpn", label: "VPN Kill Switch", icon: Lock },
  { id: "laptop-files", label: "File Integrity", icon: FolderSearch },
];

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(true);
  const [laptopOpen, setLaptopOpen] = useState(true);

  return (
    <aside className="w-56 h-screen bg-[#050505] border-r border-[#111] flex flex-col flex-shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#111]">
        <Shield className="w-6 h-6 text-[#C9A84C]" strokeWidth={1.5} />
        <span className="font-bold text-white tracking-tight">Onyx</span>
        <span className="text-[10px] text-[#C9A84C] font-medium ml-auto bg-[#C9A84C]/10 px-1.5 py-0.5 rounded">DESKTOP</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile
            {mobileOpen ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
          {mobileOpen && (
            <div className="mt-1 space-y-0.5 pl-2">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id
                        ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setLaptopOpen(!laptopOpen)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            Laptop
            {laptopOpen ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
          {laptopOpen && (
            <div className="mt-1 space-y-0.5 pl-2">
              {laptopItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id
                        ? "bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-[#111] p-3 space-y-1">
        <button
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
            activeSection === "settings"
              ? "bg-[#C9A84C]/10 text-[#C9A84C]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>

        <div className="flex items-center gap-2 px-2.5 py-2">
          <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#C9A84C]">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <span className="text-xs text-zinc-500 truncate flex-1">{user?.email}</span>
          <button onClick={signOut} className="text-zinc-600 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
