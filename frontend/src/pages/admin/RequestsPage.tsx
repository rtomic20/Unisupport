import { useEffect, useState } from "react";
import api from "../../api/axios";
import AssignDriverModal from "../../components/AssignDriverModal";
import AssignAssistantModal from "../../components/AssignAssistantModal";
import { formatDateHR } from "../../utils/date";
import AdminTransportPage from "./AdminTransportPage";
import HomeCareAdminPage from "./HomeCareAdminPage";
import PeerSupportAdminPage from "./PeerSupportAdminPage";

type SubTab = "all" | "transport" | "care" | "support";
type ServiceType = "transport" | "care" | "support" | "";
type SortField = "date" | "student" | "type" | "status";
type SortDir = "asc" | "desc";

interface UnifiedItem {
  key: string;
  id: number;
  type: "transport" | "care" | "support";
  student_name: string;
  worker_name: string;
  date: string;
  status: string;
  raw: any;
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  transport: { label: "Prijevoz", cls: "bg-purple-100 text-purple-700" },
  care: { label: "Njega u domu", cls: "bg-teal-100 text-teal-700" },
  support: { label: "Vršnjačka podrška", cls: "bg-blue-100 text-blue-700" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  assigned: "Dodijeljeno",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
  rejected: "Odbijeno",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  assigned: "bg-teal-100 text-teal-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

export default function RequestsPage() {
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [allItems, setAllItems] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ServiceType>("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assigningAssistantId, setAssigningAssistantId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      api.get("/requests/", { params: { type: "transport" } }),
      api.get("/home-care/appointments/"),
      api.get("/peer-support/plans/"),
    ]).then(([tRes, cRes, sRes]) => {
      const transport: UnifiedItem[] = (tRes.data.results ?? tRes.data)
        .filter((r: any) => r.request_type === "transport")
        .map((r: any) => ({
          key: `t-${r.request_id}`,
          id: r.request_id,
          type: "transport" as const,
          student_name: r.student_name,
          worker_name: r.accepted_by_name || "—",
          date: r.request_date,
          status: r.status,
          raw: r,
        }));
      const care: UnifiedItem[] = (cRes.data.results ?? cRes.data).map((a: any) => ({
        key: `c-${a.appointment_id}`,
        id: a.appointment_id,
        type: "care" as const,
        student_name: a.student_name,
        worker_name: a.caregiver_name || "—",
        date: a.appointment_date,
        status: a.status,
        raw: a,
      }));
      const support: UnifiedItem[] = (sRes.data.results ?? sRes.data).map((p: any) => ({
        key: `s-${p.plan_id}`,
        id: p.plan_id,
        type: "support" as const,
        student_name: p.student_name,
        worker_name: p.assistant_name || "—",
        date: p.start_date,
        status: p.status,
        raw: p,
      }));
      setAllItems([...transport, ...care, ...support]);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function changeTransportStatus(id: number, action: string) {
    await api.post(`/requests/${id}/${action}/`);
    load();
  }

  async function changeCareStatus(id: number, status: string) {
    await api.patch(`/home-care/appointments/${id}/`, { status });
    load();
  }

  async function changeSupportStatus(id: number, action: string) {
    await api.post(`/peer-support/plans/${id}/${action}/`);
    load();
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const STATUS_ORDER: Record<string, number> = { pending: 0, assigned: 1, accepted: 1, active: 1, completed: 2, cancelled: 2, rejected: 2 };

  const filtered = allItems
    .filter((i) => !filterType || i.type === filterType)
    .filter((i) => !filterStatus || i.status === filterStatus)
    .filter((i) => !filterDate || i.date === filterDate)
    .sort((a, b) => {
      // Primary: pending first
      const sc = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (sc !== 0) return sc;
      // Secondary: user's chosen sort
      let cmp = 0;
      if (sortField === "date") cmp = a.date.localeCompare(b.date);
      else if (sortField === "student") cmp = a.student_name.localeCompare(b.student_name);
      else if (sortField === "type") cmp = a.type.localeCompare(b.type);
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const subTabs: { key: SubTab; label: string }[] = [
    { key: "all", label: "Svi zahtjevi" },
    { key: "transport", label: "Prijevoz" },
    { key: "care", label: "Njega u domu" },
    { key: "support", label: "Vršnjačka podrška" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Zahtjevi</h1>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              subTab === t.key
                ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "transport" && <AdminTransportPage />}
      {subTab === "care" && <HomeCareAdminPage />}
      {subTab === "support" && <PeerSupportAdminPage />}

      {subTab === "all" && (<>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tip usluge</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as ServiceType)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Svi tipovi</option>
            <option value="transport">Prijevoz</option>
            <option value="care">Njega u domu</option>
            <option value="support">Vršnjačka podrška</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Svi statusi</option>
            <option value="pending">Na čekanju</option>
            <option value="accepted">Prihvaćeno</option>
            <option value="assigned">Dodijeljeno</option>
            <option value="active">Aktivno</option>
            <option value="completed">Završeno</option>
            <option value="cancelled">Otkazano</option>
            <option value="rejected">Odbijeno</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Datum</label>
          <input type="date" value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => { setFilterType(""); setFilterStatus(""); setFilterDate(""); }}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200">
          Resetiraj
        </button>
        <span className="text-xs text-gray-400 ml-auto self-center">{filtered.length} zahtjeva</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-8 text-center text-gray-400 text-sm">Učitavanje...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase select-none">
                <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("type")}>
                  Tip <SortIcon field="type" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("student")}>
                  Student <SortIcon field="student" />
                </th>
                <th className="px-4 py-3">Djelatnik</th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("date")}>
                  Datum <SortIcon field="date" />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort("status")}>
                  Status <SortIcon field="status" />
                </th>
                <th className="px-4 py-3">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => {
                const tb = TYPE_BADGE[item.type];
                return (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${tb.cls}`}>{tb.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.worker_name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateHR(item.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {item.type === "transport" && item.status === "pending" && (
                          <button onClick={() => setAssigningId(item.id)}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">
                            Dodijeli vozača
                          </button>
                        )}
                        {item.type === "transport" && item.status === "accepted" && (
                          <button onClick={() => changeTransportStatus(item.id, "complete")}
                            className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">
                            Završi
                          </button>
                        )}
                        {item.type === "transport" && item.status === "pending" && (
                          <button onClick={() => changeTransportStatus(item.id, "reject")}
                            className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">
                            Odbij
                          </button>
                        )}
                        {item.type === "care" && item.status === "pending" && (
                          <button onClick={() => changeCareStatus(item.id, "assigned")}
                            className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded hover:bg-teal-100">
                            Potvrdi
                          </button>
                        )}
                        {item.type === "care" && (item.status === "pending" || item.status === "assigned") && (
                          <button onClick={() => changeCareStatus(item.id, "cancelled")}
                            className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">
                            Otkaži
                          </button>
                        )}
                        {item.type === "support" && item.status === "pending" && (
                          <button onClick={() => changeSupportStatus(item.id, "confirm")}
                            className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded hover:bg-teal-100">
                            Potvrdi
                          </button>
                        )}
                        {item.type === "support" && item.status === "pending" && (
                          <button onClick={() => changeSupportStatus(item.id, "reject")}
                            className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">
                            Odbij
                          </button>
                        )}
                        {item.type === "support" && item.status === "active" && (
                          <button onClick={() => changeSupportStatus(item.id, "complete")}
                            className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">
                            Završi
                          </button>
                        )}
                        {item.type === "support" && item.status === "pending" && (
                          <button onClick={() => setAssigningAssistantId(item.id)}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">
                            Dodijeli asistenta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nema zahtjeva</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </>)}

      {assigningId && (
        <AssignDriverModal
          requestId={assigningId}
          onClose={() => setAssigningId(null)}
          onAssigned={load}
        />
      )}

      {assigningAssistantId && (
        <AssignAssistantModal
          planId={assigningAssistantId}
          onClose={() => setAssigningAssistantId(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}
