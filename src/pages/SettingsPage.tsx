import { Bell, Clock, RefreshCw, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white">Settings</h2>

      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl divide-y divide-[#111]">
        {[
          { label: "Auto-start on login", desc: "Launch Onyx Desktop when you log in", icon: RefreshCw, enabled: true },
          { label: "Desktop notifications", desc: "Show alerts for high-risk events", icon: Bell, enabled: true },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#C9A84C]" />
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${item.enabled ? "bg-[#C9A84C]" : "bg-zinc-700"}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${item.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[#C9A84C]" />
          <p className="text-sm font-medium text-white">Scan Frequency</p>
        </div>
        <div className="flex gap-2">
          {["10 min", "30 min", "60 min"].map((opt) => (
            <button
              key={opt}
              className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                opt === "30 min"
                  ? "bg-[#C9A84C]/10 border-[#C9A84C]/40 text-[#C9A84C] font-medium"
                  : "border-[#1a1a1a] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-[#C9A84C]/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#C9A84C]" />
          <p className="text-sm font-medium text-white">Subscription</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[#C9A84C]">Personal Plan</p>
            <p className="text-xs text-zinc-500 mt-0.5">Active · Renews 2027-04-07</p>
          </div>
          <a href="https://onyxaegis.com" target="_blank" rel="noreferrer"
            className="text-xs text-[#C9A84C] hover:underline">
            Upgrade → Pro
          </a>
        </div>
      </div>
    </div>
  );
}
