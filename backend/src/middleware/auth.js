const jwt = require("jsonwebtoken")
const Settings = require("../models/Settings")

const JWT_SECRET = process.env.JWT_SECRET || "jiobp-secret-key"
const SESSION_DURATION_DAYS = 5
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000

const signAuthToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DURATION_DAYS}d` })

const getCurrentAuthVersion = async () => {
  const settings = await Settings.findOne().select("passwordSecurity.authVersion")
  return settings?.passwordSecurity?.authVersion ?? 1
}

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || ""
  const [, token] = authHeader.split(" ")

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const currentAuthVersion = await getCurrentAuthVersion()

    if ((decoded.authVersion ?? 1) !== currentAuthVersion) {
      return res.status(401).json({ message: "Session expired. Please login again." })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

module.exports = {
  authenticateToken,
  signAuthToken,
  SESSION_DURATION_MS,
  SESSION_DURATION_DAYS,
}