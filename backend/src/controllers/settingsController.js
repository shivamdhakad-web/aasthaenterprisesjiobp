const Settings = require("../models/Settings")



/* GET SETTINGS */

exports.getSettings = async (req, res) => {

 try {

  const settings = await Settings.findOne()

  res.json(settings)

 } catch (err) {

  res.status(500).json({ message: err.message })

 }

}



/* UPDATE SETTINGS */

exports.updateSettings = async (req, res) => {

 try {

  const settings = await Settings.findOneAndUpdate(
    {},
    req.body,
    { new: true, upsert: true }
  )

  res.json(settings)

 } catch (err) {

  res.status(500).json({ message: err.message })

 }

}