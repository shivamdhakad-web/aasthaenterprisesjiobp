const router = require("express").Router()

const {

getAttendance,
addAttendance,
updateAttendance,
deleteAttendance,
deleteMonth

} = require("../controllers/employeeAttendanceController")

router.get("/:employeeId",getAttendance)

router.post("/:employeeId",addAttendance)

router.put("/update/:id",updateAttendance)

router.delete("/delete/:id",deleteAttendance)

router.delete("/month/:employeeId/:year/:month",deleteMonth)

module.exports = router