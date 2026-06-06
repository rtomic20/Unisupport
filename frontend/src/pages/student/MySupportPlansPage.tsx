import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Session {
  id: number;
  date: string;
  hours: number;
  notes: string;
  logged_by_name: string;
}

interface Plan {
  id: number;
  title: string;
  assistant_name: string;
  start_date: string;
  end_date: string;
  planned_hours: number;
  done_hours: number;
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
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                {s.date}
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

export default function MySupportPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    api
      .get("/peer-support/plans/")
      .then(({ data }) => {
        setPlans(data.results ?? data);
      })
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">
        Moji planovi podrške
      </h1>

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
              const isOpen = expandedIds.has(plan.id);
              return (
                <div key={plan.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggleRow(plan.id)}
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
                            {plan.planned_hours}h
                          </span>
                        </span>
                        <span>
                          Odrađeno:{" "}
                          <span className="font-medium text-blue-700">
                            {plan.done_hours}h
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
                        {plan.planned_hours}h
                      </span>
                      <span className="text-right font-medium text-blue-700 whitespace-nowrap">
                        {plan.done_hours}h
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
                      <SessionsPanel planId={plan.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
