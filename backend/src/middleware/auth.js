const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "jiobp-secret-key"

const signAuthToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || ""
  const [, token] = authHeader.split(" ")

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

module.exports = {
  authenticateToken,
  signAuthToken,
}
