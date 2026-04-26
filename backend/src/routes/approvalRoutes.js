const express = require("express")

const {
  getApprovals,
  createApproval,
  approveRequest,
  rejectRequest,
} = require("../controllers/approvalController")

const router = express.Router()

router.get("/", getApprovals)
router.post("/", createApproval)
router.post("/:id/approve", approveRequest)
router.post("/:id/reject", rejectRequest)

module.exports = router