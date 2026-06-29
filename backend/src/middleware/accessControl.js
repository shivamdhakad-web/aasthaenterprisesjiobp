const policyRules = [
  { pattern: /^\/approvals\/[^/]+\/(approve|reject)$/, methods: ["POST"], roles: ["Admin"] },
  { pattern: /^\/approvals$/, methods: ["POST"], roles: ["Manager"] },
  { pattern: /^\/approvals(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },

  { pattern: /^\/notifications$/, methods: ["POST"], roles: ["Admin"] },
  { pattern: /^\/notifications(?:\/|$)/, methods: ["GET", "PUT"], roles: ["Admin", "Manager", "Employee"] },

  { pattern: /^\/salary\/summary(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager", "Employee"] },
  { pattern: /^\/leaves\/[^/]+\/decision$/, methods: ["PUT"], roles: ["Admin"] },
  { pattern: /^\/leaves(?:\/|$)/, methods: ["GET"], roles: ["Admin"] },
  { pattern: /^\/shifts(?:\/|$)/, methods: ["GET", "POST", "PUT", "DELETE"], roles: ["Admin", "Manager"] },
  { pattern: /^\/tasks(?:\/|$)/, methods: ["GET", "POST", "PUT", "DELETE"], roles: ["Admin", "Manager"] },
  { pattern: /^\/storage(?:\/|$)/, methods: ["GET"], roles: ["Admin"] },
  { pattern: /^\/employee-dashboard-settings(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager", "Employee"] },
  { pattern: /^\/employee-dashboard-settings(?:\/|$)/, methods: ["PUT"], roles: ["Admin"] },
  { pattern: /^\/manager-dashboard-settings(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/manager-dashboard-settings(?:\/|$)/, methods: ["PUT"], roles: ["Admin"] },
  { pattern: /^\/smart-calculator(?:\/|$)/, methods: ["GET", "POST", "DELETE"], roles: ["Admin", "Manager", "Employee"] },
   { pattern: /^\/density-calculator(?:\/|$)/, methods: ["GET", "POST", "DELETE"], roles: ["Admin", "Manager", "Employee"] },
  { pattern: /^\/employee(?:\/|$)/, methods: ["GET", "POST", "PUT"], roles: ["Employee"] },
  { pattern: /^\/daily-reports(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/daily-reports(?:\/|$)/, methods: ["PUT"], roles: ["Admin", "Manager"] },

  { pattern: /^\/users(?:\/|$)/, methods: ["GET", "POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/reminders(?:\/|$)/, methods: ["GET", "POST", "PUT", "DELETE"], roles: ["Admin", "Manager"] },
  { pattern: /^\/(charts|dashboard|revenue)(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },

  { pattern: /^\/petrol(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/petrol(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/diesel(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/diesel(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/employees(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/employees(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/attendance(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/attendance(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/expenses(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/expenses(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/lubricants(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/lubricants(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/meter(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/meter(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/mobile-dispenser(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/mobile-dispenser(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/card-swipe(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/card-swipe(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/dcd(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/dcd(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/mdu(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/mdu(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/invoice-details(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/invoice-details(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/daily-sales(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/daily-sales(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/bill-generator(?:\/|$)/, methods: ["GET", "POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/tanker-deliveries(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/tanker-deliveries(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/customers(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/customers(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/settings(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/settings(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/ttdrivers(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/ttdrivers(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/customerdrivers(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/customerdrivers(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/secure-notes(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/secure-notes(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
  { pattern: /^\/tank(?:\/|$)/, methods: ["GET"], roles: ["Admin", "Manager"] },
  { pattern: /^\/tank(?:\/|$)/, methods: ["POST", "PUT", "DELETE"], roles: ["Admin"] },
]

const authorizeApiAccess = (req, res, next) => {
  const path = req.path
  const method = req.method.toUpperCase()
  const userRole = req.user?.role

  const matchingRule = policyRules.find(
    (rule) => rule.methods.includes(method) && rule.pattern.test(path),
  )

  if (!matchingRule) {
    return res.status(403).json({ message: "Access denied" })
  }

  if (!matchingRule.roles.includes(userRole)) {
    return res.status(403).json({ message: "You do not have access to this action" })
  }

  next()
}

module.exports = {
  authorizeApiAccess,
}
