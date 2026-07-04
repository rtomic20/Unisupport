import { useEffect, useState } from "react";
import api from "../../api/axios";
import TimePicker from "../../components/TimePicker";
import { formatDateHR } from "../../utils/date";

function formatTime(t: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

export default function DriverDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [pickupTime, setPickupTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.get("/requests/", { params: { type: "transport", status: "pending" } })
      .then(({ data }) => setRequests(data.results ?? data));
  }

  useEffect(() => { load(); }, []);

  function openAccept(id: number, endTime: string) {
    setAccepting(id);
    setError("");
    // Predloži pickup_time 30 min prije end_time ako je poznat
    if (endTime) {
      const [h, m] = endTime.split(":").map(Number);
      const totalMin = h * 60 + m - 30;
      const ph = Math.max(0, Math.floor(totalMin / 60));
      const pm = ((totalMin % 60) + 60) % 60;
      setPickupTime(`${String(ph).padStart(2, "0")}:${String(pm - (pm % 5)).padStart(2, "0")}`);
    } else {
      setPickupTime("");
    }
  }

  async function confirmAccept() {
    if (!accepting || !pickupTime) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/requests/${accepting}/accept/`, { pickup_time: pickupTime + ":00" });
      setAccepting(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška pri prihvaćanju");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Dostupne vožnje</h1>
      <p className="text-sm text-gray-500 mb-6">Prihvati vožnju i unesi kada ćeš pokupiti studenta.</p>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-gray-500 text-sm">Nema dostupnih vožnji na čekanju.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.request_id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-lg font-medium">
                      Na čekanju
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

                  {r.end_time && (
                    <p className="text-xs text-gray-500">
                      Student treba biti na odredištu u{" "}
                      <span className="font-semibold text-gray-700">{formatTime(r.end_time)}</span>
                    </p>
                  )}

                  {r.description && (
                    <p className="text-xs text-gray-400 italic">"{r.description}"</p>
                  )}
                </div>

                <button
                  onClick={() => openAccept(r.request_id, r.end_time)}
                  className="shrink-0 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Prihvati
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal za unos vremena preuzimanja */}
      {accepting !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Kada ćeš pokupiti studenta?</h2>
              <p className="text-xs text-gray-500 mt-1">Unesi planirano vrijeme preuzimanja.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vrijeme preuzimanja</label>
                <TimePicker
                  value={pickupTime}
                  onChange={setPickupTime}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setAccepting(null)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                >
                  Odustani
                </button>
                <button
                  onClick={confirmAccept}
                  disabled={!pickupTime || saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Prihvaćam..." : "Potvrdi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
