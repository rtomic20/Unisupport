import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

interface SupportPlan {
  plan_id: number;
  title: string;
  student_name: string;
  total_hours_planned: number;
  total_hours_done: number;
  status: "active" | "completed" | "paused" | "cancelled";
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

export default function AssistantDashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SupportPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const activePlans = plans.filter((p) => p.status === "active");
  const totalDoneHours = plans.reduce((sum, p) => sum + (p.total_hours_done ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Dobrodošli, {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pregled vaših planova podrške.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Aktivni planovi</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{activePlans.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Ukupno odrađenih sati</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">
            {totalDoneHours.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Active plans table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Aktivni planovi</h2>
          <Link
            to="/assistant/plans"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Svi planovi →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Naslov plana</th>
                <th className="px-4 py-3">Odrađeno / Planirano</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activePlans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    Nema aktivnih planova.
                  </td>
                </tr>
              ) : (
                activePlans.map((plan) => {
                  const pct =
                    plan.total_hours_planned > 0
                      ? Math.min(100, Math.round((plan.total_hours_done / plan.total_hours_planned) * 100))
                      : 0;
                  return (
                    <tr key={plan.plan_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {plan.student_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{plan.title}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium whitespace-nowrap">
                            {plan.total_hours_done}h / {plan.total_hours_planned}h
                          </span>
                          <div className="flex-1 min-w-16 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                            STATUS_COLORS[plan.status] ??
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[plan.status] ?? plan.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
