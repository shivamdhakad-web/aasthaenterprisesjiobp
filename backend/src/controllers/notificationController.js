const Notification = require("../models/Notification")
const Employee = require("../models/Employee")

const buildUserKey = (user) =>
  user.role === "Employee" ? `${user.role}:${user.employeeId}` : `${user.role}:${user.name}`

const MANAGER_KEY = "Manager:Manager"

const unique = (values) => [...new Set(values.filter(Boolean))]

const resolveRecipientKeys = async (notification) => {
  if (notification.recipientKeys?.length) {
    return unique(notification.recipientKeys)
  }

  const keys = []

  if (notification.targetRoles?.includes("Manager")) {
    keys.push(MANAGER_KEY)
  }

  if (notification.targetRoles?.includes("Employee")) {
    const employees = await Employee.find({ status: "Active" }).select("_id")
    employees.forEach((employee) => {
      keys.push(`Employee:${employee._id.toString()}`)
    })
  }

  ;(notification.targetEmployeeIds || []).forEach((value) => {
    keys.push(`Employee:${value.toString()}`)
  })

  return unique(keys)
}

const canViewNotification = (notification, user) => {
  if (user.role === "Admin") {
    return true
  }

  if (notification.targetRoles.includes(user.role)) {
    return true
  }

  if (
    user.role === "Employee" &&
    notification.targetEmployeeIds.some((value) => value.toString() === user.employeeId)
  ) {
    return true
  }

  return false
}

const normalizeNotification = async (notification, user) => {
  const object = notification.toObject()
  const userKey = buildUserKey(user)
  const recipientKeys = (await resolveRecipientKeys(notification)).filter((key) => key !== "Admin:Admin")
  const readKeys = new Set(object.readBy.map((item) => item.userId))
  const unreadCount = recipientKeys.filter((key) => !readKeys.has(key)).length

  const isRead =
    user.role === "Admin"
      ? unreadCount === 0
      : object.readBy.some((item) => item.userId === userKey)

  return {
    ...object,
    isRead,
    unreadCount: user.role === "Admin" ? unreadCount : undefined,
    recipientKeys,
  }
}

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 })

    const visible = await Promise.all(
      notifications
        .filter((notification) => canViewNotification(notification, req.user))
        .map((notification) => normalizeNotification(notification, req.user)),
    )

    res.json(visible)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createNotification = async (req, res) => {
  try {
    const notificationDraft = {
      title: req.body.title,
      message: req.body.message,
      targetRoles: req.body.targetRoles || [],
      targetEmployeeIds: req.body.targetEmployeeIds || [],
      sender: {
        role: req.user.role,
        name: req.user.name,
        employeeId: req.user.employeeId,
      },
    }

    notificationDraft.recipientKeys = await resolveRecipientKeys(notificationDraft)

    const notification = await Notification.create({
      ...notificationDraft,
    })

    res.status(201).json(notification)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    if (!canViewNotification(notification, req.user)) {
      return res.status(403).json({ message: "You do not have access to this notification" })
    }

    const userKey = buildUserKey(req.user)

    if (!notification.readBy.some((item) => item.userId === userKey)) {
      notification.readBy.push({
        userId: userKey,
        role: req.user.role,
        name: req.user.name,
        employeeId: req.user.employeeId,
        readAt: new Date(),
      })

      await notification.save()
    }

    const normalized = await normalizeNotification(notification, req.user)
    res.json(normalized)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only Admin can delete notifications" })
    }

    const notification = await Notification.findByIdAndDelete(req.params.id)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    res.json({ message: "Notification deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
