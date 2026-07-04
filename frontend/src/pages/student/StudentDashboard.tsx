import { useEffect, useState } from "react";
import api from "../../api/axios";
import { formatDateHR } from "../../utils/date";

const TRANSPORT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};
const TRANSPORT_STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  rejected: "Odbijeno",
  completed: "Završeno",
};

const CARE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  assigned: "bg-teal-100 text-teal-700 border-teal-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const CARE_STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  assigned: "Dodijeljeno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const PLAN_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const PLAN_STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

function formatTime(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

type Tab = "transport" | "care" | "plans";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("transport");
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get("/requests/", { params: { type: "transport" } }),
      api.get("/home-care/appointments/"),
      api.get("/peer-support/plans/"),
    ]).then(([rRes, aRes, pRes]) => {
      const allRequests = rRes.data.results ?? rRes.data;
      const allAppointments = aRes.data.results ?? aRes.data;
      const allPlans = pRes.data.results ?? pRes.data;
      setRequests(allRequests.filter((r: any) => r.status === "pending"));
      setAppointments(allAppointments.filter((a: any) => a.status === "pending"));
      setPlans(allPlans.filter((p: any) => p.status === "pending"));
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "transport", label: "Prijevoz", count: requests.length },
    { key: "care", label: "Njega u domu", count: appointments.length },
    { key: "plans", label: "Vršnjačka podrška", count: plans.length },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Učitavanje...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Moji zahtjevi</h1>
        <p className="text-sm text-gray-500 mt-1">Zahtjevi koji čekaju odobrenje od nadležnih osoba.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "border-blue-500 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-full px-1.5 py-0.5 font-semibold">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* PRIJEVOZ */}
      {activeTab === "transport" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Zahtjevi za prijevoz koji čekaju na dodjelu vozača.</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Datum</th>
                    <th className="px-4 py-3">Polazište → Odredište</th>
                    <th className="px-4 py-3">Dolazak do</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Nema zahtjeva na čekanju.</td></tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.request_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{formatDateHR(r.request_date)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {r.transport_details
                            ? <>{r.transport_details.pickup_address} → {r.transport_details.dropoff_address}</>
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(r.end_time)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${TRANSPORT_STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {TRANSPORT_STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NJEGA U DOMU */}
      {activeTab === "care" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Termini njege u domu koji čekaju na dodjelu njegovatelja.</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Datum</th>
                    <th className="px-4 py-3">Vrijeme</th>
                    <th className="px-4 py-3">Lokacija</th>
                    <th className="px-4 py-3 max-w-xs">Opis</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Nema termina na čekanju.</td></tr>
                  ) : (
                    appointments.map((a) => (
                      <tr key={a.appointment_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{formatDateHR(a.appointment_date)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(a.start_time)} – {formatTime(a.end_time)}</td>
                        <td className="px-4 py-3 text-gray-600">{a.location || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs">
                          <span className="block truncate text-xs italic" title={a.description}>{a.description || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap ${CARE_STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {CARE_STATUS_LABELS[a.status] ?? a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VRŠNJAČKA PODRŠKA */}
      {activeTab === "plans" && (
        <div>
          <p className="text-sm text-gray-500 mb-4">Planovi vršnjačke podrške koji čekaju na dodjelu asistenta.</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Naziv plana</th>
                    <th className="px-4 py-3">Početak</th>
                    <th className="px-4 py-3 text-right">Plan. sati</th>
                    <th className="px-4 py-3 text-right">Odrađeno</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {plans.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Nema planova na čekanju.</td></tr>
                  ) : (
                    plans.map((p) => (
                      <tr key={p.plan_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateHR(p.start_date)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">{p.total_hours_planned}h</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-700">{p.total_hours_done}h</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${PLAN_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {PLAN_STATUS_LABELS[p.status] ?? p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
