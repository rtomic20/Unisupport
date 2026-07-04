import { useEffect, useState } from "react";
import api from "../../api/axios";
import TimePicker from "../../components/TimePicker";
import { formatDateHR } from "../../utils/date";

function formatTime(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

const STATUS_COLORS: Record<string, string> = {
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  accepted: "Prihvaćeno",
  completed: "Završeno",
};

export default function MyRidesPage() {
  const [rides, setRides] = useState<any[]>([]);
  const [filters, setFilters] = useState({ date: "", month: "" });
  const [editingPickup, setEditingPickup] = useState<number | null>(null);
  const [newPickupTime, setNewPickupTime] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    const params: Record<string, string> = { type: "transport" };
    if (filters.date) params.date = filters.date;
    else if (filters.month) params.month = filters.month;
    api.get("/requests/", { params }).then(({ data }) => {
      const all = data.results ?? data;
      setRides(all.filter((r: any) => ["accepted", "completed"].includes(r.status)));
    });
  }

  useEffect(() => { load(); }, [filters]);

  async function handleComplete(id: number) {
    await api.post(`/requests/${id}/complete/`);
    load();
  }

  async function handleUpdatePickup(id: number) {
    if (!newPickupTime) return;
    setSaving(true);
    try {
      await api.patch(`/requests/${id}/`, { start_time: newPickupTime + ":00" });
      setEditingPickup(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Greška pri izmjeni vremena.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Moje vožnje</h1>

      {/* Filteri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4 flex gap-2 flex-wrap items-center">
        <input type="date" value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value, month: "" })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="month" value={filters.month}
          onChange={(e) => setFilters({ ...filters, month: e.target.value, date: "" })}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {(filters.date || filters.month) && (
          <button onClick={() => setFilters({ date: "", month: "" })}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            Resetiraj
          </button>
        )}
      </div>

      {rides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">🗓️</div>
          <p className="text-gray-500 text-sm">Nema vožnji u odabranom periodu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r) => (
            <div key={r.request_id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs text-gray-400">#{r.request_id}</span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">{r.student_name}</p>
                    <p className="text-sm text-gray-500">{formatDateHR(r.request_date)}</p>
                  </div>

                  {r.transport_details && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">📍</span>
                        <span className="text-gray-600">{r.transport_details.pickup_address}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-red-400 mt-0.5">🏁</span>
                        <span className="text-gray-600">{r.transport_details.dropoff_address}</span>
                      </div>
                    </div>
                  )}

                  {/* Vremena */}
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <span>
                      Preuzimanje:{" "}
                      <span className="font-semibold text-gray-700">{formatTime(r.start_time)}</span>
                    </span>
                    <span>
                      Dolazak do:{" "}
                      <span className="font-semibold text-gray-700">{formatTime(r.end_time)}</span>
                    </span>
                  </div>

                  {/* Edit pickup time za accepted */}
                  {r.status === "accepted" && editingPickup === r.request_id && (
                    <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-medium text-blue-700">Izmjena vremena preuzimanja</p>
                      <TimePicker
                        value={newPickupTime}
                        onChange={setNewPickupTime}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPickup(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
                          Odustani
                        </button>
                        <button onClick={() => handleUpdatePickup(r.request_id)}
                          disabled={!newPickupTime || saving}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          Spremi
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {r.status === "accepted" && (
                    <>
                      <button onClick={() => handleComplete(r.request_id)}
                        className="px-3 py-2 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap">
                        Završi
                      </button>
                      <button
                        onClick={() => {
                          setEditingPickup(r.request_id);
                          setNewPickupTime(r.start_time ? r.start_time.slice(0, 5) : "");
                        }}
                        className="px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors whitespace-nowrap">
                        Izmijeni sat
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
