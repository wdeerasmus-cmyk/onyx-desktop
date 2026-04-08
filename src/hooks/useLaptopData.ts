import { useEffect, useState, useCallback, useRef } from "react";

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      scanProcesses: () => Promise<ProcessEntry[]>;
      scanNetwork: () => Promise<NetworkConn[]>;
      checkIpAbuse: (ip: string) => Promise<number | null>;
      checkHibp: (email: string) => Promise<BreachEntry[] | { error: string }>;
      checkVpn: () => Promise<VpnStatus>;
      toggleKillSwitch: (enable: boolean) => Promise<boolean>;
      getPrivacyLog: () => Promise<PrivacyEntry[]>;
      startFileWatch: (dirs: string[]) => Promise<{ watching: string[]; fileCount: number }>;
      getFileChanges: () => Promise<FileChange[]>;
      computeRiskScore: (params: RiskParams) => Promise<number>;
      onFileChange: (cb: (data: FileChange) => void) => void;
      removeFileChangeListener: () => void;
    };
  }
}

export interface ProcessEntry {
  name: string; pid: number; cpu: number; mem: number; suspicious: boolean;
}
export interface NetworkConn {
  local: string; remote: string; port: number; proto: string;
  risk: string; abuseScore: number | null;
}
export interface VpnStatus {
  connected: boolean; killSwitchEnabled: boolean; interfaces: string[];
}
export interface PrivacyEntry {
  app: string; type: string; time: string; suspicious: boolean;
}
export interface FileChange {
  file: string; type: "modified" | "added" | "deleted"; time: string;
}
export interface BreachEntry {
  Name: string; BreachDate: string; DataClasses: string[];
}
export interface RiskParams {
  processRisk: number; networkRisk: number; fileRisk: number;
  darkWebRisk: number; noVpn: boolean;
}

const isElectron = () => typeof window !== "undefined" && !!window.electronAPI;

const DEFAULT_WATCH_DIRS = {
  darwin: ["/etc", "/usr/bin", "/Library/LaunchAgents"],
  win32: ["C:\\Windows\\System32"],
  linux: ["/etc", "/usr/bin"],
};

export function useLaptopData() {
  const [processes, setProcesses] = useState<ProcessEntry[]>([]);
  const [connections, setConnections] = useState<NetworkConn[]>([]);
  const [vpn, setVpn] = useState<VpnStatus>({ connected: false, killSwitchEnabled: false, interfaces: [] });
  const [privacyLog, setPrivacyLog] = useState<PrivacyEntry[]>([]);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [watchInfo, setWatchInfo] = useState<{ watching: string[]; fileCount: number } | null>(null);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const electron = isElectron();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runScan = useCallback(async () => {
    if (!electron) { setLoading(false); return; }
    const api = window.electronAPI!;
    try {
      const [procs, conns, vpnStatus, privLog] = await Promise.all([
        api.scanProcesses(),
        api.scanNetwork(),
        api.checkVpn(),
        api.getPrivacyLog(),
      ]);
      setProcesses(procs);
      setVpn(vpnStatus);
      setPrivacyLog(privLog);

      // Enrich network with AbuseIPDB scores
      const enriched = await Promise.all(conns.map(async (c) => {
        const score = await api.checkIpAbuse(c.remote);
        return { ...c, abuseScore: score, risk: score !== null && score > 50 ? "High" : score !== null && score > 20 ? "Medium" : c.risk };
      }));
      setConnections(enriched);

      // Compute risk score
      const suspCount = procs.filter((p) => p.suspicious).length;
      const flaggedConns = enriched.filter((c) => c.risk === "High").length;
      const changes = await api.getFileChanges();
      setFileChanges(changes);

      const score = await api.computeRiskScore({
        processRisk: Math.min(100, suspCount * 40),
        networkRisk: Math.min(100, flaggedConns * 35),
        fileRisk: Math.min(100, changes.length * 20),
        darkWebRisk: 0,
        noVpn: !vpnStatus.connected,
      });
      setRiskScore(score);
      setLastScan(new Date());
    } catch (e) {
      console.warn("[useLaptopData] scan error:", e);
    } finally {
      setLoading(false);
    }
  }, [electron]);

  const startWatching = useCallback(async () => {
    if (!electron) return;
    const platform = (window.electronAPI!.platform || "darwin") as "darwin" | "win32" | "linux";
    const dirs = DEFAULT_WATCH_DIRS[platform] ?? DEFAULT_WATCH_DIRS.darwin;
    const info = await window.electronAPI!.startFileWatch(dirs);
    setWatchInfo(info);
    window.electronAPI!.onFileChange((change) => {
      setFileChanges((prev) => [change, ...prev].slice(0, 50));
    });
  }, [electron]);

  const toggleKillSwitch = useCallback(async (enable: boolean) => {
    if (!electron) return;
    await window.electronAPI!.toggleKillSwitch(enable);
    setVpn((prev) => ({ ...prev, killSwitchEnabled: enable }));
  }, [electron]);

  const checkHibp = useCallback(async (email: string) => {
    if (!electron) return [];
    return window.electronAPI!.checkHibp(email);
  }, [electron]);

  useEffect(() => {
    runScan();
    startWatching();
    intervalRef.current = setInterval(runScan, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.electronAPI?.removeFileChangeListener();
    };
  }, [runScan, startWatching]);

  return {
    processes, connections, vpn, privacyLog, fileChanges,
    watchInfo, riskScore, loading, lastScan, electron,
    toggleKillSwitch, checkHibp, runScan,
  };
}
