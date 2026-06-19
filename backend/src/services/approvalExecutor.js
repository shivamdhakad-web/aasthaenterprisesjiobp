const axios = require("axios")
const mongoose = require("mongoose")

const Employee = require("../models/Employee")
const EmployeeAttendance = require("../models/EmployeeAttendance")
const Expense = require("../models/Expense")
const LubricantProduct = require("../models/LubricantProduct")
const LubricantSale = require("../models/LubricantSale")
const CardSwipe = require("../models/CardSwipe")
const MeterReading = require("../models/MeterReading")
const MobileDispenser = require("../models/MobileDispenser")
const MobileDispenserSettings = require("../models/MobileDispenserSettings")
const PetrolSale = require("../models/PetrolSale")
const DieselSale = require("../models/DieselSale")
const SecureNote = require("../models/SecureNote")
const TTDriver = require("../models/TTDriver")
const CustomerDriver = require("../models/CustomerDriver")
const TankerDelivery = require("../models/TankerDelivery")
const DcdEntry = require("../models/DcdEntry")
const MduEntry = require("../models/MduEntry")
const InvoiceDetail = require("../models/InvoiceDetail")
const DailySale = require("../models/DailySale")
const Customer = require("../models/Customer")
const CustomerTransaction = require("../models/CustomerTransaction")
const Settings = require("../models/Settings")
const Tank = require("../models/Tank")

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value

const genericCreate = async (Model, payload) => Model.create(payload)
const genericUpdate = async (Model, id, payload) =>
  Model.findByIdAndUpdate(id, payload, { new: true })
const genericDelete = async (Model, id) => Model.findByIdAndDelete(id)

const createSummaryString = (payload = {}) =>
  payload.name || payload.title || payload.date || payload.product || payload.description || ""

const calculateFuelSalePayload = (payload) => ({
  ...payload,
  liters: Number(payload.liters || 0),
  price: Number(payload.price || 0),
  totalAmount: Number(payload.liters || 0) * Number(payload.price || 0),
})

const calculateMeterPayload = (payload) => {
  const opening = Number(payload.opening || 0)
  const closing = Number(payload.closing || 0)

  return {
    ...payload,
    opening,
    closing,
    fuelSold: closing - opening,
  }
}

const calculateAttendancePayload = (payload) => ({
  ...payload,
  shortage: Number(payload.shortage || 0),
  advanceCash: Number(payload.advanceCash || 0),
  advancePetrol: Number(payload.advancePetrol || 0),
})

const calculateDcdPayload = (payload) => {
  const volume = Number(payload.volume || 0)
  const purchasePrice = Number(payload.purchasePrice || 0)
  const salePrice = Number(payload.salePrice || 0)

  return {
    ...payload,
    volume,
    purchasePrice,
    salePrice,
    profit: Number(payload.profit ?? (salePrice - purchasePrice) * volume),
  }
}

const calculateMduPayload = (payload) => {
  const openingStock = Number(payload.openingStock || 0)
  const decant = Number(payload.decant || 0)
  const sale = Number(payload.sale || 0)
  const physicalStock = Number(payload.physicalStock || 0)

  return {
    ...payload,
    openingStock,
    decant,
    sale,
    physicalStock,
    rate: Number(payload.rate || 0),
    lossGain: Number(payload.lossGain ?? physicalStock - (openingStock + decant - sale)),
  }
}

const calculateInvoiceDetailPayload = (payload) => {
  const qty = Number(payload.qty || 0)
  const invoiceAmount = Number(payload.invoiceAmount || 0)
  const transportCost = Number(payload.transportCost || 0)
  const lfr = Number(payload.lfr || 0)

  return {
    ...payload,
    qty,
    invoiceAmount,
    transportCost,
    lfr,
    purchaseAmount: Number(payload.purchaseAmount ?? (qty ? (invoiceAmount + transportCost) / qty + lfr : 0)),
  }
}

const calculateDailySalePayload = (payload) => {
  const sale = Number(payload.sale || 0)
  const rate = Number(payload.rate || 0)

  return {
    ...payload,
    sale,
    rate,
    lossGain: Number(payload.lossGain || 0),
    profit: Number(payload.profit ?? sale * rate),
  }
}

const buildMobileEntryPayload = async (payload) => {
  const settings = await MobileDispenserSettings.findOne()

  if (!settings) {
    throw new Error("Mobile dispenser settings not configured")
  }

  const stockAdd = Number(payload.stockAdd || 0)
  const startNozzle = Number(payload.startNozzle || 0)
  const endNozzle = Number(payload.endNozzle || 0)
  const startKM = Number(payload.startKM || 0)
  const endKM = Number(payload.endKM || 0)

  const saleLiter = endNozzle - startNozzle
  const totalKM = endKM - startKM
  const profit = saleLiter * Number(settings.margin || 0)
  const dieselCost = totalKM * Number(settings.dieselPerKM || 0)
  const finalProfit = profit - dieselCost

  return {
    settings,
    entryPayload: {
      ...payload,
      stockAdd,
      startNozzle,
      endNozzle,
      saleLiter,
      startKM,
      endKM,
      totalKM,
      profit,
      dieselCost,
      finalProfit,
    },
  }
}

const adjustMobileStock = async (settings, addValue, saleValue) => {
  settings.currentStock = Number(settings.currentStock || 0) + Number(addValue || 0) - Number(saleValue || 0)
  await settings.save()
}

const createMobileEntry = async (payload) => {
  const { settings, entryPayload } = await buildMobileEntryPayload(payload)
  const entry = await MobileDispenser.create(entryPayload)
  await adjustMobileStock(settings, entryPayload.stockAdd, entryPayload.saleLiter)
  return entry
}

const updateMobileEntry = async (id, payload) => {
  const existing = await MobileDispenser.findById(id)

  if (!existing) {
    throw new Error("Mobile dispenser entry not found")
  }

  const { settings, entryPayload } = await buildMobileEntryPayload(payload)
  await adjustMobileStock(settings, -existing.stockAdd, -existing.saleLiter)
  const updated = await MobileDispenser.findByIdAndUpdate(id, entryPayload, { new: true })
  await adjustMobileStock(settings, updated.stockAdd, updated.saleLiter)
  return updated
}

const deleteMobileEntry = async (id) => {
  const existing = await MobileDispenser.findById(id)

  if (!existing) {
    return null
  }

  const settings = await MobileDispenserSettings.findOne()
  const deleted = await MobileDispenser.findByIdAndDelete(id)

  if (settings) {
    settings.currentStock = Number(settings.currentStock || 0) - Number(existing.stockAdd || 0) + Number(existing.saleLiter || 0)
    await settings.save()
  }

  return deleted
}

const deleteMobileMonth = async (year, month) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const entries = await MobileDispenser.find({
    date: {
      $gte: start,
      $lt: end,
    },
  })

  const settings = await MobileDispenserSettings.findOne()

  if (settings) {
    for (const entry of entries) {
      settings.currentStock = Number(settings.currentStock || 0) - Number(entry.stockAdd || 0) + Number(entry.saleLiter || 0)
    }
    await settings.save()
  }

  await MobileDispenser.deleteMany({
    date: {
      $gte: start,
      $lt: end,
    },
  })

  return { deletedCount: entries.length }
}

const createOrUpdateMobileSettings = async (payload) => {
  let settings = await MobileDispenserSettings.findOne()

  if (!settings) {
    settings = new MobileDispenserSettings(payload)
  } else {
    Object.assign(settings, payload)
  }

  await settings.save()
  return settings
}

const adjustProductStock = async (productName, delta) => {
  const product = await LubricantProduct.findOne({ name: productName })

  if (!product) {
    throw new Error("Product not found")
  }

  const nextStock = Number(product.stock || 0) + Number(delta || 0)

  if (nextStock < 0) {
    throw new Error("Not enough stock")
  }

  product.stock = nextStock
  await product.save()
  return product
}

const createLubricantSale = async (payload) => {
  const salePayload = {
    ...payload,
    price: Number(payload.price || 0),
    quantity: Number(payload.quantity || 0),
    total: Number(payload.total || Number(payload.price || 0) * Number(payload.quantity || 0)),
  }

  await adjustProductStock(salePayload.product, -salePayload.quantity)
  return LubricantSale.create(salePayload)
}

const updateLubricantSale = async (id, payload) => {
  const existing = await LubricantSale.findById(id)

  if (!existing) {
    throw new Error("Lubricant sale not found")
  }

  await adjustProductStock(existing.product, Number(existing.quantity || 0))

  const salePayload = {
    ...payload,
    price: Number(payload.price || 0),
    quantity: Number(payload.quantity || 0),
    total: Number(payload.total || Number(payload.price || 0) * Number(payload.quantity || 0)),
  }

  await adjustProductStock(salePayload.product, -salePayload.quantity)
  return LubricantSale.findByIdAndUpdate(id, salePayload, { new: true })
}

const deleteLubricantSale = async (id) => {
  const existing = await LubricantSale.findById(id)

  if (!existing) {
    return null
  }

  await adjustProductStock(existing.product, Number(existing.quantity || 0))
  return LubricantSale.findByIdAndDelete(id)
}

const deleteLubricantMonth = async (year, month) => {
  const key = `${year}-${String(month).padStart(2, "0")}`
  const sales = await LubricantSale.find({
    date: { $regex: `^${key}` },
  })

  for (const sale of sales) {
    await adjustProductStock(sale.product, Number(sale.quantity || 0))
  }

  await LubricantSale.deleteMany({
    date: { $regex: `^${key}` },
  })

  return { deletedCount: sales.length }
}

const createCustomerFuelEntry = async (customerId, payload) => {
  const { fuelType, liters, rate, date, sendWhatsapp } = payload

  const last = await CustomerTransaction.findOne({ customerId }).sort({ createdAt: -1 })
  const amount = Number(liters || 0) * Number(rate || 0)
  const previousBalance = last ? Number(last.balance || 0) : 0
  const newBalance = previousBalance + amount

  const transaction = await CustomerTransaction.create({
    customerId,
    type: "fuel",
    fuelType,
    liters: Number(liters || 0),
    rate: Number(rate || 0),
    amount,
    balance: newBalance,
    date,
  })

  await Customer.findByIdAndUpdate(customerId, { baki: newBalance })

  if (sendWhatsapp) {
    const customer = await Customer.findById(customerId)

    if (customer?.phone && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN) {
      await axios.post(
        `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: customer.phone.replace("+", ""),
          type: "template",
          template: {
            name: "fuel_bill",
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: customer.name || "" },
                  { type: "text", text: fuelType || "" },
                  { type: "text", text: String(liters || 0) },
                  { type: "text", text: String(rate || 0) },
                  { type: "text", text: String(amount) },
                  { type: "text", text: String(newBalance) },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        },
      )
    }
  }

  return transaction
}

const createCustomerPayment = async (customerId, payload) => {
  const { payment, date } = payload

  const last = await CustomerTransaction.findOne({ customerId }).sort({ createdAt: -1 })
  const previousBalance = last ? Number(last.balance || 0) : 0
  const newBalance = previousBalance - Number(payment || 0)

  const transaction = await CustomerTransaction.create({
    customerId,
    type: "payment",
    payment: Number(payment || 0),
    balance: newBalance,
    date,
  })

  await Customer.findByIdAndUpdate(customerId, { baki: newBalance })

  return transaction
}

const deleteAttendanceMonth = async (employeeId, year, month) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  await EmployeeAttendance.deleteMany({
    employeeId: toObjectId(employeeId),
    date: {
      $gte: start,
      $lt: end,
    },
  })

  return { success: true }
}

const deleteCardSwipeMonth = async (year, month) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  await CardSwipe.deleteMany({
    date: {
      $gte: start,
      $lt: end,
    },
  })

  return { success: true }
}

const createOrUpdateStationSettings = async (payload) =>
  Settings.findOneAndUpdate({}, payload, { new: true, upsert: true })

const updateTankStock = async (tankId, payload) => {
  const id = tankId || payload.id || payload._id

  if (!id) {
    throw new Error("Tank id is required")
  }

  return Tank.findByIdAndUpdate(
    id,
    { currentStock: Number(payload.currentStock || 0) },
    { new: true },
  )
}

const approvalHandlers = {
  "employees:create": ({ payload }) => genericCreate(Employee, payload),
  "employees:update": ({ resourceId, payload }) => genericUpdate(Employee, resourceId, payload),
  "employees:delete": ({ resourceId }) => genericDelete(Employee, resourceId),

  "attendance:create": ({ payload, meta }) =>
    genericCreate(EmployeeAttendance, {
      ...calculateAttendancePayload(payload),
      employeeId: toObjectId(meta.employeeId || payload.employeeId),
    }),
  "attendance:update": ({ resourceId, payload }) =>
    genericUpdate(EmployeeAttendance, resourceId, calculateAttendancePayload(payload)),
  "attendance:delete": ({ resourceId }) => genericDelete(EmployeeAttendance, resourceId),
  "attendance:deleteMonth": ({ meta }) =>
    deleteAttendanceMonth(meta.employeeId, Number(meta.year), Number(meta.month)),

  "expenses:create": ({ payload }) => genericCreate(Expense, payload),
  "expenses:update": ({ resourceId, payload }) => genericUpdate(Expense, resourceId, payload),
  "expenses:delete": ({ resourceId }) => genericDelete(Expense, resourceId),

  "lubricant-products:create": ({ payload }) => genericCreate(LubricantProduct, payload),
  "lubricant-products:update": ({ resourceId, payload }) =>
    genericUpdate(LubricantProduct, resourceId, payload),
  "lubricant-products:delete": ({ resourceId }) => genericDelete(LubricantProduct, resourceId),

  "lubricant-sales:create": ({ payload }) => createLubricantSale(payload),
  "lubricant-sales:update": ({ resourceId, payload }) => updateLubricantSale(resourceId, payload),
  "lubricant-sales:delete": ({ resourceId }) => deleteLubricantSale(resourceId),
  "lubricant-sales:deleteMonth": ({ meta }) =>
    deleteLubricantMonth(Number(meta.year), Number(meta.month)),

  "card-swipe:create": ({ payload }) => genericCreate(CardSwipe, payload),
  "card-swipe:update": ({ resourceId, payload }) => genericUpdate(CardSwipe, resourceId, payload),
  "card-swipe:delete": ({ resourceId }) => genericDelete(CardSwipe, resourceId),
  "card-swipe:deleteMonth": ({ meta }) => deleteCardSwipeMonth(Number(meta.year), Number(meta.month)),

  "dcd:create": ({ payload }) => genericCreate(DcdEntry, calculateDcdPayload(payload)),
  "dcd:update": ({ resourceId, payload }) => genericUpdate(DcdEntry, resourceId, calculateDcdPayload(payload)),
  "dcd:delete": ({ resourceId }) => genericDelete(DcdEntry, resourceId),

  "mdu:create": ({ payload }) => genericCreate(MduEntry, calculateMduPayload(payload)),
  "mdu:update": ({ resourceId, payload }) => genericUpdate(MduEntry, resourceId, calculateMduPayload(payload)),
  "mdu:delete": ({ resourceId }) => genericDelete(MduEntry, resourceId),

  "invoice-details:create": ({ payload }) => genericCreate(InvoiceDetail, calculateInvoiceDetailPayload(payload)),
  "invoice-details:update": ({ resourceId, payload }) =>
    genericUpdate(InvoiceDetail, resourceId, calculateInvoiceDetailPayload(payload)),
  "invoice-details:delete": ({ resourceId }) => genericDelete(InvoiceDetail, resourceId),

  "daily-sales:create": ({ payload }) => genericCreate(DailySale, calculateDailySalePayload(payload)),
  "daily-sales:update": ({ resourceId, payload }) =>
    genericUpdate(DailySale, resourceId, calculateDailySalePayload(payload)),
  "daily-sales:delete": ({ resourceId }) => genericDelete(DailySale, resourceId),

  "meter-readings:create": ({ payload }) => genericCreate(MeterReading, calculateMeterPayload(payload)),
  "meter-readings:update": ({ resourceId, payload }) =>
    genericUpdate(MeterReading, resourceId, calculateMeterPayload(payload)),
  "meter-readings:delete": ({ resourceId }) => genericDelete(MeterReading, resourceId),

  "mobile-dispenser-settings:update": ({ payload }) => createOrUpdateMobileSettings(payload),
  "mobile-dispenser-entries:create": ({ payload }) => createMobileEntry(payload),
  "mobile-dispenser-entries:update": ({ resourceId, payload }) => updateMobileEntry(resourceId, payload),
  "mobile-dispenser-entries:delete": ({ resourceId }) => deleteMobileEntry(resourceId),
  "mobile-dispenser-entries:deleteMonth": ({ meta }) =>
    deleteMobileMonth(Number(meta.year), Number(meta.month)),

  "petrol-sales:create": ({ payload }) => genericCreate(PetrolSale, calculateFuelSalePayload(payload)),
  "petrol-sales:update": ({ resourceId, payload }) =>
    genericUpdate(PetrolSale, resourceId, calculateFuelSalePayload(payload)),
  "petrol-sales:delete": ({ resourceId }) => genericDelete(PetrolSale, resourceId),
  "diesel-sales:create": ({ payload }) => genericCreate(DieselSale, calculateFuelSalePayload(payload)),
  "diesel-sales:update": ({ resourceId, payload }) =>
    genericUpdate(DieselSale, resourceId, calculateFuelSalePayload(payload)),
  "diesel-sales:delete": ({ resourceId }) => genericDelete(DieselSale, resourceId),

  "secure-notes:create": ({ payload }) => genericCreate(SecureNote, payload),
  "secure-notes:update": ({ resourceId, payload }) => genericUpdate(SecureNote, resourceId, payload),
  "secure-notes:delete": ({ resourceId }) => genericDelete(SecureNote, resourceId),

  "tt-drivers:create": ({ payload }) => genericCreate(TTDriver, payload),
  "tt-drivers:update": ({ resourceId, payload }) => genericUpdate(TTDriver, resourceId, payload),
  "tt-drivers:delete": ({ resourceId }) => genericDelete(TTDriver, resourceId),

  "customer-drivers:create": ({ payload }) => genericCreate(CustomerDriver, payload),
  "customer-drivers:update": ({ resourceId, payload }) => genericUpdate(CustomerDriver, resourceId, payload),
  "customer-drivers:delete": ({ resourceId }) => genericDelete(CustomerDriver, resourceId),

  "tanker-deliveries:create": ({ payload }) => genericCreate(TankerDelivery, payload),
  "tanker-deliveries:update": ({ resourceId, payload }) => genericUpdate(TankerDelivery, resourceId, payload),
  "tanker-deliveries:delete": ({ resourceId }) => genericDelete(TankerDelivery, resourceId),

  "customers:create": ({ payload }) => genericCreate(Customer, payload),
  "customers:update": ({ resourceId, payload }) => genericUpdate(Customer, resourceId, payload),
  "customers:delete": async ({ resourceId }) => {
    await CustomerTransaction.deleteMany({ customerId: resourceId })
    return genericDelete(Customer, resourceId)
  },
  "customers:fuel": ({ resourceId, payload }) => createCustomerFuelEntry(resourceId, payload),
  "customers:payment": ({ resourceId, payload }) => createCustomerPayment(resourceId, payload),

  "settings:update": ({ payload }) => createOrUpdateStationSettings(payload),
  "tank:update": ({ resourceId, payload }) => updateTankStock(resourceId, payload),
}

const executeApprovalRequest = async (request) => {
  const handler = approvalHandlers[`${request.moduleKey}:${request.operation}`]

  if (!handler) {
    throw new Error(`No approval handler for ${request.moduleKey}:${request.operation}`)
  }

  return handler(request)
}

module.exports = {
  createSummaryString,
  executeApprovalRequest,
}
