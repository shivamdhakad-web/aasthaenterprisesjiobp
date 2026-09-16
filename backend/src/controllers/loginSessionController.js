const LoginSession = require("../models/LoginSession")

const getSessionStatus = (session) => {
  if (session.status !== "Active") return session.status
  return session.expiresAt < new Date() ? "Expired" : "Active"
}

const normalizeSession = (session) => ({
  id: session._id.toString(),
  userRole: session.userRole,
  userName: session.userName,
  employeeId: session.employeeId,
  loginAt: session.loginAt,
  logoutAt: session.logoutAt,
  lastSeenAt: session.lastSeenAt,
  expiresAt: session.expiresAt,
  status: getSessionStatus(session),
  ipAddress: session.ipAddress,
  browser: session.browser,
  os: session.os,
  deviceType: session.deviceType,
})

const expireOldSessions = () =>
  LoginSession.updateMany(
    { status: "Active", expiresAt: { $lt: new Date() } },
    { $set: { status: "Expired" } },
  )

exports.listLoginSessions = async (req, res) => {
  try {
    await expireOldSessions()

    const { status = "all", role = "all", search = "" } = req.query
    const query = {}

    if (status !== "all") query.status = status
    if (role !== "all") query.userRole = role
    if (search.trim()) {
      const pattern = new RegExp(search.trim(), "i")
      query.$or = [
        { userName: pattern },
        { userRole: pattern },
        { ipAddress: pattern },
        { browser: pattern },
        { os: pattern },
        { deviceType: pattern },
      ]
    }

    const sessions = await LoginSession.find(query).sort({ loginAt: -1 }).limit(300).lean()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [activeSessions, todayLogins, totalSessions, loggedOutSessions, expiredSessions] =
      await Promise.all([
        LoginSession.countDocuments({ status: "Active", expiresAt: { $gte: new Date() } }),
        LoginSession.countDocuments({ loginAt: { $gte: todayStart } }),
        LoginSession.countDocuments(),
        LoginSession.countDocuments({ status: "Logged Out" }),
        LoginSession.countDocuments({ status: "Expired" }),
      ])

    const uniqueDevices = await LoginSession.distinct("userAgent")

    res.json({
      sessions: sessions.map(normalizeSession),
      summary: {
        activeSessions,
        todayLogins,
        totalSessions,
        loggedOutSessions,
        expiredSessions,
        uniqueDevices: uniqueDevices.filter(Boolean).length,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.terminateLoginSession = async (req, res) => {
  try {
    const session = await LoginSession.findById(req.params.id)

    if (!session) {
      return res.status(404).json({ message: "Login session not found" })
    }

    if (session.status !== "Active") {
      return res.json({ session: normalizeSession(session) })
    }

    session.status = "Terminated"
    session.logoutAt = new Date()
    await session.save()

    res.json({ session: normalizeSession(session) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
