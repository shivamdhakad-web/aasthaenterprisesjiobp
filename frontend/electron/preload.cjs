const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("jiobpDesktop", {
  isDesktop: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version || "0.0.0",
  retryLoad: () => ipcRenderer.invoke("desktop:retry-load"),
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", url),
})
