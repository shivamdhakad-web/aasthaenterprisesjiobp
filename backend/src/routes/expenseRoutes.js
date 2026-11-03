const express = require("express")

const {
getExpenses,
addExpense,
deleteExpense,
deleteExpenseMonth,
updateExpense
} = require("../controllers/expenseController")

const router = express.Router()

router.get("/",getExpenses)

router.post("/",addExpense)

router.delete("/month/:year/:month",deleteExpenseMonth)

router.delete("/:id",deleteExpense)

router.put("/:id",updateExpense)

module.exports = router
