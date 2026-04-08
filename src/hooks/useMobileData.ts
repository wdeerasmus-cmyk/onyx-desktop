import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface DeviceScan {
  id: string;
  created_at: string;
  risk_score: number;
  threats_found: number;
  scan_type: string;
  details: any;
}

export interface NetworkScan {
  id: string;
  created_at: string;
  ssid: string;
  security_type: string;
  risk_level: string;
  details: any;
}

export interface Alert {
  id: string;
  created_at: string;
  type: string;
  message: string;
  severity: string;
  read: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  expires_at: string;
}

export function useMobileData() {
  const { user } = useAuth();
  const [deviceScans, setDeviceScans] = useState<DeviceScan[]>([]);
  const [networkScans, setNetworkScans] = useState<NetworkScan[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [deviceRes, networkRes, alertRes, subRes] = await Promise.all([
          supabase
            .from("devicescans")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("networkscans")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("alerts")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

        if (deviceRes.data) setDeviceScans(deviceRes.data);
        if (networkRes.data) setNetworkScans(networkRes.data);
        if (alertRes.data) setAlerts(alertRes.data);
        if (subRes.data) setSubscription(subRes.data);
      } catch (e) {
        console.warn("[useMobileData] fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    const alertSub = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
        (payload) => setAlerts((prev) => [payload.new as Alert, ...prev])
      )
      .subscribe();

    return () => { supabase.removeChannel(alertSub); };
  }, [user]);

  const latestRiskScore = deviceScans[0]?.risk_score ?? null;
  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const threatsFound = deviceScans.reduce((sum, s) => sum + (s.threats_found ?? 0), 0);

  return {
    deviceScans, networkScans, alerts, subscription,
    latestRiskScore, unreadAlerts, threatsFound, loading,
  };
}
