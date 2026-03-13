import { useEffect, useState } from "react"
import {
  getPetrolSales,
  deletePetrolSale
} from "../../services/petrolApi"

export default function PetrolTable({ close, reload }) {

  const [data, setData] = useState([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const res = await getPetrolSales()
    setData(res.data)
  }

  const remove = async (id) => {
    await deletePetrolSale(id)
    load()
    reload()
  }

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">

      <div className="bg-[#0A0D14] border border-[#1A1D26] w-[900px] p-6 rounded-xl shadow-xl">

        <h2 className="text-white text-lg font-semibold mb-5">
          Petrol Sales
        </h2>

        <table className="w-full text-sm text-gray-300">

          <thead className="text-xs text-gray-500 border-b border-[#1A1D26]">

            <tr>

              <th className="text-left py-2">Date</th>
              <th className="text-right py-2">Liters</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
              <th className="text-center py-2">Action</th>

            </tr>

          </thead>

          <tbody>

            {data.map((item) => (

              <tr
                key={item._id}
                className="border-b border-[#1A1D26] hover:bg-[#11151f]"
              >

                <td className="py-2">
                  {new Date(item.date).toLocaleDateString()}
                </td>

                <td className="text-right py-2">
                  {item.liters}
                </td>

                <td className="text-right py-2">
                  ₹{item.price}
                </td>

                <td className="text-right py-2">
                  ₹{item.totalAmount.toLocaleString()}
                </td>

                <td className="text-center py-2">

                  <button
                    onClick={() => remove(item._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <button
          onClick={close}
          className="mt-5 border border-gray-600 px-4 py-2 rounded text-gray-300 hover:bg-[#151a25]"
        >
          Close
        </button>

      </div>

    </div>

  )
}