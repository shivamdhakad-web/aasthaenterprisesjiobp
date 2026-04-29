import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { calculateDailyReport } from "../../lib/dailyReport"

const numberInputClass =
  "input min-w-0 rounded-xl px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

const sectionDefinitions = [
  { id: "section-a", title: "(A) Totaliser Reading" },
  { id: "section-b", title: "(B) Cash Collection" },
  { id: "section-c", title: "(C) Online" },
  { id: "section-d", title: "(D) Fleet Card Sales" },
  { id: "section-e", title: "(E) Credit Customers" },
  { id: "section-f", title: "(F) Total Collection For All MOPs" },
  { id: "section-g", title: "(G) Shortage / Overage" },
  { id: "section-h", title: "(H) Sales Recorded In HHT/System" },
  { id: "section-i", title: "(I) Difference - Sales Booked In System & Actual Sales" },
  { id: "section-j", title: "Cash Denominations" },
  { id: "section-k", title: "Credit Customer List" },
  { id: "section-l", title: "Signatures" },
]

export default function DailyReportEditor({
  form,
  setForm,
  employeeName,
  readOnly = false,
  submitLabel,
  onSubmit,
  onExportPdf,
}) {
  const calculated = calculateDailyReport(form)
  const [activeSection, setActiveSection] = useState(null)
  const toggleSection = (sectionId) => {
    setActiveSection((current) => (current === sectionId ? null : sectionId))
  }

  const summaryCards = [
    { label: "Total Collection", value: `Rs. ${calculated.totalCollection.toFixed(2)}` },
    { label: "Actual Sales", value: `Rs. ${calculated.totalSales.toFixed(2)}` },
    { label: "Shortage / Overage", value: `Rs. ${calculated.shortOver.toFixed(2)}` },
    { label: "Difference", value: `Rs. ${calculated.difference.toFixed(2)}` },
  ]

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const updateNested = (section, key, value) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }))
  }

  const updateArrayValue = (key, index, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
  }

  const updateRowValue = (key, index, field, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }))
  }

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F17] p-3 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.34em] text-green-300 sm:text-[11px]">
              DSM Shift Check
            </p>
            <h1 className="mt-2 text-xl font-semibold text-white sm:text-3xl">
              Fuel Forecourt Daily Sheet
            </h1>
            <p className="mt-2 text-xs text-gray-400 sm:text-sm">
              Employee: <span className="font-medium text-white">{employeeName}</span>
            </p>
          </div>

          <div className="grid w-full gap-2.5 sm:grid-cols-2 sm:gap-3 2xl:grid-cols-4 xl:max-w-[820px]">
            <Field
              label="Date"
              type="date"
              value={form.reportDate}
              readOnly={readOnly}
              onChange={(value) => updateField("reportDate", value)}
            />
            <Field
              label="R.O. Location"
              value={form.location}
              readOnly={readOnly}
              onChange={(value) => updateField("location", value)}
            />
            <Field
              label="Shift"
              value={form.shift}
              readOnly={readOnly}
              onChange={(value) => updateField("shift", value)}
            />
            <Field
              label="Lube"
              value={form.lube}
              readOnly={readOnly}
              onChange={(value) => updateField("lube", value)}
            />
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <StatPanel key={item.label} label={item.label} value={item.value} compact />
          ))}
        </div>
      </section>

      <div className="space-y-3">
        <AccordionSection
          title={sectionDefinitions[0].title}
          isOpen={activeSection === sectionDefinitions[0].id}
          onToggle={() => toggleSection(sectionDefinitions[0].id)}
        >
          <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,240px)_minmax(0,1fr)]">
            <label className="rounded-xl border border-[#1F2937] bg-[#04060B] p-3 text-xs text-gray-300 sm:text-sm">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 sm:text-[11px]">
                Manual total
              </span>
              <span className="mt-2.5 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.manualTotalEnabled}
                  disabled={readOnly}
                  onChange={(event) => updateField("manualTotalEnabled", event.target.checked)}
                  className="h-4 w-4 accent-green-500"
                />
                <span>Enable manual override</span>
              </span>
            </label>
            <Field
              label="Manual Total Sales"
              value={form.manualTotalSales}
              type="number"
              readOnly={readOnly || !form.manualTotalEnabled}
              onChange={(value) => updateField("manualTotalSales", value)}
            />
            <StatPanel label="Grand Amount" value={`Rs. ${calculated.grandAmount.toFixed(2)}`} />
          </div>

          <div className="mt-4 space-y-2.5 lg:hidden">
            {form.totaliserRows.map((row, index) => {
              const currentRow = calculated.totaliserRows[index]
              return (
                <div
                  key={`${row.label}-${index}`}
                  className="rounded-2xl border border-[#1F2937] bg-[#04060B] p-3"
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-semibold leading-6 text-white">{row.label}</h3>
                    <span className="inline-flex w-fit rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-[11px] font-medium text-green-300">
                      Rs. {currentRow.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    <CompactField
                      label="Closing"
                      type="number"
                      value={row.closing}
                      readOnly={readOnly}
                      onChange={(value) => updateRowValue("totaliserRows", index, "closing", value)}
                    />
                    <CompactField
                      label="Opening"
                      type="number"
                      value={row.opening}
                      readOnly={readOnly}
                      onChange={(value) => updateRowValue("totaliserRows", index, "opening", value)}
                    />
                    <CompactStat label="Dispensed" value={currentRow.dispensed.toFixed(2)} />
                    <CompactField
                      label="Pump Test"
                      type="number"
                      value={row.pumpTest}
                      readOnly={readOnly}
                      onChange={(value) => updateRowValue("totaliserRows", index, "pumpTest", value)}
                    />
                    <CompactField
                      label="Own Use"
                      type="number"
                      value={row.ownUse}
                      readOnly={readOnly}
                      onChange={(value) => updateRowValue("totaliserRows", index, "ownUse", value)}
                    />
                    <CompactStat label="Net Dispensed" value={currentRow.netDispensed.toFixed(2)} />
                    <CompactField
                      label="Rate"
                      type="number"
                      value={row.rate}
                      readOnly={readOnly}
                      onChange={(value) => updateRowValue("totaliserRows", index, "rate", value)}
                    />
                    <CompactStat label="Amount" value={`Rs. ${currentRow.amount.toFixed(2)}`} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 hidden overflow-x-auto lg:block">
            <table className="table min-w-[1080px]">
              <thead>
                <tr>
                  <th>Totaliser Readings</th>
                  <th>Closing</th>
                  <th>Opening</th>
                  <th>Dispensed</th>
                  <th>Pump Test</th>
                  <th>Own Use</th>
                  <th>Net Dispensed</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {form.totaliserRows.map((row, index) => {
                  const currentRow = calculated.totaliserRows[index]
                  return (
                    <tr key={`${row.label}-${index}`}>
                      <td>{row.label}</td>
                      <td>
                        <NumericInput
                          value={row.closing}
                          disabled={readOnly}
                          onChange={(value) => updateRowValue("totaliserRows", index, "closing", value)}
                        />
                      </td>
                      <td>
                        <NumericInput
                          value={row.opening}
                          disabled={readOnly}
                          onChange={(value) => updateRowValue("totaliserRows", index, "opening", value)}
                        />
                      </td>
                      <td>{currentRow.dispensed.toFixed(2)}</td>
                      <td>
                        <NumericInput
                          value={row.pumpTest}
                          disabled={readOnly}
                          onChange={(value) => updateRowValue("totaliserRows", index, "pumpTest", value)}
                        />
                      </td>
                      <td>
                        <NumericInput
                          value={row.ownUse}
                          disabled={readOnly}
                          onChange={(value) => updateRowValue("totaliserRows", index, "ownUse", value)}
                        />
                      </td>
                      <td>{currentRow.netDispensed.toFixed(2)}</td>
                      <td>
                        <NumericInput
                          value={row.rate}
                          disabled={readOnly}
                          onChange={(value) => updateRowValue("totaliserRows", index, "rate", value)}
                        />
                      </td>
                      <td>{currentRow.amount.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[1].title}
          isOpen={activeSection === sectionDefinitions[1].id}
          onToggle={() => toggleSection(sectionDefinitions[1].id)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
            {form.cashDrops.map((value, index) => (
              <Field
                key={`drop-${index}`}
                label={`Drop ${index + 1}`}
                type="number"
                value={value}
                readOnly={readOnly}
                onChange={(nextValue) => updateArrayValue("cashDrops", index, nextValue)}
              />
            ))}
            <Field
              label="Shift Starting Cash"
              type="number"
              value={form.cashStart}
              readOnly={readOnly}
              onChange={(value) => updateField("cashStart", value)}
            />
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <StatPanel label="Total Dropped" value={`Rs. ${calculated.cashTotal.toFixed(2)}`} />
            <StatPanel label="Cash Net" value={`Rs. ${calculated.cashNet.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[2].title}
          isOpen={activeSection === sectionDefinitions[2].id}
          onToggle={() => toggleSection(sectionDefinitions[2].id)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <Field
              label="UPI Amount"
              type="number"
              value={form.online.upiAmt}
              readOnly={readOnly}
              onChange={(value) => updateNested("online", "upiAmt", value)}
            />
            <Field
              label="Card Amount"
              type="number"
              value={form.online.cardAmt}
              readOnly={readOnly}
              onChange={(value) => updateNested("online", "cardAmt", value)}
            />
          </div>

          <div className="mt-4">
            <StatPanel label="Online Total" value={`Rs. ${calculated.onlineTotal.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[3].title}
          isOpen={activeSection === sectionDefinitions[3].id}
          onToggle={() => toggleSection(sectionDefinitions[3].id)}
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-2xl border border-[#1F2937] bg-[#04060B] p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 sm:text-[11px]">
                Fleet Amount
              </p>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                Yahan sirf fleet card sale ka total amount dalo.
              </p>
              <input
                type="number"
                value={form.fleet.amount ?? ""}
                disabled={readOnly}
                onChange={(event) => updateNested("fleet", "amount", event.target.value)}
                className={`${numberInputClass} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-70`}
              />
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 sm:text-[11px]">
                Current Fleet Total
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                Rs. {calculated.fleetAmount.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Ye amount total collection me automatically include ho jayega.
              </p>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[4].title}
          isOpen={activeSection === sectionDefinitions[4].id}
          onToggle={() => toggleSection(sectionDefinitions[4].id)}
        >
          <div className="grid gap-2.5 sm:gap-3">
            {form.creditCustomers.map((item, index) => (
              <div
                key={`credit-customer-${index}`}
                className="grid gap-2.5 rounded-2xl border border-[#1F2937] bg-[#04060B] p-3 md:grid-cols-[minmax(0,1fr)_140px]"
              >
                <Field
                  label={`Party ${index + 1}`}
                  value={item.label}
                  readOnly={readOnly}
                  onChange={(value) => updateRowValue("creditCustomers", index, "label", value)}
                />
                <Field
                  label="Amount"
                  type="number"
                  value={item.value}
                  readOnly={readOnly}
                  onChange={(value) => updateRowValue("creditCustomers", index, "value", value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <StatPanel label="Total Credit" value={`Rs. ${calculated.creditTotal.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[5].title}
          isOpen={activeSection === sectionDefinitions[5].id}
          onToggle={() => toggleSection(sectionDefinitions[5].id)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
            <StatPanel label="Cash Net" value={`Rs. ${calculated.cashNet.toFixed(2)}`} />
            <StatPanel label="Online Total" value={`Rs. ${calculated.onlineTotal.toFixed(2)}`} />
            <StatPanel label="Fleet" value={`Rs. ${calculated.fleetAmount.toFixed(2)}`} />
            <StatPanel label="Credit" value={`Rs. ${calculated.creditTotal.toFixed(2)}`} />
            <StatPanel label="Total Collection" value={`Rs. ${calculated.totalCollection.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[6].title}
          isOpen={activeSection === sectionDefinitions[6].id}
          onToggle={() => toggleSection(sectionDefinitions[6].id)}
        >
          <StatPanel label="Difference (F - A)" value={`Rs. ${calculated.shortOver.toFixed(2)}`} />
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[7].title}
          isOpen={activeSection === sectionDefinitions[7].id}
          onToggle={() => toggleSection(sectionDefinitions[7].id)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            <Field
              label="HHT Credit Card"
              type="number"
              value={form.hht.creditCard}
              readOnly={readOnly}
              onChange={(value) => updateNested("hht", "creditCard", value)}
            />
            <Field
              label="HHT Fleet"
              type="number"
              value={form.hht.fleet}
              readOnly={readOnly}
              onChange={(value) => updateNested("hht", "fleet", value)}
            />
            <Field
              label="HHT Other"
              type="number"
              value={form.hht.other}
              readOnly={readOnly}
              onChange={(value) => updateNested("hht", "other", value)}
            />
          </div>

          <div className="mt-4">
            <StatPanel label="HHT Total" value={`Rs. ${calculated.hhtTotal.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[8].title}
          isOpen={activeSection === sectionDefinitions[8].id}
          onToggle={() => toggleSection(sectionDefinitions[8].id)}
        >
          <StatPanel label="Difference (H - A)" value={`Rs. ${calculated.difference.toFixed(2)}`} />
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[9].title}
          isOpen={activeSection === sectionDefinitions[9].id}
          onToggle={() => toggleSection(sectionDefinitions[9].id)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
            {form.denominations.map((item, index) => (
              <Field
                key={`denomination-${item.label}`}
                label={`${item.label} Qty`}
                type="number"
                value={item.qty}
                readOnly={readOnly}
                onChange={(value) => updateRowValue("denominations", index, "qty", value)}
              />
            ))}
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <StatPanel label="Total Cash" value={`Rs. ${calculated.denominationTotal.toFixed(2)}`} />
            <StatPanel label="Summary Total" value={`Rs. ${calculated.summaryTotal.toFixed(2)}`} />
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[10].title}
          isOpen={activeSection === sectionDefinitions[10].id}
          onToggle={() => toggleSection(sectionDefinitions[10].id)}
        >
          <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
            {form.creditList.map((item, index) => (
              <div
                key={`credit-list-${index}`}
                className="grid gap-2.5 rounded-2xl border border-[#1F2937] bg-[#04060B] p-3"
              >
                <Field
                  label={`Party ${index + 1}`}
                  value={item.label}
                  readOnly={readOnly}
                  onChange={(value) => updateRowValue("creditList", index, "label", value)}
                />
                <Field
                  label="Details"
                  value={item.details}
                  readOnly={readOnly}
                  onChange={(value) => updateRowValue("creditList", index, "details", value)}
                />
              </div>
            ))}
          </div>
        </AccordionSection>

        <AccordionSection
          title={sectionDefinitions[11].title}
          isOpen={activeSection === sectionDefinitions[11].id}
          onToggle={() => toggleSection(sectionDefinitions[11].id)}
        >
          <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
            <Field
              label="System Login"
              value={form.signatures.systemLogin}
              readOnly={readOnly}
              onChange={(value) => updateNested("signatures", "systemLogin", value)}
            />
            <Field
              label="Shift Supervisor Name"
              value={form.signatures.shiftSupervisor}
              readOnly={readOnly}
              onChange={(value) => updateNested("signatures", "shiftSupervisor", value)}
            />
          </div>
        </AccordionSection>
      </div>

      <div className="sticky bottom-0 z-10 -mx-3 border-t border-[#1F2937] bg-white px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          {onExportPdf ? (
            <button
              onClick={onExportPdf}
              className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-500 sm:w-auto"
            >
              Export PDF
            </button>
          ) : null}
          {onSubmit ? (
            <button
              onClick={onSubmit}
              disabled={readOnly}
              className="w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function AccordionSection({ title, isOpen, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#1F2937] bg-[#0B0F17]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
      >
        <div>
          <h2 className="text-sm font-semibold text-white sm:text-lg">{title}</h2>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? <div className="border-t border-[#1F2937] p-3 sm:p-5">{children}</div> : null}
    </section>
  )
}

function Field({ label, value, onChange, readOnly, type = "text" }) {
  return (
    <label className="rounded-xl border border-[#1F2937] bg-[#04060B] p-2.5 sm:p-3">
      <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500 sm:text-[11px]">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`${type === "number" ? numberInputClass : "input rounded-xl px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm"} mt-2.5 w-full disabled:cursor-not-allowed disabled:opacity-70`}
      />
    </label>
  )
}

function CompactField({ label, value, onChange, readOnly, type = "text" }) {
  return (
    <label className="rounded-xl border border-[#1F2937] bg-[#070B12] p-2.5 sm:p-3">
      <span className="block text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`${type === "number" ? numberInputClass : "input rounded-xl px-2.5 py-2 text-xs sm:px-3 sm:py-2.5 sm:text-sm"} mt-2 w-full disabled:cursor-not-allowed disabled:opacity-70`}
      />
    </label>
  )
}

function NumericInput({ value, onChange, disabled }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`${numberInputClass} w-full disabled:cursor-not-allowed disabled:opacity-70`}
    />
  )
}

function StatPanel({ label, value, compact = false }) {
  return (
    <div className={`rounded-xl border border-[#1F2937] bg-[#04060B] ${compact ? "p-3" : "p-3 sm:p-4"}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 sm:text-[11px]">{label}</p>
      <p className={`mt-2.5 font-semibold text-white ${compact ? "text-base sm:text-lg" : "text-base sm:text-xl"}`}>
        {value}
      </p>
    </div>
  )
}

function CompactStat({ label, value }) {
  return (
    <div className="rounded-xl border border-dashed border-[#233044] bg-[#070B12] p-2.5 sm:p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-xs font-semibold text-white sm:text-sm">{value}</p>
    </div>
  )
}
