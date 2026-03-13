const API = "https://aasthaenterprisesjiobp.onrender.com/api/tanker-deliveries"

export const getDeliveries = async()=>{

const res = await fetch(API)

return res.json()

}

export const addDelivery = async(data)=>{

const res = await fetch(API,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
})

return res.json()

}

export const updateDelivery = async(id,data)=>{

const res = await fetch(`${API}/${id}`,{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
})

return res.json()

}

export const deleteDelivery = async(id)=>{

await fetch(`${API}/${id}`,{
method:"DELETE"
})

}