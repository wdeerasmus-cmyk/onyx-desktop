import {
  Activity, Wifi, Globe, Camera, Lock, FolderSearch,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Loader2, Monitor
} from "lucide-react";
import { useState } from "react";
import RiskGauge from "@/components/RiskGauge";
import { useLaptopData } from "@/hooks/useLaptopData";
import { formatDistanceToNow } from "date-fns";

function timeAgo(d: string | Date) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
}

function NotElectron() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8">
      <Monitor className="w-12 h-12 text-zinc-700 mb-4" />
      <p className="text-base font-medium text-zinc-300">Download the Desktop App</p>
      <p className="text-sm text-zinc-600 mt-2 max-w-sm">
        Live process scanning, network monitoring, and system security features require the native Onyx Desktop app.
      </p>
      <a
        href="https://onyxaegis.com"
        target="_blank"
        rel="noreferrer"
        className="mt-6 bg-[#C9A84C] text-black font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#b8963e] transition-colors"
      >
        Download for macOS / Windows →
      </a>
    </div>
  );
}

export default function LaptopSection({ subview }: { subview: string }) {
  const {
    processes, connections, vpn, privacyLog, fileChanges,
    watchInfo, riskScore, loading, lastScan, electron,
    toggleKillSwitch, checkHibp, runScan,
  } = useLaptopData();

  const [hibpEmail, setHibpEmail] = useState("");
  const [hibpLoading, setHibpLoading] = useState(false);
  const [hibpResults, setHibpResults] = useState<any[]>([]);
  const [hibpError, setHibpError] = useState<string | null>(null);

  const handleHibpCheck = async () => {
    if (!hibpEmail) return;
    setHibpLoading(true);
    setHibpError(null);
    const result = await checkHibp(hibpEmail);
    if (Array.isArray(result)) setHibpResults(result);
    else if ((result as any).error) setHibpError((result as any).error);
    setHibpLoading(false);
  };

  if (loading && electron) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
          <span className="text-xs text-zinc-600">Scanning system...</span>
        </div>
      </div>
    );
  }

  if (subview === "laptop-processes") {
    if (!electron) return <NotElectron />;
    const suspicious = processes.filter((p) => p.suspicious);
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Process Monitor</h2>
          <div className="flex items-center gap-3">
            {lastScan && <span className="text-xs text-zinc-600">Scanned {timeAgo(lastScan)}</span>}
            <button onClick={runScan} className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#b8963e]">
              <RefreshCw className="w-3.5 h-3.5" />Refresh
            </button>
          </div>
        </div>
        {suspicious.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">
              <strong>{suspicious.length} suspicious process{suspicious.length > 1 ? "es" : ""}</strong> detected: {suspicious.map((p) => p.name).join(", ")}
            </p>
          </div>
        )}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["Process", "PID", "CPU %", "Mem (MB)", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.slice(0, 40).map((p) => (
                <tr key={p.pid} className={`border-b border-[#111] ${p.suspicious ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-white">
                    <div className="flex items-center gap-1.5">
                      {p.suspicious && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      {p.name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{p.pid}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">{p.cpu.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">{p.mem.toFixed(0)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.suspicious ? "bg-red-500/15 text-red-400" : "bg-green-500/10 text-green-400"
                    }`}>{p.suspicious ? "⚠ Suspicious" : "Clean"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (subview === "laptop-network") {
    if (!electron) return <NotElectron />;
    const flagged = connections.filter((c) => c.risk === "High");
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Network Traffic Analyzer</h2>
          <button onClick={runScan} className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#b8963e]">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
        {flagged.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{flagged.length} connection{flagged.length > 1 ? "s" : ""} flagged by AbuseIPDB (confidence &gt; 50%)</p>
          </div>
        )}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["Local", "Remote IP", "Port", "Proto", "Abuse Score", "Risk"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {connections.map((c, i) => (
                <tr key={i} className={`border-b border-[#111] ${c.risk === "High" ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{c.local}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-white">{c.remote}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{c.port}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{c.proto}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    {c.abuseScore !== null ? `${c.abuseScore}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.risk === "High" ? "bg-red-500/15 text-red-400" :
                      c.risk === "Medium" ? "bg-yellow-500/15 text-yellow-400" :
                      "bg-green-500/10 text-green-400"
                    }`}>{c.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (subview === "laptop-darkweb") {
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Dark Web Monitor</h2>
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Check email for breaches</label>
          <div className="flex gap-2">
            <input
              value={hibpEmail}
              onChange={(e) => setHibpEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHibpCheck()}
              placeholder="email@example.com"
              className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C9A84C]/50"
            />
            <button
              onClick={handleHibpCheck}
              disabled={hibpLoading || !electron}
              className="bg-[#C9A84C] text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#b8963e] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {hibpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Check
            </button>
          </div>
          {!electron && <p className="text-xs text-zinc-600 mt-2">Requires the native desktop app.</p>}
          {hibpError && <p className="text-xs text-red-400 mt-2">{hibpError}</p>}
        </div>
        {hibpResults.length === 0 && !hibpLoading && hibpEmail && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-sm text-green-300">No breaches found for {hibpEmail}</p>
          </div>
        )}
        {hibpResults.map((b: any, i: number) => (
          <div key={i} className="bg-[#0f0f0f] border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-white">{b.Name}</span>
              <span className="text-xs text-zinc-500 ml-auto">{b.BreachDate}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(b.DataClasses || []).map((t: string) => (
                <span key={t} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (subview === "laptop-webcam") {
    if (!electron) return <NotElectron />;
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Webcam / Mic Access Log</h2>
        <p className="text-xs text-zinc-500">Last 24 hours of camera and microphone access events (macOS only)</p>
        {privacyLog.length === 0 ? (
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-8 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No camera or microphone access events in the last 24 hours</p>
          </div>
        ) : (
          <div className="space-y-2">
            {privacyLog.map((entry, i) => (
              <div key={i} className={`bg-[#0f0f0f] border rounded-xl p-4 flex items-center gap-3 ${
                entry.suspicious ? "border-red-500/20" : "border-[#1a1a1a]"
              }`}>
                <Camera className={`w-4 h-4 ${entry.suspicious ? "text-red-400" : "text-[#C9A84C]"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{entry.app}</p>
                  <p className="text-xs text-zinc-500">{entry.type} · {entry.time}</p>
                </div>
                {entry.suspicious && (
                  <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">Unknown App</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (subview === "laptop-vpn") {
    if (!electron) return <NotElectron />;
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">VPN Kill Switch</h2>
        <div className={`bg-[#0f0f0f] border rounded-xl p-6 flex items-center justify-between ${
          vpn.connected ? "border-green-500/20" : "border-red-500/20"
        }`}>
          <div>
            <p className="text-sm font-medium text-white">VPN Status</p>
            <p className={`text-xs mt-0.5 ${vpn.connected ? "text-green-400" : "text-red-400"}`}>
              {vpn.connected ? "Connected" : "Not Connected — Risk elevated"}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${vpn.connected ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
        </div>

        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Kill Switch</p>
            <p className="text-xs text-zinc-500 mt-0.5">Block all traffic if VPN drops (uses OS firewall)</p>
          </div>
          <button
            onClick={() => toggleKillSwitch(!vpn.killSwitchEnabled)}
            className={`w-11 h-6 rounded-full relative transition-colors ${vpn.killSwitchEnabled ? "bg-[#C9A84C]" : "bg-zinc-700"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${vpn.killSwitchEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {vpn.killSwitchEnabled && (
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl p-3">
            <p className="text-xs text-[#C9A84C]">⚡ Kill switch active — internet will be blocked if VPN disconnects</p>
          </div>
        )}
      </div>
    );
  }

  if (subview === "laptop-files") {
    if (!electron) return <NotElectron />;
    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">File Integrity Monitor</h2>
        {watchInfo && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{watchInfo.fileCount.toLocaleString()}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Files hashed (SHA-256)</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{fileChanges.length}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Changes detected</p>
            </div>
          </div>
        )}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Watched Directories</p>
          {(watchInfo?.watching ?? []).map((dir) => (
            <div key={dir} className="flex items-center gap-2 py-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="font-mono text-xs text-zinc-300">{dir}</span>
            </div>
          ))}
        </div>
        {fileChanges.length > 0 && (
          <div className="bg-[#0f0f0f] border border-red-500/20 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1a]">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Recent Changes</p>
            </div>
            {fileChanges.slice(0, 10).map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#111]">
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                  c.type === "modified" ? "bg-yellow-500/10 text-yellow-400" :
                  c.type === "added" ? "bg-green-500/10 text-green-400" :
                  "bg-red-500/10 text-red-400"
                }`}>{c.type}</span>
                <span className="font-mono text-xs text-zinc-300 flex-1 truncate">{c.file}</span>
                <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(c.time)}</span>
              </div>
            ))}
          </div>
        )}
        {fileChanges.length === 0 && (
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No file changes detected</p>
          </div>
        )}
      </div>
    );
  }

  // Laptop Overview
  const suspiciousProcesses = processes.filter((p) => p.suspicious);
  const flaggedConns = connections.filter((c) => c.risk === "High");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Laptop Security Overview</h2>
        {electron && (
          <button onClick={runScan} className="flex items-center gap-1.5 text-xs text-[#C9A84C] hover:text-[#b8963e]">
            <RefreshCw className="w-3.5 h-3.5" />
            {lastScan ? `Scanned ${timeAgo(lastScan)}` : "Scan now"}
          </button>
        )}
      </div>

      {!electron && (
        <div className="bg-[#0f0f0f] border border-[#C9A84C]/20 rounded-xl p-4 flex items-center gap-3">
          <Monitor className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
          <p className="text-sm text-zinc-300">
            Live scanning requires the <a href="https://onyxaegis.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">Onyx Desktop app</a>.
            The data below is a preview.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 flex flex-col items-center">
          <RiskGauge score={electron ? riskScore : 62} size={120} />
          <p className="text-xs text-zinc-500 mt-3">Laptop Risk Score</p>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: "Suspicious Processes", value: electron ? suspiciousProcesses.length : 2, icon: Activity, color: suspiciousProcesses.length > 0 ? "text-red-400" : "text-green-400", bg: suspiciousProcesses.length > 0 ? "bg-red-500/10" : "bg-green-500/10" },
            { label: "Flagged Connections", value: electron ? flaggedConns.length : 1, icon: Wifi, color: flaggedConns.length > 0 ? "text-yellow-400" : "text-green-400", bg: flaggedConns.length > 0 ? "bg-yellow-500/10" : "bg-green-500/10" },
            { label: "File Changes", value: electron ? fileChanges.length : 0, icon: FolderSearch, color: fileChanges.length > 0 ? "text-orange-400" : "text-green-400", bg: "bg-green-500/10" },
            { label: "VPN Status", value: electron ? (vpn.connected ? "ON" : "OFF") : "—", icon: Lock, color: (electron && vpn.connected) ? "text-green-400" : "text-red-400", bg: (electron && vpn.connected) ? "bg-green-500/10" : "bg-red-500/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
                <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {electron && suspiciousProcesses.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">⚠ Threats Detected</p>
          <div className="space-y-1.5">
            {suspiciousProcesses.map((p) => (
              <div key={p.pid} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-zinc-300">Suspicious process: <span className="font-mono text-red-300">{p.name}</span> (PID {p.pid})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {electron && (
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Risk Score Breakdown</p>
          <div className="space-y-2">
            {[
              { label: "Process Risk", value: Math.min(100, suspiciousProcesses.length * 40) },
              { label: "Network Risk", value: Math.min(100, flaggedConns.length * 35) },
              { label: "File Integrity", value: Math.min(100, fileChanges.length * 20) },
              { label: "VPN Coverage", value: vpn.connected ? 0 : 100 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-28 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-[#111] rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[#C9A84C] transition-all" style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-xs text-zinc-600 w-8 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
