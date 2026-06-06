import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Row {
  user_id: number;
  full_name: string;
  count: number;
}

interface UnifiedStats {
  rides_count: number;
  care_appointments_count: number;
  support_hours_total: number;
}

interface StudentOption {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface Filters {
  from: string;
  to: string;
  student_id: string;
}

function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | null;
  unit?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      {value === null ? (
        <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className={`text-2xl font-bold ${color}`}>
          {value}
          {unit && (
            <span className="text-base font-medium ml-1 text-gray-400">
              {unit}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function RidesTable({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Row[];
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-700">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
            <th className="px-4 py-3">Ime i prezime</th>
            <th className="px-4 py-3 text-right">Vožnje</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                Učitavanje...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                Nema podataka
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{row.full_name}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-700">
                  {row.count}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  // Filter state (draft — what's in the inputs)
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStudentId, setDraftStudentId] = useState("");

  // Applied filters (used for actual fetches)
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    student_id: "",
  });

  // Data state
  const [byUser, setByUser] = useState<Row[]>([]);
  const [byDriver, setByDriver] = useState<Row[]>([]);
  const [unified, setUnified] = useState<UnifiedStats | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);

  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Load students for dropdown once
  useEffect(() => {
    api
      .get("/accounts/users/", { params: { role: "student" } })
      .then(({ data }) => {
        const list: StudentOption[] = data.results ?? data;
        setStudents(list);
      })
      .catch(() => {});
  }, []);

  // Reload data whenever applied filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.student_id) params.student_id = filters.student_id;

    setLoadingTables(true);
    setLoadingStats(true);

    Promise.all([
      api.get("/reports/rides-per-user/", { params }),
      api.get("/reports/rides-per-driver/", { params }),
    ]).then(([u, d]) => {
      setByUser(u.data.results ?? u.data);
      setByDriver(d.data.results ?? d.data);
      setLoadingTables(false);
    });

    api
      .get("/reports/unified/", { params })
      .then(({ data }) => {
        setUnified(data);
      })
      .finally(() => setLoadingStats(false));
  }, [filters]);

  function handleApply() {
    setFilters({
      from: draftFrom,
      to: draftTo,
      student_id: draftStudentId,
    });
  }

  function handleReset() {
    setDraftFrom("");
    setDraftTo("");
    setDraftStudentId("");
    setFilters({ from: "", to: "", student_id: "" });
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.student_id) params.student_id = filters.student_id;

      const response = await api.get("/reports/export-rides-csv/", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "voznje.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail — in production you'd show a toast here
    } finally {
      setExporting(false);
    }
  }

  const hasActiveFilters =
    filters.from || filters.to || filters.student_id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">Izvještaji</h1>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {exporting ? "Izvoz..." : "Izvezi CSV"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Od datuma
            </label>
            <input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Do datuma
            </label>
            <input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Student</label>
            <select
              value={draftStudentId}
              onChange={(e) => setDraftStudentId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Svi studenti</option>
              {students.map((s) => (
                <option key={s.user_id} value={String(s.user_id)}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Primijeni filtere
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              Resetiraj
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.from && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                Od: {filters.from}
              </span>
            )}
            {filters.to && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                Do: {filters.to}
              </span>
            )}
            {filters.student_id && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                Student:{" "}
                {(() => {
                  const s = students.find(
                    (s) => String(s.user_id) === filters.student_id
                  );
                  return s ? `${s.first_name} ${s.last_name}` : filters.student_id;
                })()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Ukupno vožnji"
          value={loadingStats ? null : unified?.rides_count ?? 0}
          color="text-blue-700"
        />
        <StatCard
          label="Termini skrbi"
          value={loadingStats ? null : unified?.care_appointments_count ?? 0}
          color="text-purple-700"
        />
        <StatCard
          label="Sati podrške"
          value={loadingStats ? null : unified?.support_hours_total ?? 0}
          unit="h"
          color="text-green-700"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RidesTable
          title="Broj vožnji po studentu"
          rows={byUser}
          loading={loadingTables}
        />
        <RidesTable
          title="Broj vožnji po vozaču"
          rows={byDriver}
          loading={loadingTables}
        />
      </div>
    </div>
  );
}
