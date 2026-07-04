import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatDateHR } from "../../utils/date";

interface Appointment {
  appointment_id: number;
  student_name: string;
  caregiver_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  assigned: "Dodijeljeno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

function formatTime(t: string | null): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

const EMPTY_FORM = {
  appointment_date: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get<Appointment[] | { results: Appointment[] }>("/home-care/appointments/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: Appointment[] }).results ?? [];
        setAppointments(data);
      })
      .catch(() => setError("Greška pri učitavanju termina."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!form.appointment_date || !form.start_time || !form.end_time) {
      setFormError("Datum i vrijeme su obavezni.");
      return;
    }
    setFormSaving(true);
    try {
      await api.post("/home-care/appointments/", {
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location,
        description: form.description,
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      setFormError(JSON.stringify(err.response?.data ?? "Greška pri kreiranju."));
    } finally {
      setFormSaving(false);
    }
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Moji termini njege</h1>
          <p className="text-sm text-gray-500 mt-1">Pregled i zahtjev za termine kućne njege.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Zatraži termin
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="flex justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Nemate evidentiranih termina njege.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Vrijeme</th>
                  <th className="px-4 py-3">Lokacija</th>
                  <th className="px-4 py-3">Njegovatelj/ica</th>
                  <th className="px-4 py-3">Opis</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      {formatDateHR(appt.appointment_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{appt.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {appt.caregiver_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      {appt.description ? (
                        <span className="italic text-xs">{appt.description}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                          STATUS_COLORS[appt.status] ??
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create appointment modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Zatraži termin njege</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Početak</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kraj</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lokacija</label>
                <input
                  type="text"
                  placeholder="npr. Dom studenta, soba 204"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Opis (opcionalno)</label>
                <textarea
                  rows={3}
                  placeholder="Što vam treba..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              {formError && (
                <p role="alert" className="text-red-600 text-sm">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Odustani
                </button>
                <button
                  onClick={handleCreate}
                  disabled={formSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSaving ? "Sprema..." : "Pošalji zahtjev"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
