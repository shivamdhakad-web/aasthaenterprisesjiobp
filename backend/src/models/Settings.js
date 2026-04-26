const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String
})

const loginPasswordsSchema = new mongoose.Schema(
  {
    admin: {
      type: String,
      default: "123"
    },
    manager: {
      type: String,
      default: "456"
    },
    employee: {
      type: String,
      default: "789"
    }
  },
  { _id: false }
)

const settingsSchema = new mongoose.Schema({

  companyName: String,
  stationName: String,
  gstNumber: String,
  address: String,

  contacts: [contactSchema],
  loginPasswords: {
    type: loginPasswordsSchema,
    default: () => ({})
  }

})

module.exports = mongoose.model("Settings", settingsSchema)
