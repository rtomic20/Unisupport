import { useEffect, useState } from "react";
import api from "../../api/axios";
import AssignDriverModal from "../../components/AssignDriverModal";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: "", status: "", date: "", month: "" });
  const [assigningId, setAssigningId] = useState<number | null>(null);

  function load() {
    const params: Record<string, string> = {};
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.date) params.date = filters.date;
    else if (filters.month) params.month = filters.month;
    api.get("/requests/", { params }).then(({ data }) => setRequests(data.results ?? data));
  }

  useEffect(() => { load(); }, [filters]);

  async function changeStatus(id: number, action: string) {
    await api.post(`/requests/${id}/${action}/`);
    load();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Zahtjevi</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Svi tipovi</option>
          <option value="transport">Prijevoz</option>
          <option value="service">Usluga</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Svi statusi</option>
          <option value="pending">Na čekanju</option>
          <option value="accepted">Prihvaćen</option>
          <option value="rejected">Odbijen</option>
          <option value="completed">Završen</option>
        </select>
        <input type="date" value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value, month: "" })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Filtriraj po danu"
        />
        <input type="month" value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value, date: "" })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => setFilters({ type: "", status: "", date: "", month: "" })}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
          Resetiraj
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Tip</th>
              <th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3">Dolazak do</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vozač</th>
              <th className="px-4 py-3">Akcije</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => (
              <tr key={r.request_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{r.request_id}</td>
                <td className="px-4 py-3 text-gray-700">{r.student_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${r.request_type === "transport" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                    {r.request_type === "transport" ? "Prijevoz" : "Usluga"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{r.request_date}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {r.end_time?.slice(0,5)}
                  {r.start_time && <span className="text-gray-400"> (polazak {r.start_time.slice(0,5)})</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{r.accepted_by_name || "—"}</td>
                <td className="px-4 py-3 flex gap-1 flex-wrap">
                  {r.request_type === "transport" && r.status === "pending" && (
                    <button onClick={() => setAssigningId(r.request_id)}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">
                      Dodijeli
                    </button>
                  )}
                  {r.request_type === "service" && r.status === "pending" && (
                    <button onClick={() => changeStatus(r.request_id, "accept")}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100">
                      Prihvati
                    </button>
                  )}
                  {r.status === "accepted" && (
                    <button onClick={() => changeStatus(r.request_id, "complete")}
                      className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100">
                      Završi
                    </button>
                  )}
                  {r.status === "pending" && (
                    <button onClick={() => changeStatus(r.request_id, "reject")}
                      className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100">
                      Odbij
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Nema zahtjeva</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {assigningId && (
        <AssignDriverModal
          requestId={assigningId}
          onClose={() => setAssigningId(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}
