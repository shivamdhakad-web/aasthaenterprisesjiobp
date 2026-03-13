const express = require("express")

const {
getExpenses,
addExpense,
deleteExpense,
updateExpense
} = require("../controllers/expenseController")

const router = express.Router()

router.get("/",getExpenses)

router.post("/",addExpense)

router.delete("/:id",deleteExpense)

router.put("/:id",updateExpense)

module.exports = router