import { useEffect, useState } from "react"

import {
getLubricants,
getProducts,
addLubricant,
updateLubricant,
deleteLubricant,
addProduct,
deleteProduct,
deleteMonth
} from "../services/lubricantApi"



export default function Lubricants(){

const [data,setData] = useState([])
const [products,setProducts] = useState([])

const [search,setSearch] = useState("")
const [productFilter,setProductFilter] = useState("")
const [dateFilter,setDateFilter] = useState("")

const [open,setOpen] = useState(false)
const [productModal,setProductModal] = useState(false)

const [edit,setEdit] = useState(null)

const [form,setForm] = useState({

date:"",
product:"",
price:"",
quantity:"",
soldBy:"Admin"

})

const [productForm,setProductForm] = useState({

name:"",
price:"",
stock:""

})

const [openCard,setOpenCard] = useState(null)
const [showFilter,setShowFilter] = useState(false)
const [fabOpen,setFabOpen] = useState(false)

/* LOAD SALES */

const loadSales = async()=>{

const res = await getLubricants()

setData(res)

}



/* LOAD PRODUCTS */

const loadProducts = async()=>{

const res = await getProducts()

setProducts(res)

}



useEffect(()=>{

loadSales()
loadProducts()

},[])



/* PRODUCT CHANGE */

const changeProduct = (name)=>{

const p = products.find(x=>x.name===name)

setForm({

...form,
product:name,
price:p?.price || ""

})

}



/* SAVE SALE */

const save = async()=>{

if(!form.date || !form.product || !form.quantity){

alert("Please fill all fields")
return

}

const total = Number(form.price) * Number(form.quantity)

const payload = {

...form,
price:Number(form.price),
quantity:Number(form.quantity),
total

}

if(edit){

await updateLubricant(edit._id,payload)

}else{

await addLubricant(payload)

}

setOpen(false)
setEdit(null)

setForm({

date:"",
product:"",
price:"",
quantity:"",
soldBy:"Admin"

})

loadSales()
loadProducts()

}



/* DELETE SALE */

const remove = async(id)=>{

await deleteLubricant(id)

loadSales()

}



/* ADD PRODUCT */

const saveProduct = async()=>{

if(!productForm.name || !productForm.price){

alert("Enter product details")
return

}

await addProduct({

...productForm,
price:Number(productForm.price),
stock:Number(productForm.stock)

})

setProductModal(false)

setProductForm({

name:"",
price:"",
stock:""

})

loadProducts()

}



/* DELETE PRODUCT */

const removeProduct = async(id)=>{

await deleteProduct(id)

loadProducts()

}



/* DELETE MONTH DATA */

const deleteMonthData = async()=>{

const month = prompt("Enter Month (example 03)")
const year = prompt("Enter Year (example 2026)")

if(!month || !year) return

await deleteMonth({month,year})

loadSales()

}



/* FILTER */

const filtered = data.filter((e)=>{

return (

(!search || e.product.toLowerCase().includes(search.toLowerCase())) &&
(!productFilter || e.product===productFilter) &&
(!dateFilter || e.date===dateFilter)

)

})


/* STATS */

const today = new Date()
const todayStr = today.toISOString().slice(0,10)

let todayTotal = 0
let weekTotal = 0
let monthTotal = 0
let totalAll = 0

filtered.forEach(e=>{

 const d = new Date(e.date)

 totalAll += Number(e.total || 0)

 if(e.date === todayStr){
  todayTotal += Number(e.total)
 }

 const diffDays = (today - d) / (1000*60*60*24)

 if(diffDays <= 7){
  weekTotal += Number(e.total)
 }

 if(
  d.getMonth() === today.getMonth() &&
  d.getFullYear() === today.getFullYear()
 ){
  monthTotal += Number(e.total)
 }

})


const total = Number(form.price) * Number(form.quantity) || 0



return(

<div className="p-6 text-gray-300">


{/* HEADER */}

<div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6">
<h1 className="text-white text-3xl font-bold">

Lubricant Sales

</h1>

<div className="flex gap-3 hidden sm:block">

<button
onClick={()=>setProductModal(true)}
className="bg-blue-600 px-4 py-2 rounded text-white"
>

+ Add Product

</button>

<button
onClick={deleteMonthData}
className="bg-yellow-600 px-4 py-2 rounded text-white"
>

Delete Month

</button>

<button
onClick={()=>setOpen(true)}
className="bg-red-600 px-5 py-2 rounded text-white"
>

+ Add Sale

</button>

</div>

</div>



{/* PRODUCT STOCK TABLE */}

<div className="hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden mb-6">

<table className="w-full text-sm">

<thead className="border-b border-[#1F2937] text-gray-300 font-bold">

<tr>

<th className="p-3 text-left ">Product</th>
<th className="p-3 text-left">Price</th>
<th className="p-3 text-left">Stock</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{products.map((p)=>(

<tr key={p._id} className="border-b border-[#1F2937]">

<td className="p-3">{p.name}</td>
<td className="p-3">₹{p.price}</td>
<td className="p-3 text-green-500 font-bold">{p.stock}</td>

<td className="p-3">

<button
onClick={()=>removeProduct(p._id)}
className="text-red-400"
>

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>



{/* STATS */}


<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-bold">
<div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

Today

<div className="text-white text-xl">

₹{todayTotal}

</div>

</div>



<div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

Week

<div className="text-white text-xl">

₹{weekTotal}

</div>

</div>



<div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

Month

<div className="text-white text-xl">

₹{monthTotal}

</div>

</div>



<div className="bg-[#0B0F17] border border-[#1A1F2E] p-4 rounded-xl font-bold">

Total

<div className="text-white text-xl">

₹{totalAll}

</div>

</div>

</div>

<div className="sm:hidden space-y-4 mb-5">

{products.map(p=>(

<div
key={p._id}
className="bg-[#0B0F17] border border-[#1A1F2E] rounded-2xl p-4 shadow-md active:scale-[0.98] transition"
>

{/* TOP ROW */}
<div className="flex justify-between items-start">

{/* LEFT */}
<div>
<p className="text-white font-semibold text-lg">
{p.name}
</p>

<p className="text-gray-400 text-sm mt-1">
₹{p.price}
</p>
</div>

{/* RIGHT */}
<div className="flex flex-col items-end gap-2">

<p className={`text-xs px-3 py-1 rounded-full font-semibold 
${p.stock < 5 
? "bg-red-500/10 text-red-400 border border-red-500/30" 
: "bg-green-500/10 text-green-400 border border-green-500/30"
}`}>
Stock: {p.stock}
</p>

<button
onClick={()=>removeProduct(p._id)}
className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg text-xs transition"
>
Delete
</button>

</div>

</div>


</div>

))}

</div>

{/* FILTER */}

<div className="flex flex-col sm:flex-row gap-3 mb-6">

<input
placeholder="Search..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="bg-[#111827] p-2 rounded w-full sm:w-60"
/>

<button
onClick={()=>setShowFilter(!showFilter)}
className="bg-[#1A1F2E] px-3 py-2 rounded text-sm"
>
Filters
</button>

{showFilter && (
<div className="flex flex-col gap-3 bg-[#0B0F17] p-3 rounded">

<select
value={productFilter}
onChange={(e)=>setProductFilter(e.target.value)}
className="bg-[#111827] p-2 rounded"
>
<option value="">All Product</option>
{products.map(p=>(
<option key={p._id} value={p.name}>{p.name}</option>
))}
</select>

<input
type="date"
value={dateFilter}
onChange={(e)=>setDateFilter(e.target.value)}
className="bg-[#111827] p-2 rounded text-white"
/>

</div>
)}

</div>

{/* SALES TABLE */}

<div className="hidden sm:block bg-[#0B0F17] border border-[#1A1F2E] rounded-xl overflow-hidden">

<table className="w-full text-sm">

<thead className="border-b border-[#1F2937] text-gray-400">

<tr>

<th className="p-3 text-left">Date</th>
<th className="p-3 text-left">Product</th>
<th className="p-3 text-left">Qty</th>
<th className="p-3 text-left">Price</th>
<th className="p-3 text-left">Total</th>
<th className="p-3 text-left">Sold By</th>
<th className="p-3 text-left">Action</th>

</tr>

</thead>

<tbody>

{filtered.map((e)=>(

<tr
key={e._id}
className="border-b border-[#1F2937]"
>

<td className="p-3">{e.date}</td>

<td className="p-3">{e.product}</td>

<td className="p-3">{e.quantity}</td>

<td className="p-3">₹{e.price}</td>

<td className="p-3 text-red-400">₹{e.total}</td>

<td className="p-3">{e.soldBy}</td>

<td className="p-3 flex gap-3">

<button
onClick={()=>{
setEdit(e)
setForm(e)
setOpen(true)
}}
className="text-blue-400"
>
Edit
</button>

<button
onClick={()=>remove(e._id)}
className="text-red-400"
>
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>



<div className="sm:hidden space-y-4">
<p className="text-white font-semibold ml-3">Sales</p>

{filtered.map(e=>{

const isOpen = openCard === e._id

return(

    

<div
key={e._id}
onClick={()=>setOpenCard(isOpen ? null : e._id)}
className="bg-[#0B0F17] border border-[#1A1F2E] rounded-xl p-4 active:scale-95 transition"
>
   

{/* TOP */}
<div className="flex justify-between items-center">

<div>
<p className="text-white font-semibold">{e.product}</p>
<p className="text-xs text-gray-400">{e.date}</p>
</div>

<p className="text-red-400 font-bold">₹{e.total}</p>

</div>

{/* BASIC */}
<div className="text-sm text-gray-300 mt-2">
Qty: {e.quantity}
</div>

{/* EXPAND */}
{isOpen && (

<div className="mt-3 border-t border-[#1A1F2E] pt-3 space-y-2">

<p className="text-sm">Price: ₹{e.price}</p>
<p className="text-sm">Sold by: {e.soldBy}</p>

<div className="flex gap-2">

<button
onClick={(ev)=>{
ev.stopPropagation()
setEdit(e)
setForm(e)
setOpen(true)
}}
className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded"
>
Edit
</button>

<button
onClick={(ev)=>{
ev.stopPropagation()
remove(e._id)
}}
className="flex-1 bg-red-500/20 text-red-400 py-2 rounded"
>
Delete
</button>

</div>

</div>

)}

</div>

)

})}

</div>



{/* ADD SALE MODAL */}

{open &&(

<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

<div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[400px]">

<h2 className="text-white mb-4">

{edit ? "Edit Lubricant Sale" : "Add Lubricant Sale"}

</h2>



<input
type="date"
value={form.date}
onChange={(e)=>setForm({...form,date:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded text-white [&::-webkit-calendar-picker-indicator]:invert"
/>



<select
value={form.product}
onChange={(e)=>changeProduct(e.target.value)}
className="w-full mb-3 p-2 bg-[#111827] rounded"
>

<option value="">Select Product</option>

{products.map((p)=>(

<option key={p._id} value={p.name}>
{p.name}
</option>

))}

</select>



<input
placeholder="Price"
value={form.price}
onChange={(e)=>setForm({...form,price:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
/>



<input
placeholder="Quantity"
value={form.quantity}
onChange={(e)=>setForm({...form,quantity:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
/>



<select
value={form.soldBy}
onChange={(e)=>setForm({...form,soldBy:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
>

<option>Admin</option>
<option>Rohit</option>
<option>Manager</option>

</select>



<div className="text-white mb-4">

Total: ₹{total}

</div>



<div className="flex justify-end gap-3">

<button
onClick={()=>{
setOpen(false)
setEdit(null)
}}
className="bg-gray-700 px-4 py-2 rounded"
>

Cancel

</button>

<button
onClick={save}
className="bg-red-600 px-4 py-2 rounded text-white"
>

Save

</button>

</div>

</div>

</div>

)}



{/* ADD PRODUCT MODAL */}

{productModal &&(

<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">

<div className="bg-[#0B0F17] border border-[#1A1F2E] p-6 rounded w-[400px]">

<h2 className="text-white mb-4">

Add Product

</h2>



<input
placeholder="Product Name"
value={productForm.name}
onChange={(e)=>setProductForm({...productForm,name:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
/>



<input
placeholder="Price"
value={productForm.price}
onChange={(e)=>setProductForm({...productForm,price:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
/>



<input
placeholder="Stock"
value={productForm.stock}
onChange={(e)=>setProductForm({...productForm,stock:e.target.value})}
className="w-full mb-3 p-2 bg-[#111827] rounded"
/>



<div className="flex justify-end gap-3">

<button
onClick={()=>setProductModal(false)}
className="bg-gray-700 px-4 py-2 rounded"
>

Cancel

</button>

<button
onClick={saveProduct}
className="bg-blue-600 px-4 py-2 rounded text-white"
>

Save

</button>

</div>

</div>

</div>

)}


{/* FLOATING BUTTON */}

<div className="fixed bottom-6 right-6 sm:hidden">

<button
onClick={()=>setFabOpen(!fabOpen)}
className="bg-blue-600 w-14 h-14 rounded-full text-white text-2xl shadow-lg"
>
+
</button>

{fabOpen && (

<div className="flex flex-col gap-2 mt-3">

<button
onClick={()=>setOpen(true)}
className="bg-red-600 px-4 py-2 rounded text-white text-sm"
>
+ Sale
</button>

<button
onClick={()=>setProductModal(true)}
className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
>
+ Product
</button>

</div>

)}

</div>

</div>

)

}