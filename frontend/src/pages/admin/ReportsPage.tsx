import { useEffect, useState } from "react";
import api from "../../api/axios";

interface DetailRow {
  student_name: string;
  worker_name: string;
  count: number;
  unit: string;
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

type ReportTab = "transport" | "care" | "support";

function DetailTable({ rows, loading, workerLabel }: { rows: DetailRow[]; loading: boolean; workerLabel: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">{workerLabel}</th>
              <th className="px-4 py-3 text-right">Količina</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Učitavanje...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Nema podataka</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">{row.student_name}</td>
                  <td className="px-4 py-3 text-gray-700">{row.worker_name}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-700">{row.count} {row.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("transport");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStudentId, setDraftStudentId] = useState("");
  const [filters, setFilters] = useState<Filters>({ from: "", to: "", student_id: "" });

  const [transportRows, setTransportRows] = useState<DetailRow[]>([]);
  const [careRows, setCareRows] = useState<DetailRow[]>([]);
  const [supportRows, setSupportRows] = useState<DetailRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get("/accounts/users/", { params: { role: "student" } })
      .then(({ data }) => setStudents(data.results ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.student_id) params.student_id = filters.student_id;

    setLoading(true);
    Promise.all([
      api.get("/reports/transport-detail/", { params }),
      api.get("/reports/care-detail/", { params }),
      api.get("/reports/support-detail/", { params }),
    ]).then(([t, c, s]) => {
      setTransportRows(t.data.results ?? t.data);
      setCareRows(c.data.results ?? c.data);
      setSupportRows(s.data.results ?? s.data);
    }).finally(() => setLoading(false));
  }, [filters]);

  function handleApply() {
    setFilters({ from: draftFrom, to: draftTo, student_id: draftStudentId });
  }

  function handleReset() {
    setDraftFrom(""); setDraftTo(""); setDraftStudentId("");
    setFilters({ from: "", to: "", student_id: "" });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.student_id) params.student_id = filters.student_id;

      const urls: Record<ReportTab, { url: string; filename: string }> = {
        transport: { url: "/reports/export-rides-csv/", filename: "voznje.csv" },
        care: { url: "/reports/export-care-csv/", filename: "njega.csv" },
        support: { url: "/reports/export-support-csv/", filename: "podrska.csv" },
      };
      const { url, filename } = urls[activeTab];
      const response = await api.get(url, { params, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }

  const hasActiveFilters = filters.from || filters.to || filters.student_id;

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "transport", label: "Prijevoz" },
    { key: "care", label: "Njega u domu" },
    { key: "support", label: "Vršnjačka podrška" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-800">Izvještaji</h1>
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Izvoz..." : `Izvezi CSV (${tabs.find(t => t.key === activeTab)?.label})`}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Od datuma</label>
            <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Do datuma</label>
            <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Student</label>
            <select value={draftStudentId} onChange={(e) => setDraftStudentId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Svi studenti</option>
              {students.map((s) => (
                <option key={s.user_id} value={String(s.user_id)}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleApply}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Primijeni filtere
          </button>
          {hasActiveFilters && (
            <button onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
              Resetiraj
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.from && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">Od: {filters.from}</span>}
            {filters.to && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">Do: {filters.to}</span>}
            {filters.student_id && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                Student: {(() => { const s = students.find(s => String(s.user_id) === filters.student_id); return s ? `${s.first_name} ${s.last_name}` : filters.student_id; })()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Service tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key ? "border-blue-500 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "transport" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Vozač: broj vožnji</p>
          <DetailTable rows={transportRows} loading={loading} workerLabel="Vozač" />
        </div>
      )}
      {activeTab === "care" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Njegovatelj: broj termina</p>
          <DetailTable rows={careRows} loading={loading} workerLabel="Njegovatelj" />
        </div>
      )}
      {activeTab === "support" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Asistent: odrađeni sati podrške</p>
          <DetailTable rows={supportRows} loading={loading} workerLabel="Asistent" />
        </div>
      )}
    </div>
  );
}
