import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

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
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const PLAN_STATUS_LABELS: Record<string, string> = {
  active: "Aktivno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

function formatTime(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

type Tab = "transport" | "care" | "plans";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("transport");
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/requests/", { params: { type: "transport" } }),
      api.get("/home-care/appointments/"),
      api.get("/peer-support/plans/"),
    ]).then(([rRes, aRes, pRes]) => {
      setRequests(rRes.data.results ?? rRes.data);
      setAppointments(aRes.data.results ?? aRes.data);
      setPlans(pRes.data.results ?? pRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: "transport", label: "Prijevoz", count: requests.length, color: "text-purple-700 border-purple-500" },
    { key: "care", label: "Njega u domu", count: appointments.length, color: "text-teal-700 border-teal-500" },
    { key: "plans", label: "Vršnjačka podrška", count: plans.length, color: "text-blue-700 border-blue-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Moji zahtjevi</h1>
        <Link
          to="/student/new-request"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novi zahtjev
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? t.color + " bg-transparent"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Transport tab */}
      {activeTab === "transport" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <EmptyState
              icon="🚗"
              message="Nemaš aktivnih zahtjeva za prijevoz."
              linkTo="/student/new-request"
              linkLabel="Kreiraj zahtjev za prijevoz"
            />
          ) : (
            requests.map((r) => (
              <div key={r.request_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${TRANSPORT_STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {TRANSPORT_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-purple-100 text-purple-700">
                        🚗 Prijevoz
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{r.request_date}</p>
                    {r.transport_details && (
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p>📍 {r.transport_details.pickup_address}</p>
                        <p>🏁 {r.transport_details.dropoff_address}</p>
                      </div>
                    )}
                    {r.end_time && (
                      <p className="text-xs text-gray-500 mt-1.5">Trebam biti u {formatTime(r.end_time)}</p>
                    )}
                    {r.status === "accepted" && r.accepted_by_name && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-1">
                        <p className="text-xs font-semibold text-blue-700">Vozač preuzima tvoj zahtjev</p>
                        <p className="text-sm text-blue-800 font-medium">{r.accepted_by_name}</p>
                        {r.start_time && (
                          <p className="text-sm text-blue-700">Dolazak po tebe u <span className="font-bold">{formatTime(r.start_time)}</span></p>
                        )}
                      </div>
                    )}
                    {r.description && (
                      <p className="text-xs text-gray-400 italic mt-2">"{r.description}"</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 shrink-0">#{r.request_id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Njega u domu tab */}
      {activeTab === "care" && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <EmptyState
              icon="🏠"
              message="Nemaš evidentiranih termina njege u domu."
              linkTo="/student/appointments"
              linkLabel="Zatraži termin njege"
            />
          ) : (
            appointments.map((a) => (
              <div key={a.appointment_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${CARE_STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {CARE_STATUS_LABELS[a.status] ?? a.status}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-teal-100 text-teal-700">
                        🏠 Njega u domu
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{a.appointment_date}</p>
                    <p className="text-sm text-gray-600">
                      {formatTime(a.start_time)} – {formatTime(a.end_time)}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                    {(a.status === "assigned" || a.status === "completed") && a.caregiver_name && (
                      <div className="mt-3 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2.5">
                        <p className="text-xs font-semibold text-teal-700">Njegovatelj preuzima tvoj zahtjev:</p>
                        <p className="text-sm text-teal-800 font-medium mt-0.5">{a.caregiver_name}</p>
                      </div>
                    )}
                    {a.description && (
                      <p className="text-xs text-gray-400 italic mt-2">"{a.description}"</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 shrink-0">#{a.appointment_id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Vršnjačka podrška tab */}
      {activeTab === "plans" && (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <EmptyState
              icon="🤝"
              message="Nemaš aktivnih planova vršnjačke podrške."
              linkTo="/student/support-plans"
              linkLabel="Zatraži plan podrške"
            />
          ) : (
            plans.map((p) => (
              <div key={p.plan_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${PLAN_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {PLAN_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-100 text-blue-700">
                        🤝 Vršnjačka podrška
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.start_date}{p.end_date ? ` – ${p.end_date}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      <span>Planirano: <span className="font-medium text-gray-700">{p.total_hours_planned}h</span></span>
                      <span>Odrađeno: <span className="font-medium text-blue-700">{p.total_hours_done}h</span></span>
                    </div>
                    {p.assistant_name && (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                        <p className="text-xs font-semibold text-blue-700">Asistent preuzima tvoj zahtjev</p>
                        <p className="text-sm text-blue-800 font-medium mt-0.5">{p.assistant_name}</p>
                      </div>
                    )}
                    {p.description && (
                      <p className="text-xs text-gray-400 italic mt-2">"{p.description}"</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 shrink-0">#{p.plan_id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  message,
  linkTo,
  linkLabel,
}: {
  icon: string;
  message: string;
  linkTo: string;
  linkLabel: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-500 text-sm">{message}</p>
      <Link to={linkTo} className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
        {linkLabel}
      </Link>
    </div>
  );
}
