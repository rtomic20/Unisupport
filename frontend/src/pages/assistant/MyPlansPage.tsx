import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

interface Session {
  id: number;
  plan: number;
  session_date: string;
  hours: number;
  notes: string;
}

interface SupportPlan {
  id: number;
  title: string;
  student_name: string;
  planned_hours: number;
  done_hours: number;
  status: "active" | "completed" | "paused" | "cancelled";
}

interface NewSessionForm {
  session_date: string;
  hours: string;
  notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktivan",
  completed: "Završen",
  paused: "Pauziran",
  cancelled: "Otkazan",
};

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): NewSessionForm {
  return { session_date: getTodayISO(), hours: "", notes: "" };
}

export default function MyPlansPage() {
  const [plans, setPlans] = useState<SupportPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expanded plan id -> sessions + form state
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [sessionsMap, setSessionsMap] = useState<Record<number, Session[]>>({});
  const [sessionsLoadingMap, setSessionsLoadingMap] = useState<Record<number, boolean>>({});
  const [formsMap, setFormsMap] = useState<Record<number, NewSessionForm>>({});
  const [savingMap, setSavingMap] = useState<Record<number, boolean>>({});
  const [formErrorsMap, setFormErrorsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    api
      .get<SupportPlan[] | { results: SupportPlan[] }>("/peer-support/plans/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: SupportPlan[] }).results ?? [];
        setPlans(data);
      })
      .catch(() => setError("Greška pri učitavanju planova."))
      .finally(() => setLoading(false));
  }, []);

  const loadSessions = useCallback((planId: number) => {
    setSessionsLoadingMap((prev) => ({ ...prev, [planId]: true }));
    api
      .get<Session[] | { results: Session[] }>("/peer-support/sessions/", {
        params: { plan_id: planId },
      })
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: Session[] }).results ?? [];
        setSessionsMap((prev) => ({ ...prev, [planId]: data }));
      })
      .catch(() => {
        setSessionsMap((prev) => ({ ...prev, [planId]: [] }));
      })
      .finally(() => {
        setSessionsLoadingMap((prev) => ({ ...prev, [planId]: false }));
      });
  }, []);

  function togglePlan(planId: number) {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
    } else {
      setExpandedPlanId(planId);
      if (!sessionsMap[planId]) {
        loadSessions(planId);
      }
      if (!formsMap[planId]) {
        setFormsMap((prev) => ({ ...prev, [planId]: emptyForm() }));
      }
    }
  }

  function updateForm(planId: number, field: keyof NewSessionForm, value: string) {
    setFormsMap((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  }

  async function handleSubmitSession(planId: number) {
    const form = formsMap[planId];
    if (!form) return;

    const hoursNum = parseFloat(form.hours);
    if (!form.session_date || isNaN(hoursNum) || hoursNum <= 0) {
      setFormErrorsMap((prev) => ({
        ...prev,
        [planId]: "Unesite valjan datum i broj sati (> 0).",
      }));
      return;
    }

    setSavingMap((prev) => ({ ...prev, [planId]: true }));
    setFormErrorsMap((prev) => ({ ...prev, [planId]: "" }));

    try {
      await api.post("/peer-support/sessions/", {
        plan: planId,
        session_date: form.session_date,
        hours: hoursNum,
        notes: form.notes,
      });
      // Reset form and reload sessions + plans
      setFormsMap((prev) => ({ ...prev, [planId]: emptyForm() }));
      loadSessions(planId);
      // Refresh plans to update done_hours
      api
        .get<SupportPlan[] | { results: SupportPlan[] }>("/peer-support/plans/")
        .then((res) => {
          const data = Array.isArray(res.data)
            ? res.data
            : (res.data as { results: SupportPlan[] }).results ?? [];
          setPlans(data);
        });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setFormErrorsMap((prev) => ({
        ...prev,
        [planId]: axiosErr.response?.data?.detail ?? "Greška pri bilježenju sesije.",
      }));
    } finally {
      setSavingMap((prev) => ({ ...prev, [planId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Moji planovi podrške</h1>
        <p className="text-sm text-gray-500 mt-1">Pregledajte planove i zabilježite sesije.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">Nemate dodijeljenih planova podrške.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const sessions = sessionsMap[plan.id] ?? [];
            const sessionsLoading = sessionsLoadingMap[plan.id] ?? false;
            const form = formsMap[plan.id] ?? emptyForm();
            const saving = savingMap[plan.id] ?? false;
            const formError = formErrorsMap[plan.id] ?? "";
            const pct =
              plan.planned_hours > 0
                ? Math.min(100, Math.round((plan.done_hours / plan.planned_hours) * 100))
                : 0;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Plan header row — click to expand */}
                <button
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  onClick={() => togglePlan(plan.id)}
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-800">{plan.title}</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-lg border font-medium ${
                            STATUS_COLORS[plan.status] ??
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[plan.status] ?? plan.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{plan.student_name}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {plan.done_hours}h / {plan.planned_hours}h
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-6">
                    {/* Sessions table */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Sesije</h3>
                      {sessionsLoading ? (
                        <p className="text-sm text-gray-400">Učitavanje sesija...</p>
                      ) : sessions.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Još nema zabilježenih sesija.</p>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                                <th className="px-3 py-2">Datum</th>
                                <th className="px-3 py-2">Sati</th>
                                <th className="px-3 py-2">Napomene</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {sessions.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                    {s.session_date}
                                  </td>
                                  <td className="px-3 py-2 text-gray-700 font-medium">
                                    {s.hours}h
                                  </td>
                                  <td className="px-3 py-2 text-gray-500 italic">
                                    {s.notes || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Log new session form */}
                    {plan.status === "active" && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Zabilježi novu sesiju
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Datum sesije
                            </label>
                            <input
                              type="date"
                              value={form.session_date}
                              onChange={(e) =>
                                updateForm(plan.id, "session_date", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Broj sati
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="npr. 2"
                              value={form.hours}
                              onChange={(e) => updateForm(plan.id, "hours", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Napomene
                            </label>
                            <input
                              type="text"
                              placeholder="Opcionalno"
                              value={form.notes}
                              onChange={(e) => updateForm(plan.id, "notes", e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {formError && (
                          <p className="mt-2 text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                            {formError}
                          </p>
                        )}

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleSubmitSession(plan.id)}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {saving ? "Sprema..." : "Zabilježi sesiju"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
