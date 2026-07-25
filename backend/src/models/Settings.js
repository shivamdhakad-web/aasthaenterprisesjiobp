const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
  },
  { _id: false },
)

const loginPasswordsSchema = new mongoose.Schema(
  {
    admin: {
      type: String,
      default: process.env.ADMIN_PASSWORD || "123",
    },
    manager: {
      type: String,
      default: process.env.MANAGER_PASSWORD || "456",
    },
    employee: {
      type: String,
      default: process.env.EMPLOYEE_PASSWORD || "789",
    },
  },
  { _id: false },
)

const passwordSecuritySchema = new mongoose.Schema(
  {
    masterUnlockPassword: {
      type: String,
      default: process.env.DASHBOARD_MASTER_PASSWORD || "jiobp",
    },
    authVersion: {
      type: Number,
      default: 1,
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
)

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "",
    },
    stationName: {
      type: String,
      default: "",
    },
    gstNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    contacts: {
      type: [contactSchema],
      default: [],
    },
    secureNotesPassword: {
      type: String,
      default: process.env.SECURE_NOTES_PASSWORD || "jiobp",
    },
    loginPasswords: {
      type: loginPasswordsSchema,
      default: () => ({}),
    },
    passwordSecurity: {
      type: passwordSecuritySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Settings", settingsSchema)
