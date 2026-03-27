
import DieselCard from "../../components/cards/DieselCard"
import RevenueCard from "../../components/cards/RevenueCard"
import TankLevelCard from "../../components/cards/TankLevelCard"

import SalesTrendChart from "../../components/dashboard/SalesTrendChart"
import FuelMixChart from "../../components/dashboard/FuelMixChart"
import FuelRevenueChart from "../../components/dashboard/FuelRevenueChart"
import ReminderBox from "../../components/dashboard/ReminderBox"

export default function Dashboard(){

return(

<div className="p-6 space-y-6">

{/* 4 CARDS */}

<div className="grid sm:grid-cols-3 grid-cols-1 gap-5">

{/* <PetrolCard/> */}

<DieselCard/>

<RevenueCard/>

<TankLevelCard/>

</div>


{/* CHART SECTION */}

<div className="grid sm:grid-cols-3 grid-cols-1 gap-6">

<div className="col-span-2">

<SalesTrendChart/>

</div>

<div className="col-span-1">

<FuelMixChart/>

</div>

</div>

{/* WEEKLY REVENUE */}

<div className="grid grid-cols-1">

<FuelRevenueChart/>

</div>
 <ReminderBox/>
</div>

)

}