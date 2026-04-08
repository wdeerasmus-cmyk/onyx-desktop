import { Smartphone, Wifi, Shield, AlertTriangle, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import RiskGauge from "@/components/RiskGauge";
import { useMobileData } from "@/hooks/useMobileData";
import { formatDistanceToNow } from "date-fns";

function timeAgo(dateStr: string) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ""; }
}

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "high" || severity === "critical") return <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />;
  if (severity === "medium") return <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />;
  return <Shield className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />;
}

export default function MobileSection({ subview }: { subview: string }) {
  const { deviceScans, networkScans, alerts, latestRiskScore, unreadAlerts, threatsFound, loading } = useMobileData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (subview === "mobile-network") {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Mobile Network Scans</h2>
        {networkScans.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-8 text-center text-zinc-500 text-sm">
            No network scans yet. Run a scan from the mobile app.
          </div>
        ) : (
          <div className="space-y-3">
            {networkScans.map((n) => (
              <div key={n.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-[#C9A84C]" />
                  <div>
                    <p className="text-sm font-medium text-white">{n.ssid || "Unknown Network"}</p>
                    <p className="text-xs text-zinc-500">{n.security_type || "Unknown"} · {timeAgo(n.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  n.risk_level === "high" || n.risk_level === "critical"
                    ? "bg-red-500/10 text-red-400"
                    : n.risk_level === "medium"
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-green-500/10 text-green-400"
                }`}>{n.risk_level ?? "Low"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (subview === "mobile-alerts") {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Mobile Alerts</h2>
        {alerts.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-8 text-center text-zinc-500 text-sm">
            No alerts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`bg-[#0f0f0f] border rounded-xl p-4 flex items-start gap-3 ${
                !a.read ? "border-[#C9A84C]/20" : "border-[#1a1a1a]"
              }`}>
                <AlertIcon severity={a.severity} />
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{a.message}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
                {!a.read && <span className="w-2 h-2 rounded-full bg-[#C9A84C] mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const riskScore = latestRiskScore ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Mobile Overview</h2>
        <button className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#b8963e] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Request New Scan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 flex flex-col items-center">
          <RiskGauge score={riskScore} size={120} />
          <p className="text-xs text-zinc-500 mt-3">Mobile Risk Score</p>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: "Device Scans", value: String(deviceScans.length), icon: Smartphone, color: "text-[#C9A84C]" },
            { label: "Network Scans", value: String(networkScans.length), icon: Wifi, color: "text-blue-400" },
            { label: "Threats Found", value: String(threatsFound), icon: Shield, color: threatsFound > 0 ? "text-red-400" : "text-green-400" },
            { label: "Unread Alerts", value: String(unreadAlerts), icon: AlertTriangle, color: unreadAlerts > 0 ? "text-yellow-400" : "text-zinc-500" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Recent Alerts</p>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <AlertIcon severity={a.severity} />
                <span className="text-zinc-300 flex-1 truncate">{a.message}</span>
                <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && deviceScans.length === 0 && (
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-300">No data yet</p>
          <p className="text-xs text-zinc-600 mt-1">Open the Onyx mobile app to run your first scan</p>
        </div>
      )}
    </div>
  );
}
