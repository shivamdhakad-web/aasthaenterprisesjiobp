const ApprovalRequest = require("../models/ApprovalRequest")
const { executeApprovalRequest } = require("../services/approvalExecutor")

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

const snapshotUser = (user) => ({
  role: user.role,
  name: user.name,
  employeeId: user.employeeId,
})

const buildRetentionQuery = () => {
  const cutoff = new Date(Date.now() - RETENTION_MS)
  return {
    cutoff,
    createdAt: { $gte: cutoff },
  }
}

exports.getApprovals = async (req, res) => {
  try {
    const { cutoff, createdAt } = buildRetentionQuery()
    const query =
      req.user.role === "Admin"
        ? { createdAt }
        : { "requester.role": "Manager", createdAt }

    await ApprovalRequest.deleteMany({
      $or: [
        { createdAt: { $lt: cutoff } },
        { expiresAt: { $lt: new Date() } },
      ],
    })

    const data = await ApprovalRequest.find(query).sort({ createdAt: -1 })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createApproval = async (req, res) => {
  try {
    const approval = await ApprovalRequest.create({
      ...req.body,
      requester: snapshotUser(req.user),
      expiresAt: new Date(Date.now() + RETENTION_MS),
    })

    res.status(201).json({
      pending: true,
      message: "Request sent for admin approval",
      request: approval,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.approveRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ message: "Approval request not found" })
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "This request is already processed" })
    }

    const result = await executeApprovalRequest(request.toObject())

    request.status = "approved"
    request.reviewer = snapshotUser(req.user)
    request.reviewNote = req.body.note || ""
    request.resultId = result?._id ? result._id.toString() : request.resultId
    request.processedAt = new Date()
    request.errorMessage = ""
    await request.save()

    res.json({
      message: "Request approved",
      request,
      result,
    })
  } catch (error) {
    const request = await ApprovalRequest.findById(req.params.id)

    if (request) {
      request.status = "rejected"
      request.reviewer = snapshotUser(req.user)
      request.reviewNote = req.body.note || "Auto-rejected because approval execution failed"
      request.processedAt = new Date()
      request.errorMessage = error.message
      await request.save()
    }

    res.status(500).json({ message: error.message })
  }
}

exports.rejectRequest = async (req, res) => {
  try {
    const request = await ApprovalRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ message: "Approval request not found" })
    }

    request.status = "rejected"
    request.reviewer = snapshotUser(req.user)
    request.reviewNote = req.body.note || "Rejected by admin"
    request.processedAt = new Date()
    await request.save()

    res.json({
      message: "Request rejected",
      request,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
