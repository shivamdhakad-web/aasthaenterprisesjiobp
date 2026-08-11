import { useEffect, useMemo, useState } from "react";
import { getSalarySummary } from "../../services/salaryApi";
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Filter,
    Search,
    TrendingDown,
    TrendingUp,
    Users,
    Clock,
    UserMinus,
    UserPlus,
    Wallet,
    AlertCircle,
    Gift,
    IndianRupee,
    RefreshCw,
    X,
} from "lucide-react";

const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });

const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getTime = (value) => {
    const time = new Date(value || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
};

const getEntryBonus = (entry) =>
    Number(entry?.bonusAmount ?? entry?.bonus ?? entry?.payment ?? entry?.amount ?? 0);

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getPreviousMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
};

const metricConfigs = {
    present: {
        icon: UserPlus,
        tone: "green",
        label: "Present",
        gradient: "from-emerald-500 to-teal-400",
    },
    presentHalf: {
        icon: Clock,
        tone: "cyan",
        label: "Present + Half",
        gradient: "from-teal-500 to-cyan-400",
    },
    half: {
        icon: Clock,
        tone: "amber",
        label: "Half Shift",
        gradient: "from-amber-500 to-orange-400",
    },
    absent: {
        icon: UserMinus,
        tone: "rose",
        label: "Absent",
        gradient: "from-rose-500 to-pink-400",
    },
    double: {
        icon: Users,
        tone: "cyan",
        label: "Double Shift",
        gradient: "from-cyan-500 to-blue-400",
    },
    earned: {
        icon: TrendingUp,
        tone: "green",
        label: "Earned",
        gradient: "from-emerald-500 to-teal-400",
    },
    shortage: {
        icon: TrendingDown,
        tone: "rose",
        label: "Shortage",
        gradient: "from-rose-500 to-pink-400",
    },
    advance: {
        icon: Wallet,
        tone: "amber",
        label: "Advance",
        gradient: "from-amber-500 to-orange-400",
    },
    bonus: {
        icon: Gift,
        tone: "violet",
        label: "Bonus",
        gradient: "from-violet-500 to-purple-400",
    },
    finalBalance: {
        icon: IndianRupee,
        tone: "blue",
        label: "Final Balance",
        gradient: "from-blue-500 to-indigo-400",
    },
};

const metricTextColors = {
  green: { label: "#166534", value: "#064e3b" },
  amber: { label: "#92400e", value: "#78350f" },
  rose: { label: "#9f1239", value: "#881337" },
  cyan: { label: "#155e75", value: "#164e63" },
  violet: { label: "#6d28d9", value: "#4c1d95" },
  blue: { label: "#1d4ed8", value: "#1e3a8a" },
};

const toneClasses = {
  green:
    "border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10",
  amber:
    "border-amber-200/60 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10",
  rose:
    "border-rose-200/60 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/10",
  cyan:
    "border-cyan-200/60 bg-cyan-50/70 dark:border-cyan-500/20 dark:bg-cyan-500/10",
  violet:
    "border-violet-200/60 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10",
  blue:
    "border-blue-200/60 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10",
};

const iconToneClasses = {
  green: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  rose: "text-rose-700 dark:text-rose-300",
  cyan: "text-cyan-700 dark:text-cyan-300",
  violet: "text-violet-700 dark:text-violet-300",
  blue: "text-blue-700 dark:text-blue-300",
};

function SalaryMetric({ label, value, tone = "green", icon: Icon, className = "" }) {
  const textColors = metricTextColors[tone] || {
    label: "#334155",
    value: "#0f172a",
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${toneClasses[tone]} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      <div className="relative flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: textColors.label }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-2xl font-black leading-tight tracking-tight"
            style={{ color: textColors.value }}
          >
            {value}
          </p>
        </div>

        {Icon && (
          <div className={`rounded-xl bg-current/10 p-2.5 ${iconToneClasses[tone]}`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
      </div>
    </div>
  );
}

function SalaryEntryCard({ entry }) {
    const shortage = Number(entry.shortage || 0);
    const status = entry.status || "entry";
    const normalized = status.toLowerCase();
    const statusConfig = {
        absent: { tone: "rose", label: "Absent" },
        bonus: { tone: "violet", label: "Bonus" },
        present_half: { tone: "cyan", label: "Present + Half" },
        half: { tone: "amber", label: "Half" },
        present: { tone: "emerald", label: "Present" },
        double: { tone: "cyan", label: "Double" },
    };
    const config = statusConfig[normalized] || { tone: "emerald", label: status };

    return (
        <div className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 transition-all duration-200 hover:border-current/20 hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span
                            className={`inline-flex h-2 w-2 rounded-full bg-${config.tone}-500`}
                        />
                        <p className="text-sm font-medium text-[color:var(--text-secondary)]">
                            {formatDate(entry.date)}
                        </p>
                    </div>
                    <p
                        className={`mt-2 text-lg font-bold capitalize text-${config.tone}-500`}
                    >
                        {config.label}
                    </p>
                </div>
                <div
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-lg font-black ${
                        shortage < 0
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                    }`}
                >
                    <IndianRupee size={16} strokeWidth={2.5} />
                    {formatCurrency(shortage)}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border-color)] pt-4 text-sm">
                <span className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
                    <span className="font-medium">Cash:</span>
                    <span className="font-semibold">?{formatCurrency(entry.advanceCash)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
                    <span className="font-medium">Petrol:</span>
                    <span className="font-semibold">?{formatCurrency(entry.advancePetrol)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[color:var(--text-secondary)]">
                    <span className="font-medium">Bonus:</span>
                    <span className="font-semibold">?{formatCurrency(getEntryBonus(entry))}</span>
                </span>
                {entry.remark && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[var(--bg-soft)] px-3 py-1 text-xs text-[color:var(--text-muted)]">
                        <AlertCircle size={12} />
                        {entry.remark}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function EmployeeSalary() {
    const [summary, setSummary] = useState(null);
    const [allSummary, setAllSummary] = useState(null);
    const [lastMonthSummary, setLastMonthSummary] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
    const [loading, setLoading] = useState(false);

    const load = async ({ targetDate = dateFilter, targetMonth = monthFilter } = {}) => {
        setLoading(true);
        try {
            const params = targetDate
                ? { date: targetDate }
                : targetMonth
                    ? { month: targetMonth }
                    : { scope: "all" };
            const data = await getSalarySummary(null, params);
            setSummary(data);
        } finally {
            setLoading(false);
        }
    };

    const loadSideSummaries = async () => {
        const [allData, lastMonthData] = await Promise.all([
            getSalarySummary(null, { scope: "all" }),
            getSalarySummary(null, { month: getPreviousMonth() }),
        ]);
        setAllSummary(allData);
        setLastMonthSummary(lastMonthData);
    };

    useEffect(() => {
        load({ targetDate: "", targetMonth: getCurrentMonth() });
        loadSideSummaries();
    }, []);

    const entries = useMemo(
        () =>
            [...(summary?.entries || [])].sort(
                (a, b) => getTime(b.date) - getTime(a.date),
            ),
        [summary?.entries],
    );

    const breakdown = summary?.breakdown || {};
    const allBreakdown = allSummary?.breakdown || {};
    const lastMonthBreakdown = lastMonthSummary?.breakdown || {};
    const finalBalance = Number(allBreakdown.final ?? breakdown.final ?? 0);
    const lastMonthAdvance = Number(lastMonthBreakdown.advance ?? 0);

    const handleDateSearch = () => {
        setMonthFilter("");
        load({ targetDate: dateFilter, targetMonth: "" });
    };

    const handleMonthSearch = () => {
        setDateFilter("");
        load({ targetDate: "", targetMonth: monthFilter });
    };

    const handleAllEntries = () => {
        setDateFilter("");
        setMonthFilter("");
        load({ targetDate: "", targetMonth: "" });
        loadSideSummaries();
    };

    const clearFilters = () => {
        setDateFilter("");
        setMonthFilter("");
        handleAllEntries();
    };

    return (
        <div className="mx-auto w-full max-w-[1500px] space-y-6 px-4 pb-12 text-[color:var(--text-primary)] sm:px-6 lg:px-8">
            {/* ====== FIXED “My Salary” CARD ====== */}
<section className="relative mt-2 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-7 shadow-[0_18px_45px_rgba(16,185,129,0.10)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)]" />
    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
    <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

    <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                Salary Overview
            </div>

            <h1 className="mt-4 flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-emerald-800 via-teal-700 to-blue-700 bg-clip-text text-transparent">
                    My Salary
                </span>

                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                    Live
                </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm font-medium text-slate-600 sm:text-base">
            </p>
        </div>

<button
    type="button"
    onClick={() => setShowFilters((v) => !v)}
    className="inline-flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
>
    <div className="flex items-center gap-2">
        <Filter size={18} strokeWidth={2} />
        <span>{showFilters ? "Hide Filters" : "Filter Salary"}</span>
    </div>

    {showFilters ? (
        <ChevronUp size={16} strokeWidth={2.5} />
    ) : (
        <ChevronDown size={16} strokeWidth={2.5} />
    )}
</button>
    </div>

    {showFilters && (
        <div className="relative mt-6 animate-in slide-in-from-top-4 duration-300">
            <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm backdrop-blur sm:grid-cols-[1fr_1fr_auto_auto_auto]">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                        <Calendar size={18} className="text-slate-400" />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                        placeholder="Pick a date"
                    />
                </div>

                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                        <Calendar size={18} className="text-slate-400" />
                    </div>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                        placeholder="Pick a month"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleDateSearch}
                    disabled={loading || !dateFilter}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                    <Search size={18} strokeWidth={2} />
                    {loading ? "Searching..." : "By Date"}
                </button>

                <button
                    type="button"
                    onClick={handleMonthSearch}
                    disabled={loading || !monthFilter}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:hover:bg-emerald-600"
                >
                    <Search size={18} strokeWidth={2} />
                    {loading ? "Searching..." : "By Month"}
                </button>

                <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold text-slate-700 transition hover:bg-white"
                >
                    <RefreshCw size={18} strokeWidth={2} />
                    Reset
                </button>
            </div>

            {(dateFilter || monthFilter) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">Active filters:</span>

                    {dateFilter && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                            <Calendar size={12} />
                            {formatDate(dateFilter)}
                            <button
                                onClick={() => {
                                    setDateFilter("");
                                    handleAllEntries();
                                }}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200/50"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    )}

                    {monthFilter && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                            <Calendar size={12} />
                            {new Date(monthFilter).toLocaleDateString("en-IN", {
                                month: "long",
                                year: "numeric",
                            })}
                            <button
                                onClick={() => {
                                    setMonthFilter("");
                                    handleAllEntries();
                                }}
                                className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200/50"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    )}


    <div className=" mt-3">
                <SalaryMetric
                    label="Final Balance"
                    value={`?${formatCurrency(finalBalance)}`}
                    tone="blue"
                    icon={metricConfigs.finalBalance.icon}
                />
    </div>
</section>

            {/* ====== METRIC CARDS – darker text ====== */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
                <SalaryMetric
                    label="Present"
                    value={breakdown.present || 0}
                    tone="green"
                    icon={metricConfigs.present.icon}
                />                <SalaryMetric
                    label="Present + Half"
                    value={breakdown.presentHalf || 0}
                    tone="cyan"
                    icon={metricConfigs.presentHalf.icon}
                />

                <SalaryMetric
                    label="Half"
                    value={breakdown.half || 0}
                    tone="amber"
                    icon={metricConfigs.half.icon}
                />
                <SalaryMetric
                    label="Absent"
                    value={breakdown.absent || 0}
                    tone="rose"
                    icon={metricConfigs.absent.icon}
                />
                <SalaryMetric
                    label="Double"
                    value={breakdown.double || 0}
                    tone="cyan"
                    icon={metricConfigs.double.icon}
                />
                <SalaryMetric
                    label="Earned"
                    value={`?${formatCurrency(breakdown.earned)}`}
                    tone="green"
                    icon={metricConfigs.earned.icon}
                />
                <SalaryMetric
                    label="Shortage"
                    value={`?${formatCurrency(breakdown.shortage)}`}
                    tone="rose"
                    icon={metricConfigs.shortage.icon}
                />
                <SalaryMetric
                    label="Advance"
                    value={`?${formatCurrency(breakdown.advance)}`}
                    tone="amber"
                    icon={metricConfigs.advance.icon}
                />
                <SalaryMetric
                    label="Last Month Advance"
                    value={`?${formatCurrency(lastMonthAdvance)}`}
                    tone="amber"
                    icon={metricConfigs.advance.icon}
                />
                <SalaryMetric
                    label="Bonus"
                    value={`?${formatCurrency(breakdown.bonus)}`}
                    tone="violet"
                    icon={metricConfigs.bonus.icon}
                />

            </section>

            {/* ====== ENTRIES TABLE ====== */}
            <section className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] px-6 py-4">
                    <h2 className="text-xl font-semibold text-[color:var(--text-strong)]">
                        Attendance Records
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--bg-soft)] px-4 py-1.5 text-sm font-medium text-[color:var(--text-secondary)]">
                            {entries.length} {entries.length === 1 ? "entry" : "entries"}
                        </span>
                        {loading && (
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        )}
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-3 px-2 pb-2 pt-2 md:hidden">
                    {entries.length ? (
                        entries.map((entry) => (
                            <SalaryEntryCard
                                key={entry._id || `${entry.date}-${entry.status}-${entry.remark}`}
                                entry={entry}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] py-12 text-center">
                            <div className="rounded-full bg-[var(--bg-soft)] p-4">
                                <Calendar size={32} className="text-[color:var(--text-muted)]" />
                            </div>
                            <p className="mt-4 text-lg font-medium text-[color:var(--text-secondary)]">
                                No entries found
                            </p>
                            <p className="text-sm text-[color:var(--text-muted)]">
                                Try adjusting your filters or check back later.
                            </p>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-soft)] text-xs uppercase tracking-wider text-[color:var(--text-secondary)]">
                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                <th className="px-6 py-4 text-left font-semibold">Status</th>
                                <th className="px-6 py-4 text-right font-semibold">Shortage</th>
                                <th className="px-6 py-4 text-right font-semibold">Cash</th>
                                <th className="px-6 py-4 text-right font-semibold">Petrol</th>
                                <th className="px-6 py-4 text-right font-semibold">Bonus</th>
                                <th className="px-6 py-4 text-left font-semibold">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => {
                                const shortage = Number(entry.shortage || 0);
                                return (
                                    <tr
                                        key={entry._id || `${entry.date}-${entry.status}-${entry.remark}`}
                                        className={`border-b border-[var(--border-color)] transition-colors hover:bg-[var(--bg-soft)]/50 ${
                                            idx % 2 === 0 ? "bg-[var(--bg-card)]" : "bg-[var(--bg-soft)]/30"
                                        }`}
                                    >
                                        <td className="px-6 py-4 font-medium text-[color:var(--text-secondary)]">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                                    entry.status?.toLowerCase() === "absent"
                                                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                                        : entry.status?.toLowerCase() === "bonus"
                                                            ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                                                            : entry.status?.toLowerCase() === "present_half"
                                                                ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
                                                                : entry.status?.toLowerCase() === "half"
                                                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                                                : entry.status?.toLowerCase() === "double"
                                                                    ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
                                                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                }`}
                                            >
                                                {entry.status || "present"}
                                            </span>
                                        </td>
                                        <td
                                            className={`px-6 py-4 text-right font-semibold ${
                                                shortage < 0 ? "text-rose-500" : "text-emerald-500"
                                            }`}
                                        >
                                            ?{formatCurrency(shortage)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-[color:var(--text-secondary)]">
                                            ?{formatCurrency(entry.advanceCash)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-[color:var(--text-secondary)]">
                                            ?{formatCurrency(entry.advancePetrol)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-[color:var(--text-secondary)]">
                                            ?{formatCurrency(getEntryBonus(entry))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[color:var(--text-muted)]">
                                            {entry.remark || "-"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {entries.length === 0 && (
                    <div className="hidden flex-col items-center justify-center py-16 text-center md:flex">
                        <div className="rounded-full bg-[var(--bg-soft)] p-4">
                            <Calendar size={36} className="text-[color:var(--text-muted)]" />
                        </div>
                        <p className="mt-4 text-lg font-medium text-[color:var(--text-secondary)]">
                            No attendance records found
                        </p>
                        <p className="text-sm text-[color:var(--text-muted)]">
                            Try adjusting your filters or check back later.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}







