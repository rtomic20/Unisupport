import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";

interface Session {
  session_id: number;
  session_date: string;
  hours: number;
  notes: string;
  logged_by_name: string;
}

interface Plan {
  plan_id: number;
  title: string;
  assistant_name: string;
  start_date: string;
  end_date: string;
  total_hours_planned: number;
  total_hours_done: number;
  status: "active" | "completed" | "cancelled";
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  active: {
    label: "Aktivno",
    classes: "bg-green-100 text-green-700 border-green-200",
  },
  completed: {
    label: "Završeno",
    classes: "bg-blue-100 text-blue-700 border-blue-200",
  },
  cancelled: {
    label: "Otkazano",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

function SessionsPanel({ planId }: { planId: number }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/peer-support/sessions/", { params: { plan_id: planId } })
      .then(({ data }) => {
        setSessions(data.results ?? data);
      })
      .finally(() => setLoading(false));
  }, [planId]);

  if (loading) {
    return (
      <div className="px-4 py-4 text-sm text-gray-400">Učitavanje sesija...</div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 py-4 text-sm text-gray-400 italic">
        Nema evidentiranih sesija za ovaj plan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <th className="px-4 py-2.5">Datum</th>
            <th className="px-4 py-2.5 text-right">Sati</th>
            <th className="px-4 py-2.5">Bilješke</th>
            <th className="px-4 py-2.5">Evidentirano od</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sessions.map((s) => (
            <tr key={s.session_id} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                {s.session_date}
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-blue-700 whitespace-nowrap">
                {s.hours}h
              </td>
              <td className="px-4 py-2.5 text-gray-600 max-w-xs">
                {s.notes || <span className="italic text-gray-400">—</span>}
              </td>
              <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                {s.logged_by_name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY_PLAN_FORM = {
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  total_hours_planned: "",
};

export default function MySupportPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);
  const [planFormError, setPlanFormError] = useState("");
  const [planFormSaving, setPlanFormSaving] = useState(false);

  const loadPlans = useCallback(() => {
    setLoading(true);
    api
      .get("/peer-support/plans/")
      .then(({ data }) => {
        setPlans(data.results ?? data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  async function handleCreatePlan() {
    setPlanFormError("");
    if (!planForm.title || !planForm.start_date || !planForm.total_hours_planned) {
      setPlanFormError("Naslov, datum početka i broj sati su obavezni.");
      return;
    }
    setPlanFormSaving(true);
    try {
      await api.post("/peer-support/plans/", {
        title: planForm.title,
        description: planForm.description,
        start_date: planForm.start_date,
        end_date: planForm.end_date || null,
        total_hours_planned: Number(planForm.total_hours_planned),
      });
      setShowForm(false);
      setPlanForm(EMPTY_PLAN_FORM);
      loadPlans();
    } catch (err: any) {
      setPlanFormError(JSON.stringify(err.response?.data ?? "Greška pri kreiranju."));
    } finally {
      setPlanFormSaving(false);
    }
  }

  function toggleRow(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Moji planovi podrške
        </h1>
        <button
          onClick={() => { setPlanForm(EMPTY_PLAN_FORM); setPlanFormError(""); setShowForm(true); }}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Zatraži plan podrške
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">
            Nemate evidentiranih planova podrške.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto_auto] gap-x-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
            <span>Naziv plana</span>
            <span>Asistent</span>
            <span className="text-right">Početak</span>
            <span className="text-right">Kraj</span>
            <span className="text-right">Planiran. sati</span>
            <span className="text-right">Odrađeno</span>
            <span>Status</span>
            <span></span>
          </div>

          <div className="divide-y divide-gray-50">
            {plans.map((plan) => {
              const isOpen = expandedIds.has(plan.plan_id);
              return (
                <div key={plan.plan_id}>
                  {/* Row */}
                  <button
                    onClick={() => toggleRow(plan.plan_id)}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Mobile layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-gray-800 text-sm">
                          {plan.title}
                        </span>
                        <StatusBadge status={plan.status} />
                      </div>
                      <div className="text-xs text-gray-500">
                        Asistent: {plan.assistant_name}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{plan.start_date} – {plan.end_date}</span>
                        <span>
                          Planiran:{" "}
                          <span className="font-medium text-gray-700">
                            {plan.total_hours_planned}h
                          </span>
                        </span>
                        <span>
                          Odrađeno:{" "}
                          <span className="font-medium text-blue-700">
                            {plan.total_hours_done}h
                          </span>
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {isOpen ? "Sakrij sesije ▲" : "Prikaži sesije ▼"}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto_auto] gap-x-4 items-center text-sm">
                      <span className="font-medium text-gray-800 truncate">
                        {plan.title}
                      </span>
                      <span className="text-gray-600 truncate">
                        {plan.assistant_name}
                      </span>
                      <span className="text-gray-600 text-right whitespace-nowrap">
                        {plan.start_date}
                      </span>
                      <span className="text-gray-600 text-right whitespace-nowrap">
                        {plan.end_date}
                      </span>
                      <span className="text-right font-medium text-gray-700 whitespace-nowrap">
                        {plan.total_hours_planned}h
                      </span>
                      <span className="text-right font-medium text-blue-700 whitespace-nowrap">
                        {plan.total_hours_done}h
                      </span>
                      <StatusBadge status={plan.status} />
                      <span className="text-xs text-blue-500 text-right whitespace-nowrap">
                        {isOpen ? "Sakrij ▲" : "Sesije ▼"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded sessions */}
                  {isOpen && (
                    <div className="border-t border-dashed border-gray-100 bg-gray-50/60">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sesije
                      </div>
                      <SessionsPanel planId={plan.plan_id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="create-plan-title" className="font-semibold text-gray-900">
                Zatraži plan podrške
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label htmlFor="plan-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Naslov *
                </label>
                <input
                  id="plan-title"
                  type="text"
                  placeholder="npr. Podrška pri kretanju"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="plan-desc" className="block text-xs font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  id="plan-desc"
                  rows={3}
                  placeholder="Opišite vrstu podrške koja vam je potrebna..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="plan-start" className="block text-xs font-medium text-gray-700 mb-1">
                    Datum početka *
                  </label>
                  <input
                    id="plan-start"
                    type="date"
                    value={planForm.start_date}
                    onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="plan-end" className="block text-xs font-medium text-gray-700 mb-1">
                    Datum završetka
                  </label>
                  <input
                    id="plan-end"
                    type="date"
                    value={planForm.end_date}
                    onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="plan-hours" className="block text-xs font-medium text-gray-700 mb-1">
                  Planirani broj sati *
                </label>
                <input
                  id="plan-hours"
                  type="number"
                  min={1}
                  placeholder="npr. 20"
                  value={planForm.total_hours_planned}
                  onChange={(e) => setPlanForm({ ...planForm, total_hours_planned: e.target.value })}
                  className={inputCls}
                />
              </div>
              {planFormError && (
                <p role="alert" className="text-red-600 text-sm">
                  {planFormError}
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
                  onClick={handleCreatePlan}
                  disabled={planFormSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {planFormSaving ? "Slanje..." : "Pošalji zahtjev"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
