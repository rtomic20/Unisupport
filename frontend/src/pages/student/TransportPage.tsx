import { useEffect, useState, FormEvent } from "react";
import api from "../../api/axios";
import TimePicker from "../../components/TimePicker";
import { formatDateHR } from "../../utils/date";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  rejected: "Odbijeno",
  completed: "Završeno",
};

const EMPTY_FORM = {
  request_date: "",
  end_time: "",
  pickup_address: "",
  dropoff_address: "",
  description: "",
};

const inputCls =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

export default function TransportPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/requests/", { params: { type: "transport" } })
      .then(({ data }) => setRequests(data.results ?? data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function validateTimes(): boolean {
    if (form.end_time) {
      // end_time is arrival deadline — just validate it's a real time
    }
    return true;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setTimeError("");
    if (!form.request_date || !form.end_time || !form.pickup_address || !form.dropoff_address) {
      setFormError("Datum, dolazak do, polazište i odredište su obavezni.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/requests/", {
        request_type: "transport",
        request_date: form.request_date,
        end_time: form.end_time + ":00",
        description: form.description,
        transport_details: {
          pickup_address: form.pickup_address,
          dropoff_address: form.dropoff_address,
        },
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      const d = err.response?.data;
      setFormError(typeof d === "object" ? JSON.stringify(d) : String(d ?? "Greška."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Prijevoz</h1>
          <p className="text-sm text-gray-500 mt-1">
            Zahtjevi za prijevoz. Vozač preuzima vaš zahtjev i odvozi vas na odredište.
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormError(""); setTimeError(""); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          + Novi zahtjev za prijevoz
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Učitavanje...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Polazište</th>
                  <th className="px-4 py-3">Odredište</th>
                  <th className="px-4 py-3">Dolazak do</th>
                  <th className="px-4 py-3">Vozač</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      Nema zahtjeva za prijevoz.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.request_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{formatDateHR(r.request_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.transport_details?.pickup_address || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.transport_details?.dropoff_address || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.end_time?.slice(0, 5) || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.accepted_by_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Novi zahtjev za prijevoz</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                <input type="date" required value={form.request_date}
                  onChange={(e) => setForm({ ...form, request_date: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trebam biti na odredištu u *</label>
                <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} required />
                {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Polazište *</label>
                <input type="text" required placeholder="npr. Sveučilišna avenija 4, Rijeka"
                  value={form.pickup_address}
                  onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Odredište *</label>
                <input type="text" required placeholder="npr. Kampus Trsat"
                  value={form.dropoff_address}
                  onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Napomena</label>
                <textarea rows={2} placeholder="Dodatne napomene..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls} />
              </div>
              {formError && <p className="text-red-600 text-sm">{formError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Odustani</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {saving ? "Šaljem..." : "Pošalji zahtjev"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
