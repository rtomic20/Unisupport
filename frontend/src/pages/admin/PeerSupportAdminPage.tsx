import { useState, useEffect } from "react";
import api from "../../api/axios";

function formatDateHR(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}.`;
}

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Plan {
  plan_id: number;
  title: string;
  description: string;
  student_name: string;
  assistant_name: string;
  start_date: string;
  end_date: string;
  total_hours_planned: number;
  total_hours_done: number;
  status: "pending" | "active" | "completed" | "cancelled";
}

interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const EMPTY_FORM = {
  student_id: "",
  assistant_id: "",
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  total_hours_planned: "",
};

export default function PeerSupportAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assistants, setAssistants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Sessions expandable row
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Status change
  const [statusModal, setStatusModal] = useState<Plan | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "completed" | "cancelled">("active");
  const [newAssistantId, setNewAssistantId] = useState("");
  const [statusError, setStatusError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/peer-support/plans/"),
      api.get("/accounts/users/?role=student"),
      api.get("/accounts/users/?role=assistant"),
    ])
      .then(([planRes, studRes, assistRes]) => {
        setPlans(planRes.data.results ?? planRes.data);
        setStudents(studRes.data.results ?? studRes.data);
        setAssistants(assistRes.data.results ?? assistRes.data);
      })
      .catch(() => setError("Greška pri učitavanju podataka."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleExpand(plan: Plan) {
    if (expandedPlanId === plan.plan_id) {
      setExpandedPlanId(null);
      setSessions([]);
      return;
    }
    setExpandedPlanId(plan.plan_id);
    setSessions([]);
    setSessionsLoading(true);
    try {
      const { data } = await api.get(`/peer-support/sessions/?plan_id=${plan.plan_id}`);
      setSessions(data.results ?? data);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }

  function openCreate() {
    setForm({
      ...EMPTY_FORM,
      student_id: students[0]?.user_id?.toString() ?? "",
      assistant_id: assistants[0]?.user_id?.toString() ?? "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!form.student_id || !form.assistant_id || !form.title || !form.start_date || !form.end_date || !form.total_hours_planned) {
      setFormError("Sva obavezna polja moraju biti ispunjena.");
      return;
    }
    setFormSaving(true);
    try {
      await api.post("/peer-support/plans/", {
        student: Number(form.student_id),
        assistant: Number(form.assistant_id),
        title: form.title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        total_hours_planned: Number(form.total_hours_planned),
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      setFormError(JSON.stringify(err.response?.data ?? "Greška pri kreiranju."));
    } finally {
      setFormSaving(false);
    }
  }

  function openStatusModal(plan: Plan) {
    setStatusModal(plan);
    setNewStatus(plan.status === "pending" ? "active" : plan.status as "active" | "completed" | "cancelled");
    setNewAssistantId("");
    setStatusError("");
  }

  async function handleStatusChange() {
    if (!statusModal) return;
    setStatusError("");
    try {
      const payload: Record<string, any> = { status: newStatus };
      if (newAssistantId) {
        payload.assistant = Number(newAssistantId);
      }
      await api.patch(`/peer-support/plans/${statusModal.plan_id}/`, payload);
      setStatusModal(null);
      load();
    } catch (err: any) {
      setStatusError(JSON.stringify(err.response?.data ?? "Greška pri promjeni statusa."));
    }
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vršnjačka podrška</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Kreiraj novi plan"
        >
          + Novi plan
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
          <table className="w-full text-sm" aria-label="Tablica planova peer podrške">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Naslov</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Asistent</th>
                <th className="px-4 py-3">Početak</th>
                <th className="px-4 py-3">Kraj</th>
                <th className="px-4 py-3">Sati</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <>
                  <tr
                    key={p.plan_id}
                    className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(p)}
                    aria-expanded={expandedPlanId === p.plan_id}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.student_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.assistant_name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateHR(p.start_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateHR(p.end_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium whitespace-nowrap">
                          {p.total_hours_done} / {p.total_hours_planned} h
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5" aria-hidden="true">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round((p.total_hours_done / Math.max(p.total_hours_planned, 1)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openStatusModal(p)}
                          className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 border border-gray-200"
                          aria-label={`Promijeni status plana ${p.title}`}
                        >
                          Status
                        </button>
                        <button
                          onClick={() => toggleExpand(p)}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label={`${expandedPlanId === p.plan_id ? "Sakrij" : "Prikaži"} sesije za plan ${p.title}`}
                        >
                          {expandedPlanId === p.plan_id ? "Sakrij" : "Sesije"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedPlanId === p.plan_id && (
                    <tr key={`${p.plan_id}-sessions`} className="bg-blue-50/30">
                      <td colSpan={8} className="px-6 py-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                          Sesije — {p.title}
                        </p>
                        {sessionsLoading ? (
                          <p className="text-sm text-gray-400">Učitavanje sesija...</p>
                        ) : sessions.length === 0 ? (
                          <p className="text-sm text-gray-400">Nema sesija za ovaj plan.</p>
                        ) : (
                          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden" aria-label={`Sesije za plan ${p.title}`}>
                            <thead>
                              <tr className="bg-gray-100 text-gray-500 text-left">
                                <th className="px-3 py-2">Datum</th>
                                <th className="px-3 py-2">Sati</th>
                                <th className="px-3 py-2">Bilješke</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {sessions.map((s: any) => (
                                <tr key={s.session_id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700">{s.session_date}</td>
                                  <td className="px-3 py-2 text-gray-700">{s.hours} h</td>
                                  <td className="px-3 py-2 text-gray-500">{s.notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Nema planova
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create plan modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-plan-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="create-plan-title" className="font-semibold text-gray-900">
                Novi plan peer podrške
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
                <label htmlFor="fp-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Naslov
                </label>
                <input
                  id="fp-title"
                  type="text"
                  placeholder="npr. Tjedna podrška u učenju"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="fp-student" className="block text-xs font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  id="fp-student"
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
                <label htmlFor="fp-assistant" className="block text-xs font-medium text-gray-700 mb-1">
                  Asistent
                </label>
                <select
                  id="fp-assistant"
                  value={form.assistant_id}
                  onChange={(e) => setForm({ ...form, assistant_id: e.target.value })}
                  className={inputCls}
                >
                  {assistants.map((a) => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.first_name} {a.last_name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fp-desc" className="block text-xs font-medium text-gray-700 mb-1">
                  Opis (opcionalno)
                </label>
                <textarea
                  id="fp-desc"
                  rows={2}
                  placeholder="Kratki opis plana..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fp-start" className="block text-xs font-medium text-gray-700 mb-1">
                    Datum početka
                  </label>
                  <input
                    id="fp-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="fp-end" className="block text-xs font-medium text-gray-700 mb-1">
                    Datum završetka
                  </label>
                  <input
                    id="fp-end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fp-hours" className="block text-xs font-medium text-gray-700 mb-1">
                  Planirani broj sati
                </label>
                <input
                  id="fp-hours"
                  type="number"
                  min="1"
                  placeholder="npr. 20"
                  value={form.total_hours_planned}
                  onChange={(e) => setForm({ ...form, total_hours_planned: e.target.value })}
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

      {/* Status change modal */}
      {statusModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="status-modal-title" className="font-semibold text-gray-900">
                Promijeni status
              </h2>
              <button
                onClick={() => setStatusModal(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600">
                Plan: <span className="font-medium text-gray-900">{statusModal.title}</span>
              </p>
              <div>
                <label htmlFor="status-select" className="block text-xs font-medium text-gray-700 mb-1">
                  Novi status
                </label>
                <select
                  id="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as "active" | "completed" | "cancelled")}
                  className={inputCls}
                >
                  <option value="active">Aktivno</option>
                  <option value="completed">Završeno</option>
                  <option value="cancelled">Otkazano</option>
                </select>
              </div>
              <div>
                <label htmlFor="assign-assistant" className="block text-xs font-medium text-gray-700 mb-1">
                  Dodijeli asistenta (opcionalno)
                </label>
                <select
                  id="assign-assistant"
                  value={newAssistantId}
                  onChange={(e) => setNewAssistantId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Bez promjene —</option>
                  {assistants.map((a) => (
                    <option key={a.user_id} value={String(a.user_id)}>
                      {a.first_name} {a.last_name}
                    </option>
                  ))}
                </select>
              </div>
              {statusError && (
                <p role="alert" className="text-red-600 text-sm">
                  {statusError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Odustani
                </button>
                <button
                  onClick={handleStatusChange}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Spremi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
