import { useState, useEffect } from "react";
import api from "../../api/axios";
import { formatDateHR } from "../../utils/date";

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Appointment {
  appointment_id: number;
  student_name: string;
  caregiver_name: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  assigned: "Dodijeljeno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const EMPTY_FORM = {
  student_id: "",
  caregiver_id: "",
  appointment_date: "",
  start_time: "",
  end_time: "",
  location: "",
  description: "",
};

export default function HomeCareAdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [caregivers, setCaregivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [assignModal, setAssignModal] = useState<Appointment | null>(null);
  const [assignCaregiverId, setAssignCaregiverId] = useState("");
  const [assignError, setAssignError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/home-care/appointments/"),
      api.get("/accounts/users/?role=student"),
      api.get("/accounts/users/?role=caregiver"),
    ])
      .then(([apptRes, studRes, careRes]) => {
        setAppointments(apptRes.data.results ?? apptRes.data);
        setStudents(studRes.data.results ?? studRes.data);
        setCaregivers(careRes.data.results ?? careRes.data);
      })
      .catch(() => setError("Greška pri učitavanju podataka."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      student_id: students[0]?.user_id?.toString() ?? "",
      caregiver_id: caregivers[0]?.user_id?.toString() ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!form.student_id || !form.appointment_date || !form.start_time || !form.end_time) {
      setFormError("Student, datum i vrijeme su obavezni.");
      return;
    }
    setFormSaving(true);
    try {
      await api.post("/home-care/appointments/", {
        student: Number(form.student_id),
        caregiver: form.caregiver_id ? Number(form.caregiver_id) : undefined,
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

  function openAssign(appt: Appointment) {
    setAssignModal(appt);
    setAssignCaregiverId(caregivers[0]?.user_id?.toString() ?? "");
    setAssignError("");
  }

  async function handleAssign() {
    if (!assignModal) return;
    setAssignError("");
    try {
      await api.post(`/home-care/appointments/${assignModal.appointment_id}/assign_caregiver/`, {
        caregiver_id: Number(assignCaregiverId),
      });
      setAssignModal(null);
      load();
    } catch (err: any) {
      setAssignError(JSON.stringify(err.response?.data ?? "Greška pri dodjeli."));
    }
  }

  async function handleComplete(appt: Appointment) {
    if (!confirm(`Označi termin od ${appt.appointment_date} kao završen?`)) return;
    try {
      await api.post(`/home-care/appointments/${appt.appointment_id}/complete/`);
      load();
    } catch {
      alert("Greška pri označavanju kao završeno.");
    }
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Njega u domu</h1>
        <button
          onClick={openCreate}
          disabled={loading || students.length === 0}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Kreiraj novi termin"
        >
          + Novi termin
        </button>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Učitavanje...</p>
      )}

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm" aria-label="Tablica termina kućne njege">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Vrijeme</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Njegovatelj</th>
                <th className="px-4 py-3">Lokacija</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <tr key={a.appointment_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{formatDateHR(a.appointment_date)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {a.student_name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {a.caregiver_name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.location || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {a.status === "pending" && (
                        <button
                          onClick={() => openAssign(a)}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`Dodijeli njegovatelja za termin ${a.appointment_id}`}
                        >
                          Dodijeli
                        </button>
                      )}
                      {a.status === "assigned" && (
                        <button
                          onClick={() => handleComplete(a)}
                          className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          aria-label={`Označi termin ${a.appointment_id} kao završen`}
                        >
                          Završi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nema termina
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create appointment modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-appt-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="create-appt-title" className="font-semibold text-gray-900">
                Novi termin
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label htmlFor="f-student" className="block text-xs font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  id="f-student"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className={inputCls}
                >
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.first_name} {s.last_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-caregiver" className="block text-xs font-medium text-gray-700 mb-1">
                  Njegovatelj/ica
                </label>
                <select
                  id="f-caregiver"
                  value={form.caregiver_id}
                  onChange={(e) => setForm({ ...form, caregiver_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— Bez dodjele —</option>
                  {caregivers.map((c) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="f-date" className="block text-xs font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  id="f-date"
                  type="date"
                  value={form.appointment_date}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="f-start" className="block text-xs font-medium text-gray-700 mb-1">
                    Početak
                  </label>
                  <input
                    id="f-start"
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="f-end" className="block text-xs font-medium text-gray-700 mb-1">
                    Kraj
                  </label>
                  <input
                    id="f-end"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="f-location" className="block text-xs font-medium text-gray-700 mb-1">
                  Lokacija
                </label>
                <input
                  id="f-location"
                  type="text"
                  placeholder="npr. Dom studenta, soba 204"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="f-desc" className="block text-xs font-medium text-gray-700 mb-1">
                  Opis (opcionalno)
                </label>
                <textarea
                  id="f-desc"
                  rows={3}
                  placeholder="Bilješke o terminu..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              {formError && (
                <p role="alert" className="text-red-600 text-sm">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Odustani
                </button>
                <button
                  onClick={handleCreate}
                  disabled={formSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formSaving ? "Spremanje..." : "Spremi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign caregiver modal */}
      {assignModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="assign-modal-title" className="font-semibold text-gray-900">
                Dodijeli njegovatelja
              </h2>
              <button
                onClick={() => setAssignModal(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">
                Termin: <span className="font-medium text-gray-900">{assignModal.appointment_date}</span>{" "}
                {assignModal.start_time.slice(0, 5)}–{assignModal.end_time.slice(0, 5)}
              </p>
              <div>
                <label htmlFor="assign-caregiver" className="block text-xs font-medium text-gray-700 mb-1">
                  Njegovatelj
                </label>
                <select
                  id="assign-caregiver"
                  value={assignCaregiverId}
                  onChange={(e) => setAssignCaregiverId(e.target.value)}
                  className={inputCls}
                >
                  {caregivers.map((c) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              {assignError && (
                <p role="alert" className="text-red-600 text-sm">
                  {assignError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Odustani
                </button>
                <button
                  onClick={handleAssign}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Dodijeli
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
