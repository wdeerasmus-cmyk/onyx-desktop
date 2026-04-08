const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,

  // Auth
  storeToken: (token) => ipcRenderer.invoke("store-token", token),
  getToken: () => ipcRenderer.invoke("get-token"),
  clearToken: () => ipcRenderer.invoke("clear-token"),
  getMachineId: () => ipcRenderer.invoke("get-machine-id"),

  // Scanning
  scanProcesses: () => ipcRenderer.invoke("scan-processes"),
  scanNetwork: () => ipcRenderer.invoke("scan-network"),
  checkIpAbuse: (ip) => ipcRenderer.invoke("check-ip-abuse", ip),
  checkHibp: (email) => ipcRenderer.invoke("check-hibp", email),
  checkVpn: () => ipcRenderer.invoke("check-vpn"),
  toggleKillSwitch: (enable) => ipcRenderer.invoke("toggle-kill-switch", enable),
  getPrivacyLog: () => ipcRenderer.invoke("get-privacy-log"),
  startFileWatch: (dirs) => ipcRenderer.invoke("start-file-watch", dirs),
  getFileChanges: () => ipcRenderer.invoke("get-file-changes"),
  computeRiskScore: (params) => ipcRenderer.invoke("compute-risk-score", params),

  // Real-time events
  onFileChange: (cb) => ipcRenderer.on("file-change", (_e, data) => cb(data)),
  removeFileChangeListener: () => ipcRenderer.removeAllListeners("file-change"),
});
