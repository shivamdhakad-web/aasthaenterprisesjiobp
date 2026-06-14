import { useEffect, useState } from "react";
import { getSalarySummary } from "../../services/salaryApi";

export default function EmployeeSalary() {
  const [month, setMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = async ({ targetMonth = month, targetDate = selectedDate } = {}) => {
    const params = targetDate
      ? { date: targetDate }
      : targetMonth
        ? { month: targetMonth }
        : { scope: "all" };
    const data = await getSalarySummary(null, params);
    setSummary(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleLoad = () => {
    load();
  };

  const handleClearFilters = () => {
    setMonth("");
    setSelectedDate("");
    load({ targetMonth: "", targetDate: "" });
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header Section with Toggle Button */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">My Salary</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
            Salary report is auto calculated on the basis of attendance, shortfall and advance.
            </p>
          </div>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] sm:w-auto"
          >
            {showFilters ? "Hide Filters" : "Filter Salary"}
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-color)] pt-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1 sm:flex-1">
              <label className="text-xs text-[color:var(--text-secondary)]">Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex flex-col gap-1 sm:flex-1">
              <label className="text-xs text-[color:var(--text-secondary)]">Specific Date (dd-mm-yyyy)</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex gap-2 sm:flex-none">
              <button
                onClick={handleClearFilters}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 text-[color:var(--text-primary)]"
              >
                Show All
              </button>
              <button onClick={handleLoad} className="btn btn-green flex-1 sm:flex-none">
                {selectedDate ? "Load Date" : month ? "Load Month" : "Load All"}
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 sm:p-5">
          <p className="text-sm text-green-700">Final Estimated Salary</p>
          <p className="mt-3 text-3xl font-semibold text-[color:var(--text-strong)] sm:text-4xl">
            Rs. {summary?.breakdown?.final?.toLocaleString?.() || 0}
          </p>
          <p className="mt-4 text-sm text-green-700">
            {summary?.scope === "all"
              ? "Showing all salary entries"
              : summary?.scope === "date"
              ? `Date: ${summary?.selectedDate || selectedDate}`
              : `Month: ${summary?.month || month}`}
          </p>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SalaryCard label="Present" value={summary?.breakdown?.present || 0} accent="text-green-300" />
        <SalaryCard label="Double" value={summary?.breakdown?.double || 0} accent="text-blue-300" />
        <SalaryCard label="Half" value={summary?.breakdown?.half || 0} accent="text-yellow-300" />
        <SalaryCard label="Absent" value={summary?.breakdown?.absent || 0} accent="text-red-300" />
      </div>

      {/* Salary Breakdown and Final */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
          <p className="text-sm text-[color:var(--text-secondary)]">Salary Breakdown</p>
          <div className="mt-4 space-y-3">
            <LineItem label="Base Salary" value={`Rs. ${summary?.employee?.salary || 0}`} />
            <LineItem label="Earned" value={`Rs. ${summary?.breakdown?.earned || 0}`} />
            <LineItem label="Bonus" value={`Rs. ${summary?.breakdown?.bonus || 0}`} />
            <LineItem label="Shortage" value={`Rs. ${summary?.breakdown?.shortage || 0}`} />
            <LineItem label="Advance" value={`Rs. ${summary?.breakdown?.advance || 0}`} />
          </div>
        </section>


      </div>

      {/* Attendance Data Table */}
      <section className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Attendance Data</h2>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-secondary)]">
            {summary?.entries?.length || 0} entr{summary?.entries?.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Shortage</th>
                <th>Advance</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.entries || []).map((entry) => (
                <tr key={entry._id}>
                  <td>{new Date(entry.date).toLocaleDateString("en-IN")}</td>
                  <td className="capitalize">{entry.status}</td>
                  <td>Rs. {entry.shortage || 0}</td>
                  <td>Rs. {Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)}</td>
                  <td>{entry.remark || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {(summary?.entries || []).map((entry) => (
            <div key={entry._id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
              <p className="text-base font-semibold text-[color:var(--text-strong)]">
                {new Date(entry.date).toLocaleDateString("en-IN")}
              </p>
              <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Status: {entry.status}</p>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Shortage: Rs. {entry.shortage || 0}</p>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                Advance: Rs. {Number(entry.advanceCash || 0) + Number(entry.advancePetrol || 0)}
              </p>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Remark: {entry.remark || "-"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SalaryCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-4">
      <p className="text-sm text-[color:var(--text-secondary)]">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function LineItem({ label, value }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[color:var(--text-secondary)]">{label}</span>
      <span className="font-medium text-[color:var(--text-strong)]">{value}</span>
    </div>
  );
}
