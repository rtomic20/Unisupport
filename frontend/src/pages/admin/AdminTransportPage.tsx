import { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDateHR } from "../../utils/date";

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Request {
  request_id: number;
  student_name: string;
  request_date: string;
  start_time: string | null;
  end_time: string;
  status: string;
  accepted_by_name: string | null;
  transport_details?: { pickup_address: string; dropoff_address: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  rejected: "Odbijeno",
  completed: "Završeno",
};

const EMPTY_FORM = {
  student_id: "",
  request_date: "",
  end_time: "",
  pickup_address: "",
  dropoff_address: "",
  description: "",
};

export default function AdminTransportPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/requests/?type=transport"),
      api.get("/accounts/users/?role=student"),
    ])
      .then(([reqRes, studRes]) => {
        setRequests(reqRes.data.results ?? reqRes.data);
        setStudents(studRes.data.results ?? studRes.data);
      })
      .catch(() => setError("Greška pri učitavanju podataka."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM, student_id: students[0]?.user_id?.toString() ?? "" });
    setFormError("");
    setShowForm(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!form.student_id || !form.request_date || !form.end_time || !form.pickup_address || !form.dropoff_address) {
      setFormError("Student, datum, dolazak do, polazište i odredište su obavezni.");
      return;
    }
    setFormSaving(true);
    try {
      await api.post("/requests/", {
        student: Number(form.student_id),
        request_type: "transport",
        request_date: form.request_date,
        end_time: form.end_time,
        description: form.description,
        transport_details: {
          pickup_address: form.pickup_address,
          dropoff_address: form.dropoff_address,
        },
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      setFormError(JSON.stringify(err.response?.data ?? "Greška pri kreiranju."));
    } finally {
      setFormSaving(false);
    }
  }

  async function changeStatus(id: number, action: string) {
    try {
      await api.post(`/requests/${id}/${action}/`);
      load();
    } catch {
      alert("Greška pri promjeni statusa.");
    }
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Prijevoz</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Nova vožnja
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Učitavanje...</p>}
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Polazište</th>
                <th className="px-4 py-3">Odredište</th>
                <th className="px-4 py-3">Dolazak do</th>
                <th className="px-4 py-3">Vozač</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((r) => (
                <tr key={r.request_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{r.request_id}</td>
                  <td className="px-4 py-3 text-gray-700">{r.student_name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateHR(r.request_date)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.transport_details?.pickup_address || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.transport_details?.dropoff_address || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.end_time?.slice(0, 5)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{r.accepted_by_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.status === "accepted" && (
                        <button
                          onClick={() => changeStatus(r.request_id, "complete")}
                          className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100"
                        >
                          Završi
                        </button>
                      )}
                      {r.status === "pending" && (
                        <button
                          onClick={() => changeStatus(r.request_id, "reject")}
                          className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100"
                        >
                          Odbij
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    Nema vožnji
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Nova vožnja</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className={inputCls}>
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
                <input type="date" value={form.request_date} onChange={(e) => setForm({ ...form, request_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dolazak do (sat)</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Polazište</label>
                <input type="text" placeholder="npr. Dom studenta" value={form.pickup_address} onChange={(e) => setForm({ ...form, pickup_address: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Odredište</label>
                <input type="text" placeholder="npr. Sveučilišna knjižnica" value={form.dropoff_address} onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Napomena (opcionalno)</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
              </div>
              {formError && <p role="alert" className="text-red-600 text-sm">{formError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Odustani</button>
                <button onClick={handleCreate} disabled={formSaving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {formSaving ? "Spremanje..." : "Spremi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
