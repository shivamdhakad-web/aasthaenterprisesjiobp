import { useEffect, useState } from "react"
import { getTodayPetrolStats } from "../../services/petrolApi"
import PetrolAddModal from "../modals/PetrolAddModal"
import PetrolTable from "../dashboard/PetrolTable"

export default function PetrolCard() {

  const [stats, setStats] = useState({
    todayLiters: 0,
    percent: 0
  })

  const [openAdd, setOpenAdd] = useState(false)
  const [openView, setOpenView] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const res = await getTodayPetrolStats()
    setStats(res.data)
  }

  const percentColor =
    stats.percent >= 0 ? "text-green-400" : "text-red-400"

  return (
    <>
      <div className="group bg-[#0A0D14] border border-[#1A1D26] border-t-2 border-t-red-500 rounded-xl p-5 transition duration-300 hover:bg-[#0d1119]">
        <div className="flex justify-between items-center">

          <div>

            <p className="text-sm text-gray-400">
              PETROL SOLD TODAY
            </p>

            <h2 className="text-2xl font-bold text-white mt-2">
              {stats.todayLiters} L
            </h2>

            <p className={`${percentColor} text-sm mt-1`}>
              {stats.percent >= 0 ? "↑" : "↓"}
              {Math.abs(stats.percent)}% vs yesterday
            </p>

          </div>


          {/* Right Section */}
          <div className="relative w-[90px] h-[40px] flex items-center justify-center">

            {/* Pump Icon (Default) */}
            <div className="group-hover:hidden w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 text-lg">

              ⛽

            </div>


            {/* Buttons (Hover) */}
            <div className="absolute flex gap-2 opacity-0 scale-75 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100">

              <button
                onClick={() => setOpenAdd(true)}
                className="bg-red-500 px-3 py-1 rounded text-white text-sm hover:opacity-90"
              >
                Add
              </button>

              <button
                onClick={() => setOpenView(true)}
                className="border border-gray-600 px-3 py-1 rounded text-gray-300 text-sm hover:bg-[#111827]"
              >
                View
              </button>

            </div>

          </div>

        </div>

      </div>


      {openAdd && (
        <PetrolAddModal
          close={() => setOpenAdd(false)}
          reload={loadStats}
        />
      )}

      {openView && (
        <PetrolTable
          close={() => setOpenView(false)}
          reload={loadStats}
        />
      )}
    </>
  )
}