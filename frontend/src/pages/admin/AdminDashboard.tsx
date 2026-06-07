import { useEffect, useState } from "react";
import api from "../../api/axios";

function formatDateHR(dateStr: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}.`;
}

type ServiceType = "transport" | "care" | "support";

interface UnifiedItem {
  key: string;
  type: ServiceType;
  student_name: string;
  worker_name: string;
  date: string;
  status: string;
}

const TYPE_BADGE: Record<ServiceType, { label: string; cls: string }> = {
  transport: { label: "Prijevoz", cls: "bg-purple-100 text-purple-700" },
  care: { label: "Njega u domu", cls: "bg-teal-100 text-teal-700" },
  support: { label: "Vršnjačka podrška", cls: "bg-blue-100 text-blue-700" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  assigned: "Dodijeljeno",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
  rejected: "Odbijeno",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  assigned: "bg-teal-100 text-teal-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [items, setItems] = useState<UnifiedItem[]>([]);
  const [stats, setStats] = useState({ transport: 0, care: 0, support: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/requests/", { params: { type: "transport" } }),
      api.get("/home-care/appointments/"),
      api.get("/peer-support/plans/"),
    ]).then(([tRes, cRes, sRes]) => {
      const transport: UnifiedItem[] = (tRes.data.results ?? tRes.data)
        .filter((r: any) => r.request_type === "transport")
        .map((r: any) => ({
          key: `t-${r.request_id}`,
          type: "transport" as ServiceType,
          student_name: r.student_name,
          worker_name: r.accepted_by_name || "—",
          date: r.request_date,
          status: r.status,
        }));
      const care: UnifiedItem[] = (cRes.data.results ?? cRes.data).map((a: any) => ({
        key: `c-${a.appointment_id}`,
        type: "care" as ServiceType,
        student_name: a.student_name,
        worker_name: a.caregiver_name || "—",
        date: a.appointment_date,
        status: a.status,
      }));
      const support: UnifiedItem[] = (sRes.data.results ?? sRes.data).map((p: any) => ({
        key: `s-${p.plan_id}`,
        type: "support" as ServiceType,
        student_name: p.student_name,
        worker_name: p.assistant_name || "—",
        date: p.start_date,
        status: p.status,
      }));

      const STATUS_ORDER: Record<string, number> = { pending: 0, assigned: 1, accepted: 1, active: 1, completed: 2, cancelled: 2, rejected: 2 };
      const all = [...transport, ...care, ...support].sort((a, b) => {
        const sc = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
        if (sc !== 0) return sc;
        return a.date.localeCompare(b.date);
      });

      setStats({
        transport: transport.length,
        care: care.length,
        support: support.length,
        pending: all.filter((i) => i.status === "pending").length,
      });
      setItems(all.slice(0, 15));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Prijevoz</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{stats.transport}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Njega u domu</p>
          <p className="text-3xl font-bold text-teal-600 mt-1">{stats.care}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Vršnjačka podrška</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.support}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Na čekanju</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Zadnjih 15 zahtjeva (svi moduli)</h2>
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">Učitavanje...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Tip</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Djelatnik</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const tb = TYPE_BADGE[item.type];
                  return (
                    <tr key={item.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${tb.cls}`}>{tb.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.student_name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.worker_name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateHR(item.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nema zahtjeva</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
