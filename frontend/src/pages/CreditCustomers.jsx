import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

import {
  getCustomers,
  addCustomer,
  deleteCustomer,
  getCustomerLedger,
  addFuel,
  addPayment
} from "../services/customerApi";

export default function CreditCustomers() {

  const [customers,setCustomers] = useState([]);
  const [ledger,setLedger] = useState([]);
  const [selectedCustomer,setSelectedCustomer] = useState(null);

  const [showModal,setShowModal] = useState(false);
  const [fuelModal,setFuelModal] = useState(false);
  const [paymentModal,setPaymentModal] = useState(false);

  //add
  const [fuel,setFuel] = useState({
  fuelType:"Petrol",
  liters:"",
  rate:"",
  date:"",
  sendWhatsapp:false
  });

  //add
  const generateRowBill = (row)=>{

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Fuel Bill",20,20);

  doc.setFontSize(12);

  doc.text(`Customer: ${selectedCustomer.name}`,20,40);
  doc.text(`Fuel: ${row.fuelType}`,20,50);
  doc.text(`Liters: ${row.liters}`,20,60);
  doc.text(`Rate: ${row.rate}`,20,70);
  doc.text(`Amount: ₹${row.amount}`,20,80);
  doc.text(`Date: ${row.date?.slice(0,10)}`,20,90);

  doc.save(`bill-${row._id}.pdf`);

  };

  const [form,setForm] = useState({
    name:"",
    phone:"",
    address:""
  });

  //comm
  // const [fuel,setFuel] = useState({
  //   fuelType:"Petrol",
  //   liters:"",
  //   rate:"",
  //   date:""
  // });

  const [payment,setPayment] = useState({
    payment:"",
    date:""
  });

  /* ---------------- NEW STATES ---------------- */

  const [search,setSearch] = useState("");
  const [editItem,setEditItem] = useState(null);

  /* ---------------- ORIGINAL CODE ---------------- */

  const fetchCustomers = async()=>{
    const data = await getCustomers();
    setCustomers(data);
  };

  useEffect(()=>{
    fetchCustomers();
  },[]);

  const openLedger = async(customer)=>{
    setSelectedCustomer(customer);
    const data = await getCustomerLedger(customer._id);
    setLedger(data);
  };

  const refreshLedger = async()=>{
    if(!selectedCustomer) return;

    const data = await getCustomerLedger(selectedCustomer._id);
    setLedger(data);

    fetchCustomers();
  };

  const handleAddCustomer = async()=>{
    await addCustomer(form);

    setShowModal(false);

    setForm({
      name:"",
      phone:"",
      address:""
    });

    fetchCustomers();
  };

  const handleDelete = async(id)=>{
    const confirmDelete = window.confirm("Delete customer?");
    if(!confirmDelete) return;

    await deleteCustomer(id);
    fetchCustomers();
  };

  const saveFuel = async()=>{
    await addFuel(selectedCustomer._id,fuel);

    setFuelModal(false);

    setFuel({
      fuelType:"Petrol",
      liters:"",
      rate:"",
      date:""
    });

    refreshLedger();
  };

  const savePayment = async()=>{
    await addPayment(selectedCustomer._id,payment);

    setPaymentModal(false);

    setPayment({
      payment:"",
      date:""
    });

    refreshLedger();
  };

  /* ---------------- NEW FEATURES ---------------- */

  const editEntry = (item)=>{

    setEditItem(item);

    if(item.type === "fuel"){

      setFuelModal(true);

      setFuel({
        fuelType:item.fuelType,
        liters:item.liters,
        rate:item.rate,
        date:item.date?.slice(0,10)
      });

    }else{

      setPaymentModal(true);

      setPayment({
        payment:item.payment,
        date:item.date?.slice(0,10)
      });

    }

  };


  const generateBill = () => {

  const doc = new jsPDF();

  const pending = ledger.length
    ? ledger[ledger.length - 1].balance
    : 0;

  doc.setFontSize(16);
  doc.text("Customer Bill", 20, 20);

  doc.setFontSize(12);

  doc.text(`Customer: ${selectedCustomer.name}`, 20, 30);
  doc.text(`Pending Balance: ₹${pending}`, 20, 38);

  let y = 50;

  ledger.forEach((l) => {

    doc.text(
      `${l.date?.slice(0,10)}   ${l.type}   ${l.fuelType || "-"}   ₹${l.amount || l.payment}`,
      20,
      y
    );

    y += 10;

  });

  doc.save(`${selectedCustomer.name}-bill.pdf`);

};

  const exportExcel = () => {

  const pending = ledger.length
    ? ledger[ledger.length - 1].balance
    : 0;

  const data = ledger.map((l) => ({
    Date: l.date?.slice(0,10),
    Type: l.type,
    Fuel: l.fuelType,
    Liters: l.liters,
    Rate: l.rate,
    Amount: l.amount,
    Payment: l.payment,
    Balance: l.balance
  }));

  const ws = XLSX.utils.json_to_sheet(data, { origin: "A5" });

  XLSX.utils.sheet_add_aoa(ws, [
    ["Customer Statement"],
    [`Customer Name: ${selectedCustomer.name}`],
    [`Pending Balance: ₹${pending}`],
    []
  ], { origin: "A1" });

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Statement");

  XLSX.writeFile(wb, `${selectedCustomer.name}-statement.xlsx`);
};

  const printBill = ()=>{

    const win = window.open("","","width=400,height=600");

    win.document.write("<h2>Fuel Bill</h2>");

    ledger.forEach((l)=>{
      win.document.write(
        `<p>${l.date?.slice(0,10)} - ${l.fuelType} - ₹${l.amount || l.payment}</p>`
      );
    });

    win.print();
  };

  const totalFuel =
    ledger
    .filter(l=>l.type==="fuel")
    .reduce((a,b)=>a+(b.amount||0),0);

  const totalPayment =
    ledger
    .filter(l=>l.type==="payment")
    .reduce((a,b)=>a+(b.payment||0),0);

  /* ---------------- UI ---------------- */

  return(

  <div className="p-6 text-gray-300">

    <div className="flex justify-between mb-6">

      <h1 className="text-2xl font-bold">
        Credit Customers
      </h1>

      <button
      onClick={()=>setShowModal(true)}
      className="bg-red-500 px-4 py-2 rounded"
      >
        + Add Customer
      </button>

    </div>

    {/* SEARCH */}

    <input
    placeholder="Search customer..."
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
    className="bg-[#0B0F17] border border-[#1A1F2E] px-3 py-2 rounded mb-4"
    />

    <div className="bg-[#0B0F17] border border-[#1A1F2E] rounded">

      <table className="w-full">

        <thead className="border-b border-[#1A1F2E]">

          <tr className="text-gray-400">

            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Address</th>
            {/* <th className="p-3 text-left">Jama</th> */}
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Action</th>

          </tr>

        </thead>

        <tbody>

          {customers
          .filter((c)=>c.name.toLowerCase().includes(search.toLowerCase()))
          .map((c)=>(

            <tr
            key={c._id}
            className="border-t border-[#1F2937] hover:bg-[#111827] cursor-pointer"
            onClick={()=>openLedger(c)}
            >

              <td className="p-3">{c.name}</td>
              <td className="p-3">{c.phone}</td>
              <td className="p-3">{c.address}</td>

              {/* <td className="p-3 text-green-400">
                ₹{c.jama}
              </td> */}

              {/* comm */}
              {/* <td className="p-3 text-red-400">
                ₹{c.baki}
              </td> */}

                {/* add */}
              <td className="p-3">
                {c.baki < 0 ? (
                <span className="text-green-400">Advance ₹{Math.abs(c.baki)}</span>
                ) : (
                <span className="text-red-400">Due ₹{c.baki}</span>
                )}
              </td>

              <td className="p-3">
                {new Date(c.createdAt).toLocaleDateString()}
              </td>

              <td className="p-3">

                <button
                className="text-red-400"
                onClick={(e)=>{
                  e.stopPropagation();
                  handleDelete(c._id);
                }}
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

    {selectedCustomer &&(

      <div className="mt-6 bg-[#0B0F17] border border-[#1A1F2E] rounded p-4">

        {/* TOTAL CARDS */}

        <div className="flex gap-4 mb-4">

         <div className="bg-[#0B0F17] border border-[#1F2937] p-3 rounded">
          Total Fuel ₹{totalFuel}
        </div>

        <div className="bg-[#0B0F17] border border-[#1F2937] p-3 rounded">
          Total Payment ₹{totalPayment}
        </div>

        </div>

        <div className="flex justify-between mb-4">

          <h2 className="bg-[#0B0F17] border border-[#1F2937] p-3 rounded font-bold">
            Customer Ledger : {selectedCustomer.name}
          </h2>

          <div className="flex gap-2">

            <button
            className="bg-blue-500 px-2 py-1 rounded"
            onClick={()=>setFuelModal(true)}
            >
              + Fuel Entry
            </button>

            <button
            className="bg-green-500 px-2 py-1 rounded"
            onClick={()=>setPaymentModal(true)}
            >
              + Payment
            </button>

            <button
            className="bg-yellow-500 px-2 py-1 rounded"
            onClick={generateBill}
            >
              Bill
            </button>

            <button
            className="bg-purple-500 px-2 py-1 rounded"
            onClick={exportExcel}
            >
              Excel
            </button>

            <button
            className="bg-gray-500 px-2 py-1 rounded"
            onClick={printBill}
            >
              Print
            </button>

          </div>

        </div>

<table className="w-full text-sm text-gray-300">

  <thead className="border-b border-[#1A1F2E] text-gray-400 bg-[#0f1624]">

    <tr>

      <th className="px-3 py-2 text-left">Date</th>
      <th className="px-3 py-2 text-left">Type</th>
      <th className="px-3 py-2 text-left">Fuel</th>
      <th className="px-3 py-2 text-right">Liters</th>
      <th className="px-3 py-2 text-right">Rate</th>
      <th className="px-3 py-2 text-right">Amount</th>
      <th className="px-3 py-2 text-right">Payment</th>
      <th className="px-3 py-2 text-right">Balance</th>
      <th className="px-3 py-2 text-center">Action</th>

    </tr>

  </thead>

  <tbody>

    {ledger.map((l)=>(

      <tr key={l._id} className="border-t border-[#1F2937] hover:bg-[#111827] transition-colors">

        <td className="px-3 py-2 text-gray-300">
          {new Date(l.date).toLocaleDateString()}
        </td>

        <td className="px-3 py-2">
          {l.type === "fuel" ? "Fuel" : "Payment"}
        </td>

        <td className="px-3 py-2">{l.fuelType || "-"}</td>

        <td className="px-3 py-2 text-right">{l.liters || "-"}</td>

        <td className="px-3 py-2 text-right">{l.rate || "-"}</td>

        <td className="px-3 py-2 text-right">{l.amount || "-"}</td>

        <td className="px-3 py-2 text-right text-green-400">
          {l.payment || "-"}
        </td>

        <td className="px-3 py-2 text-right text-red-400 font-medium">
          ₹{l.balance}
        </td>

        <td className="px-3 py-2 text-center">

        {/* comm */}
          {/* <button
          className="text-blue-400 hover:text-blue-300 mr-2"
          onClick={()=>editEntry(l)}
          >
            Add
          </button> */}

          <button
            className="text-yellow-400 mr-2"
            onClick={()=>generateRowBill(l)}
            >
            Bill
          </button>

        </td>

      </tr>

    ))}

  </tbody>

</table>
      
      
      </div>

    )}



    {/* ADD CUSTOMER MODAL */}

    {showModal &&(

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">

        <div className="bg-[#0B0F17] p-6 rounded w-[350px] border border-[#1A1F2E]">

          <h2 className="text-lg mb-4">
            Add Customer
          </h2>

          <input
          placeholder="Customer Name"
          value={form.name}
          onChange={(e)=>setForm({...form,name:e.target.value})}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          />

          <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e)=>setForm({...form,phone:e.target.value})}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          />

          <input
          placeholder="Address"
          value={form.address}
          onChange={(e)=>setForm({...form,address:e.target.value})}
          className="w-full mb-4 p-2 bg-[#0B0F17]"
          />

          <div className="flex justify-end gap-3">

            <button
            className="bg-gray-700 px-4 py-2"
            onClick={()=>setShowModal(false)}
            >
              Cancel
            </button>

            <button
            className="bg-red-500 px-4 py-2"
            onClick={handleAddCustomer}
            >
              Save
            </button>

          </div>

        </div>

      </div>

    )}



    {/* FUEL MODAL */}

    {fuelModal &&(

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">

        <div className="bg-[#0B0F17] p-6 rounded w-[350px]">

          <h2 className="mb-4">Add Fuel</h2>

          <input
          placeholder="FuelType"
          value={fuel.fuelType}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setFuel({...fuel,fuelType:e.target.value})}
          />

          <input
          placeholder="Liters"
          value={fuel.liters}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setFuel({...fuel,liters:e.target.value})}
          />

          <input
          placeholder="Rate"
          value={fuel.rate}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setFuel({...fuel,rate:e.target.value})}
          />

          <input
          type="date"
          value={fuel.date}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setFuel({...fuel,date:e.target.value})}
          />

          {/* add */}
          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
            type="checkbox"
            checked={fuel.sendWhatsapp}
            onChange={(e)=>setFuel({...fuel,sendWhatsapp:e.target.checked})}
            />
            Send Bill on WhatsApp
          </label>

          <div className="flex justify-end gap-3">

            <button
            className="bg-gray-700 px-4 py-2"
            onClick={()=>setFuelModal(false)}
            >
              Cancel
            </button>

            <button
            className="bg-blue-500 px-4 py-2"
            onClick={saveFuel}
            >
              Save
            </button>

          </div>

        </div>

      </div>

    )}



    {/* PAYMENT MODAL */}

    {paymentModal &&(

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">

        <div className="bg-[#0B0F17] p-6 rounded w-[350px]">

          <h2 className="mb-4">Add Payment</h2>

          <input
          placeholder="Amount"
          value={payment.payment}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setPayment({...payment,payment:e.target.value})}
          />

          <input
          type="date"
          value={payment.date}
          className="w-full mb-3 p-2 bg-[#0B0F17]"
          onChange={(e)=>setPayment({...payment,date:e.target.value})}
          />

          {/* add */}
          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
            type="checkbox"
            checked={fuel.sendWhatsapp}
            onChange={(e)=>setFuel({...fuel,sendWhatsapp:e.target.checked})}
            />
            Send Bill on WhatsApp
          </label>

          <div className="flex justify-end gap-3">

            <button
            className="bg-gray-700 px-4 py-2"
            onClick={()=>setPaymentModal(false)}
            >
              Cancel
            </button>

            <button
            className="bg-green-500 px-4 py-2"
            onClick={savePayment}
            >
              Save
            </button>

          </div>

        </div>

      </div>

    )}

  </div>

  );

}