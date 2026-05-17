const path = require("node:path")
const { pathToFileURL } = require("node:url")
const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron")

const isDev = !app.isPackaged
const devServerUrl = process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:5173"
const hostedWebUrl = "https://aasthaenterprisesjiobp.vercel.app"

let mainWindow = null

const getRootPath = () => path.resolve(__dirname, "..")
const getIconPath = () => path.join(getRootPath(), "build-resources", "app-icon.ico")
const getPreloadPath = () => path.join(__dirname, "preload.cjs")
const getErrorPagePath = () => path.join(__dirname, "error.html")

const getAppEntryUrl = () => {
  if (isDev) {
    return devServerUrl
  }

  return hostedWebUrl
}

const getAllowedOrigin = () => new URL(getAppEntryUrl()).origin

const isSafeNavigationTarget = (targetUrl) => {
  try {
    const parsedUrl = new URL(targetUrl)
    return parsedUrl.origin === getAllowedOrigin()
  } catch {
    return false
  }
}

const loadFallbackPage = async (attemptedUrl) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  const errorPageUrl = `${pathToFileURL(getErrorPagePath()).toString()}?url=${encodeURIComponent(
    attemptedUrl || getAppEntryUrl(),
  )}&webUrl=${encodeURIComponent(hostedWebUrl)}`

  await mainWindow.loadURL(errorPageUrl)
}

const loadMainApp = async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  const entryUrl = getAppEntryUrl()
  await mainWindow.loadURL(entryUrl)
}

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    backgroundColor: "#081a35",
    title: "Jio-bp Station Desktop",
    icon: getIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  })

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }

    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeNavigationTarget(url)) {
      return { action: "allow" }
    }

    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isSafeNavigationTarget(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.webContents.on("did-fail-load", async (event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame) {
      return
    }

    const ignoredCodes = new Set([-3])

    if (ignoredCodes.has(errorCode)) {
      return
    }

    console.error("Desktop renderer failed to load:", { errorCode, errorDescription, validatedUrl })
    await loadFallbackPage(validatedUrl)
  })

  mainWindow.webContents.on("render-process-gone", async () => {
    await loadFallbackPage(getAppEntryUrl())
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  await loadMainApp()
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)

  app.setAppUserModelId("com.jiobp.station.desktop")

  ipcMain.handle("desktop:retry-load", async () => {
    await loadMainApp()
    return true
  })

  ipcMain.handle("desktop:open-external", async (_event, url) => {
    if (url) {
      await shell.openExternal(url)
    }

    return true
  })

  await createMainWindow()

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
