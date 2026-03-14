const Customer = require("../models/Customer");
const CustomerTransaction = require("../models/CustomerTransaction");
const axios = require("axios");

// ADD CUSTOMER
const addCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = new Customer({
      name,
      phone,
      address
    });

    await customer.save();

    res.json({
      success: true,
      message: "Customer added successfully",
      data: customer
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL CUSTOMERS
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {

    const { id } = req.params;

    const updated = await Customer.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Customer updated",
      data: updated
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {

    const { id } = req.params;

    await Customer.findByIdAndDelete(id);
    await CustomerTransaction.deleteMany({ customerId: id });

    res.json({
      success: true,
      message: "Customer deleted"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CUSTOMER LEDGER
const getCustomerLedger = async (req, res) => {
  try {

    const { id } = req.params;

    const ledger = await CustomerTransaction.find({
      customerId: id
    }).sort({ date: 1 });

    res.json(ledger);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ADD FUEL ENTRY

const addFuelEntry = async (req, res) => {

try {

const { id } = req.params

const { fuelType, liters, rate, date, sendWhatsapp } = req.body

const amount = liters * rate

const last = await CustomerTransaction
.findOne({ customerId: id })
.sort({ createdAt: -1 })

const previousBalance = last ? last.balance : 0

const newBalance = previousBalance + amount


const transaction = new CustomerTransaction({

customerId: id,
type: "fuel",

fuelType,
liters,
rate,
amount,

balance: newBalance,
date

})


await transaction.save()

await Customer.findByIdAndUpdate(id,{
baki:newBalance
})


/* WHATSAPP BILL */

if(sendWhatsapp){

const customer = await Customer.findById(id)

try{

const response = await axios.post(

`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,

{
messaging_product:"whatsapp",

to: customer.phone.replace("+",""),

type:"template",

template:{

name:"fuel_bill",

language:{
code:"en_US"
},

components:[

{
type:"body",

parameters:[

{ type:"text", text:customer.name },
{ type:"text", text:fuelType },
{ type:"text", text:String(liters) },
{ type:"text", text:String(rate) },
{ type:"text", text:String(amount) },
{ type:"text", text:String(newBalance) }

]

}

]

}

},

{
headers:{
Authorization:`Bearer ${process.env.WHATSAPP_TOKEN}`,
"Content-Type":"application/json"
}
}

)

console.log("WhatsApp message sent")
console.log(response.data)

}catch(err){

console.log("WhatsApp Error:",err.response?.data || err.message)

}

}


res.json({

success:true,
message:"Fuel entry added",
data:transaction

})


}catch(error){

res.status(500).json({error:error.message})

}

}

module.exports = {
addFuelEntry
}

// ADD PAYMENT
const addPayment = async (req, res) => {
  try {

    const { id } = req.params;

    const { payment, date } = req.body;

    const last = await CustomerTransaction
      .findOne({ customerId: id })
      .sort({ createdAt: -1 });

    const previousBalance = last ? last.balance : 0;

    const newBalance = previousBalance - payment;

    const transaction = new CustomerTransaction({

      customerId: id,
      type: "payment",

      payment,
      balance: newBalance,
      date
    });

    await transaction.save();

    await Customer.findByIdAndUpdate(id, {
      baki: newBalance
    });

    res.json({
      success: true,
      message: "Payment added",
      data: transaction
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerLedger,
  addFuelEntry,
  addPayment
};