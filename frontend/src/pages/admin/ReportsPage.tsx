import { useEffect, useState } from "react";
import api from "../../api/axios";

interface DetailRow {
  student_name: string;
  worker_name: string;
  count: number;
  unit: string;
}

interface UserOption {
  user_id: number;
  first_name: string;
  last_name: string;
}

interface Filters {
  from: string;
  to: string;
  student_id: string;
  worker_id: string;
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
              <th className="px-4 py-3 text-right">Izvršeno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Učitavanje...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Nema završenih zahtjeva</td></tr>
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
  const [draftWorkerId, setDraftWorkerId] = useState("");
  const [filters, setFilters] = useState<Filters>({ from: "", to: "", student_id: "", worker_id: "" });

  const [transportRows, setTransportRows] = useState<DetailRow[]>([]);
  const [careRows, setCareRows] = useState<DetailRow[]>([]);
  const [supportRows, setSupportRows] = useState<DetailRow[]>([]);
  const [students, setStudents] = useState<UserOption[]>([]);
  const [drivers, setDrivers] = useState<UserOption[]>([]);
  const [caregivers, setCaregivers] = useState<UserOption[]>([]);
  const [assistants, setAssistants] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/accounts/users/", { params: { role: "student" } }),
      api.get("/accounts/users/", { params: { role: "driver" } }),
      api.get("/accounts/users/", { params: { role: "caregiver" } }),
      api.get("/accounts/users/", { params: { role: "assistant" } }),
    ]).then(([sRes, dRes, cRes, aRes]) => {
      setStudents(sRes.data.results ?? sRes.data);
      setDrivers(dRes.data.results ?? dRes.data);
      setCaregivers(cRes.data.results ?? cRes.data);
      setAssistants(aRes.data.results ?? aRes.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.student_id) params.student_id = filters.student_id;
    if (filters.worker_id) params.worker_id = filters.worker_id;

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
    setFilters({ from: draftFrom, to: draftTo, student_id: draftStudentId, worker_id: draftWorkerId });
  }

  function handleReset() {
    setDraftFrom(""); setDraftTo(""); setDraftStudentId(""); setDraftWorkerId("");
    setFilters({ from: "", to: "", student_id: "", worker_id: "" });
  }

  function handleTabChange(tab: ReportTab) {
    setActiveTab(tab);
    setDraftWorkerId("");
    setFilters((prev) => ({ ...prev, worker_id: "" }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.worker_id) params.worker_id = filters.worker_id;

      const urls: Record<ReportTab, { url: string; filename: string }> = {
        transport: { url: "/reports/export-rides-csv/", filename: "voznje.xlsx" },
        care: { url: "/reports/export-care-csv/", filename: "njega.xlsx" },
        support: { url: "/reports/export-support-csv/", filename: "podrska.xlsx" },
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

  const hasActiveFilters = filters.from || filters.to || filters.student_id || filters.worker_id;

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "transport", label: "Prijevoz" },
    { key: "care", label: "Njega u domu" },
    { key: "support", label: "Vršnjačka podrška" },
  ];

  const workerConfig: Record<ReportTab, { label: string; options: UserOption[] }> = {
    transport: { label: "Vozač", options: drivers },
    care: { label: "Njegovatelj", options: caregivers },
    support: { label: "Asistent", options: assistants },
  };

  const currentWorker = workerConfig[activeTab];

  const inbCls = "border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Izvještaji</h1>
          <p className="text-sm text-gray-500 mt-0.5">Prikazuju se samo završeni zahtjevi.</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? "Izvoz..." : `Izvezi Excel (${tabs.find(t => t.key === activeTab)?.label})`}
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Od datuma</label>
            <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} className={inbCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Do datuma</label>
            <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} className={inbCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Student</label>
            <select value={draftStudentId} onChange={(e) => setDraftStudentId(e.target.value)} className={`${inbCls} bg-white`}>
              <option value="">Svi studenti</option>
              {students.map((s) => (
                <option key={s.user_id} value={String(s.user_id)}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{currentWorker.label}</label>
            <select value={draftWorkerId} onChange={(e) => setDraftWorkerId(e.target.value)} className={`${inbCls} bg-white`}>
              <option value="">Svi</option>
              {currentWorker.options.map((w) => (
                <option key={w.user_id} value={String(w.user_id)}>{w.first_name} {w.last_name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleApply}
            className="px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Primijeni
          </button>
          {hasActiveFilters && (
            <button onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
              Resetiraj
            </button>
          )}
        </div>
      </div>

      {/* Service tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key ? "border-blue-500 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "transport" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Vozač: broj završenih vožnji</p>
          <DetailTable rows={transportRows} loading={loading} workerLabel="Vozač" />
        </div>
      )}
      {activeTab === "care" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Njegovatelj: broj završenih termina</p>
          <DetailTable rows={careRows} loading={loading} workerLabel="Njegovatelj" />
        </div>
      )}
      {activeTab === "support" && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Student → Asistent: odrađeni sati (završeni planovi)</p>
          <DetailTable rows={supportRows} loading={loading} workerLabel="Asistent" />
        </div>
      )}
    </div>
  );
}
