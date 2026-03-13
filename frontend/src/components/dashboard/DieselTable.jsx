import { useEffect, useState } from "react"
import {
  getDieselSales,
  deleteDieselSale
} from "../../services/dieselApi"

export default function DieselTable({ close, reload }) {

  const [data, setData] = useState([])

  useEffect(() => {
    load()
  }, [])

  const load = async () => {

    const res = await getDieselSales()

    setData(res)

  }

  const remove = async (id) => {

    await deleteDieselSale(id)

    load()

    reload()

  }

  return (

    <div className="fixed inset-0 z-5 flex items-center justify-center bg-black/70">

      <div className="bg-[#0A0D14] border border-[#1A1D26] w-[900px] p-6 rounded-xl">

        <h2 className="text-white mb-4">
          Diesel Sales
        </h2>

        <table className="w-full text-gray-300">

          <thead className="text-xm text-gray-500 border-b border-[#1A1D26]">

            <tr>

              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Liters</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Total</th>
              <th className="text-left py-2">Action</th>

            </tr>

          </thead>

          <tbody>

            {data.map((item) => (

              <tr
                key={item._id}
                className="border-b border-[#1A1D26] hover:bg-[#11151f]"
              >

                <td className="py-1">{new Date(item.date).toLocaleDateString()}</td>

                <td>{item.liters}</td>

                <td>₹{item.price}</td>

                <td>₹{item.totalAmount}</td>

                <td>

                  <button
                    onClick={() => remove(item._id)}
                    className="text-red-400"
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
          className="mt-4 border border-gray-600 px-4 py-2 rounded text-gray-300"
        >
          Close
        </button>

      </div>

    </div>

  )
}