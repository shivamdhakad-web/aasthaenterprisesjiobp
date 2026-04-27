const Employee = require("../models/Employee")
const TaskAssignment = require("../models/TaskAssignment")

exports.getTasks = async (req, res) => {
  try {
    const filters = {}

    if (req.query.employeeId) {
      filters.employeeId = req.query.employeeId
    }

    if (req.query.status) {
      filters.status = req.query.status
    }

    if (req.query.priority) {
      filters.priority = req.query.priority
    }

    const tasks = await TaskAssignment.find(filters)
      .populate("employeeId", "name role shift")
      .sort({ status: 1, dueDate: 1, assignedDate: -1, createdAt: -1 })

    res.json(tasks)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createTask = async (req, res) => {
  try {
    const employeeId = req.body.employeeId
    const basePayload = {
      title: req.body.title,
      description: req.body.description,
      instructions: req.body.instructions,
      assignedDate: req.body.assignedDate || new Date(),
      dueDate: req.body.dueDate || undefined,
      priority: req.body.priority || "medium",
      status: req.body.status || "pending",
      createdByRole: req.user.role,
      createdByName: req.user.name,
    }

    if (employeeId === "all" || req.body.appliesToAll) {
      const employees = await Employee.find({ status: "Active" }).select("_id name")

      const payload = employees.map((employee) => ({
        ...basePayload,
        employeeId: employee._id,
        employeeName: employee.name,
      }))

      const created = await TaskAssignment.insertMany(payload)
      return res.status(201).json(created)
    }

    const employee = await Employee.findById(employeeId).select("_id name")

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const task = await TaskAssignment.create({
      ...basePayload,
      employeeId: employee._id,
      employeeName: employee.name,
    })

    const populated = await task.populate("employeeId", "name role shift")
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateTask = async (req, res) => {
  try {
    const task = await TaskAssignment.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    task.title = req.body.title || task.title
    task.description = req.body.description ?? task.description
    task.instructions = req.body.instructions ?? task.instructions
    task.assignedDate = req.body.assignedDate || task.assignedDate
    task.dueDate = req.body.dueDate ?? task.dueDate
    task.priority = req.body.priority || task.priority
    task.status = req.body.status || task.status

    if (req.body.employeeId && req.body.employeeId !== task.employeeId?.toString()) {
      const employee = await Employee.findById(req.body.employeeId).select("_id name")

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" })
      }

      task.employeeId = employee._id
      task.employeeName = employee.name
    }

    task.completedAt = task.status === "completed" ? new Date() : null

    await task.save()

    const populated = await task.populate("employeeId", "name role shift")
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteTask = async (req, res) => {
  try {
    await TaskAssignment.findByIdAndDelete(req.params.id)
    res.json({ message: "Task deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
