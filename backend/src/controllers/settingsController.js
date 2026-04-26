const Settings = require("../models/Settings")

const defaultSettings = {
  companyName: "",
  stationName: "",
  gstNumber: "",
  address: "",
  contacts: [],
  loginPasswords: {
    admin: "123",
    manager: "456",
    employee: "789"
  }
}


/* GET SETTINGS */

exports.getSettings = async (req, res) => {

 try {

  const settings =
    (await Settings.findOne()) ||
    (await Settings.create(defaultSettings))

  res.json(settings)

 } catch (err) {

  res.status(500).json({ message: err.message })

 }

}



/* UPDATE SETTINGS */

exports.updateSettings = async (req, res) => {

 try {

  const payload = {
    ...req.body,
    loginPasswords: {
      ...defaultSettings.loginPasswords,
      ...(req.body?.loginPasswords || {})
    }
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    payload,
    { new: true, upsert: true }
  )

  res.json(settings)

 } catch (err) {

  res.status(500).json({ message: err.message })

 }

}
