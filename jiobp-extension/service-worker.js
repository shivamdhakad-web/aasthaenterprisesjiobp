const APP_URL = "https://aasthaenterprisesjiobp.vercel.app/"
const PANEL_PATH = "sidepanel.html"

async function configurePanel() {
  await chrome.sidePanel.setOptions({
    path: PANEL_PATH,
    enabled: true,
  })

  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true,
  })
}

chrome.runtime.onInstalled.addListener(() => {
  configurePanel().catch(() => {})
})

chrome.runtime.onStartup.addListener(() => {
  configurePanel().catch(() => {})
})

chrome.action.onClicked.addListener((tab) => {
  configurePanel()
    .then(async () => {
      if (chrome.sidePanel.open && tab?.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId })
      }
    })
    .catch(() => {})
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    if (message?.type === "close-panel") {
      if (chrome.sidePanel.close && message.windowId) {
        await chrome.sidePanel.close({ windowId: message.windowId })
      }
      sendResponse({ ok: true })
      return
    }

    if (message?.type === "open-site") {
      await chrome.tabs.create({ url: APP_URL })
      sendResponse({ ok: true })
      return
    }

    if (message?.type === "reload-panel") {
      sendResponse({ ok: true })
      return
    }

    sendResponse({ ok: false })
  })().catch((error) => {
    sendResponse({ ok: false, error: error?.message || "Unknown error" })
  })

  return true
})
