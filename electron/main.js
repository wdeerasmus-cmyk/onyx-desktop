const { app, BrowserWindow, shell, ipcMain, safeStorage } = require("electron");
const path = require("path");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");

let mainWindow;
let fileWatchers = {};
let fileHashes = {};
let fileChanges = [];
let vpnKillSwitchEnabled = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0A0A0A",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:25632/onyx-desktop/");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/public/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── Auth token (safeStorage) ─────────────────────────────────────────────
ipcMain.handle("store-token", (_e, token) => {
  if (safeStorage.isEncryptionAvailable()) {
    const enc = safeStorage.encryptString(token);
    fs.writeFileSync(path.join(app.getPath("userData"), "auth.enc"), enc);
    return true;
  }
  return false;
});

ipcMain.handle("get-token", () => {
  try {
    const enc = fs.readFileSync(path.join(app.getPath("userData"), "auth.enc"));
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(enc) : null;
  } catch { return null; }
});

ipcMain.handle("clear-token", () => {
  try { fs.unlinkSync(path.join(app.getPath("userData"), "auth.enc")); } catch {}
});

// ─── Machine ID ───────────────────────────────────────────────────────────
ipcMain.handle("get-machine-id", () => {
  try { return require("node-machine-id").machineIdSync(); }
  catch { return "desktop-" + crypto.randomBytes(8).toString("hex"); }
});

// ─── Process Monitor ─────────────────────────────────────────────────────
const SUSPICIOUS_NAMES = [
  "flexispy","mspy","spyware","keylogger","pegasus","stingray",
  "netwiretorchrat","xloader","agent tesla","njrat","darkcomet",
  "remcos","asyncrat","quasar","gh0st","poison ivy","xtreme rat",
  "houdini","bandook","warzone","nanocore","netwire","luminosity",
  "revenge rat","pupy","cobaltstrike","meterpreter","mimikatz","lazagne",
];

function isSuspicious(name) {
  const n = name.toLowerCase();
  return SUSPICIOUS_NAMES.some((s) => n.includes(s));
}

ipcMain.handle("scan-processes", async () => {
  try {
    let output = "";
    if (process.platform === "darwin" || process.platform === "linux") {
      output = execSync("ps aux --no-headers 2>/dev/null || ps aux", { timeout: 5000 }).toString();
      const lines = output.trim().split("\n").slice(0, 80);
      return lines.map((line) => {
        const parts = line.trim().split(/\s+/);
        const name = (parts[10] || "").split("/").pop().split(" ")[0];
        return {
          name,
          pid: parseInt(parts[1]) || 0,
          cpu: parseFloat(parts[2]) || 0,
          mem: parseFloat(parts[3]) || 0,
          suspicious: isSuspicious(name),
        };
      }).filter((p) => p.name && p.pid);
    } else if (process.platform === "win32") {
      output = execSync('wmic process get Name,ProcessId,PercentProcessorTime,WorkingSetSize /format:csv', { timeout: 8000 }).toString();
      const lines = output.trim().split("\n").slice(2);
      return lines.map((line) => {
        const parts = line.split(",");
        const name = (parts[2] || "").trim();
        return {
          name,
          pid: parseInt(parts[3]) || 0,
          cpu: parseFloat(parts[1]) || 0,
          mem: Math.round((parseInt(parts[4]) || 0) / 1024 / 1024),
          suspicious: isSuspicious(name),
        };
      }).filter((p) => p.name && p.pid);
    }
    return [];
  } catch (e) { return []; }
});

// ─── Network Connections ──────────────────────────────────────────────────
ipcMain.handle("scan-network", async () => {
  try {
    let output = "";
    if (process.platform === "darwin") {
      output = execSync("netstat -anp tcp 2>/dev/null | head -60", { timeout: 5000 }).toString();
    } else if (process.platform === "linux") {
      output = execSync("ss -tnp 2>/dev/null | head -60", { timeout: 5000 }).toString();
    } else if (process.platform === "win32") {
      output = execSync("netstat -ano 2>nul", { timeout: 8000 }).toString();
    }

    const connections = [];
    const lines = output.trim().split("\n").slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const local = parts[3] || parts[1] || "";
      const remote = parts[4] || parts[2] || "";
      if (!remote || remote === "*.*" || remote === "0.0.0.0:*" || remote === ":::*") continue;
      const remoteIp = remote.split(":").slice(0, -1).join(":") || remote;
      const port = parseInt(remote.split(":").pop()) || 0;
      const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|::1|fe80)/.test(remoteIp);
      connections.push({
        local,
        remote: remoteIp,
        port,
        proto: "TCP",
        risk: isPrivate ? "Low" : "Unknown",
        abuseScore: null,
      });
    }
    return connections.slice(0, 30);
  } catch { return []; }
});

// ─── AbuseIPDB check ─────────────────────────────────────────────────────
ipcMain.handle("check-ip-abuse", async (_e, ip) => {
  return new Promise((resolve) => {
    const apiKey = process.env.ABUSEIPDB_KEY || "";
    if (!apiKey || !ip || ip.startsWith("192.168") || ip.startsWith("10.") || ip === "127.0.0.1") {
      return resolve(null);
    }
    const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=30`;
    const req = https.get(url, { headers: { Key: apiKey, Accept: "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data).data?.abuseConfidenceScore ?? null); }
        catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(4000, () => { req.destroy(); resolve(null); });
  });
});

// ─── HaveIBeenPwned ───────────────────────────────────────────────────────
ipcMain.handle("check-hibp", async (_e, email) => {
  return new Promise((resolve) => {
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
    const req = https.get(url, {
      headers: {
        "hibp-api-key": process.env.HIBP_API_KEY || "",
        "User-Agent": "Onyx-Desktop",
      }
    }, (res) => {
      if (res.statusCode === 404) return resolve([]);
      if (res.statusCode === 401) return resolve({ error: "HIBP API key required" });
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve([]); }
      });
    });
    req.on("error", () => resolve([]));
    req.setTimeout(8000, () => { req.destroy(); resolve([]); });
  });
});

// ─── VPN Detection ────────────────────────────────────────────────────────
ipcMain.handle("check-vpn", () => {
  try {
    let output = "";
    if (process.platform === "darwin" || process.platform === "linux") {
      output = execSync("ifconfig 2>/dev/null || ip link show 2>/dev/null", { timeout: 3000 }).toString();
      const hasVPN = /tun\d|utun\d|ppp\d|wg\d|proton/.test(output);
      return { connected: hasVPN, killSwitchEnabled: vpnKillSwitchEnabled, interfaces: [] };
    } else if (process.platform === "win32") {
      output = execSync("ipconfig", { timeout: 3000 }).toString();
      const hasVPN = /tun|vpn|proton|nordvpn|expressvpn/i.test(output);
      return { connected: hasVPN, killSwitchEnabled: vpnKillSwitchEnabled, interfaces: [] };
    }
    return { connected: false, killSwitchEnabled: vpnKillSwitchEnabled, interfaces: [] };
  } catch { return { connected: false, killSwitchEnabled: false, interfaces: [] }; }
});

ipcMain.handle("toggle-kill-switch", async (_e, enable) => {
  vpnKillSwitchEnabled = enable;
  if (process.platform === "darwin") {
    if (enable) {
      execSync(`sudo pfctl -e 2>/dev/null; echo "block all\\npass on lo0\\npass on utun0\\npass on tun0" | sudo pfctl -f - 2>/dev/null`, { timeout: 5000 });
    } else {
      execSync("sudo pfctl -d 2>/dev/null", { timeout: 5000 });
    }
  }
  return vpnKillSwitchEnabled;
});

// ─── Webcam/Mic Access Log ────────────────────────────────────────────────
ipcMain.handle("get-privacy-log", () => {
  try {
    if (process.platform === "darwin") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace("T", " ").slice(0, 19);
      const out = execSync(
        `log show --predicate 'subsystem == "com.apple.TCC"' --style syslog --start '${since}' 2>/dev/null | head -50`,
        { timeout: 8000 }
      ).toString();
      const entries = [];
      for (const line of out.split("\n")) {
        const camMatch = line.match(/CAMERA|kTCCServiceCamera/i);
        const micMatch = line.match(/MICROPHONE|kTCCServiceMicrophone/i);
        if (camMatch || micMatch) {
          const appMatch = line.match(/requestor: ([^\s,]+)/);
          entries.push({
            app: appMatch?.[1] || "Unknown App",
            type: camMatch ? "Camera" : "Microphone",
            time: line.slice(0, 23),
            suspicious: false,
          });
        }
      }
      return entries.slice(0, 20);
    }
    return [];
  } catch { return []; }
});

// ─── File Integrity Monitor ───────────────────────────────────────────────
function hashFile(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  } catch { return null; }
}

function walkDir(dir, maxFiles = 500) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const full = path.join(dir, entry.name);
      if (entry.isFile()) files.push(full);
      else if (entry.isDirectory() && !entry.name.startsWith(".")) {
        files.push(...walkDir(full, maxFiles - files.length));
      }
    }
  } catch {}
  return files;
}

ipcMain.handle("start-file-watch", async (_e, dirs) => {
  const chokidar = require("chokidar");
  for (const dir of dirs) {
    if (fileWatchers[dir]) continue;
    const files = walkDir(dir, 300);
    for (const f of files) {
      fileHashes[f] = hashFile(f);
    }
    const watcher = chokidar.watch(dir, { persistent: true, ignoreInitial: true, depth: 3 });
    watcher.on("change", (f) => {
      const newHash = hashFile(f);
      if (newHash !== fileHashes[f]) {
        fileChanges.push({ file: f, type: "modified", time: new Date().toISOString() });
        fileHashes[f] = newHash;
        mainWindow?.webContents.send("file-change", { file: f, type: "modified" });
      }
    });
    watcher.on("add", (f) => {
      fileChanges.push({ file: f, type: "added", time: new Date().toISOString() });
      mainWindow?.webContents.send("file-change", { file: f, type: "added" });
    });
    watcher.on("unlink", (f) => {
      fileChanges.push({ file: f, type: "deleted", time: new Date().toISOString() });
      mainWindow?.webContents.send("file-change", { file: f, type: "deleted" });
    });
    fileWatchers[dir] = watcher;
  }
  return { watching: Object.keys(fileWatchers), fileCount: Object.keys(fileHashes).length };
});

ipcMain.handle("get-file-changes", () => fileChanges.slice(-50));

// ─── AI Risk Score ─────────────────────────────────────────────────────────
ipcMain.handle("compute-risk-score", (_e, { processRisk, networkRisk, fileRisk, darkWebRisk, noVpn }) => {
  const score = Math.round(
    processRisk  * 0.30 +
    networkRisk  * 0.30 +
    fileRisk     * 0.20 +
    darkWebRisk  * 0.10 +
    (noVpn ? 100 : 0) * 0.10
  );
  return Math.min(100, Math.max(0, score));
});
