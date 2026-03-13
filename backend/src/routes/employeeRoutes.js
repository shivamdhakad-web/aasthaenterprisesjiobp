const router = require("express").Router()

const {

getEmployees,
addEmployee,
updateEmployee,
deleteEmployee

} = require("../controllers/employeeController")

router.get("/",getEmployees)

router.post("/",addEmployee)

router.put("/:id",updateEmployee)

router.delete("/:id",deleteEmployee)

module.exports = router