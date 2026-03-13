const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema({
  name: String,
  phone: String
})

const settingsSchema = new mongoose.Schema({

  companyName: String,
  stationName: String,
  gstNumber: String,
  address: String,

  contacts: [contactSchema]

})

module.exports = mongoose.model("Settings", settingsSchema)