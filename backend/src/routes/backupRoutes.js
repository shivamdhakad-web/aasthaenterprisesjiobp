const express = require("express")
const {
  createBackup,
  deleteBackup,
  downloadBackup,
  compareBackups,
  emergencyRestoreLatest,
  getRestoreDiff,
  healthCheckBackup,
  listBackups,
  listBackupLogs,
  previewStoredBackup,
  previewUploadedBackup,
  restoreBackup,
  toggleBackupLock,
} = require("../controllers/backupController")

const router = express.Router()

router.get("/", listBackups)
router.post("/create", createBackup)
router.post("/preview-upload", previewUploadedBackup)
router.post("/diff", getRestoreDiff)
router.post("/health-check", healthCheckBackup)
router.post("/compare", compareBackups)
router.post("/emergency-restore-latest", emergencyRestoreLatest)
router.post("/restore", restoreBackup)
router.get("/logs", listBackupLogs)
router.get("/:id/download", downloadBackup)
router.get("/:id/preview", previewStoredBackup)
router.patch("/:id/lock", toggleBackupLock)
router.delete("/:id", deleteBackup)

module.exports = router
