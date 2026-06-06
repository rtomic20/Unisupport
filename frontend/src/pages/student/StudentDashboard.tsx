import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  completed: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  accepted: "Prihvaćeno",
  rejected: "Odbijeno",
  completed: "Završeno",
};

function formatTime(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

export default function StudentDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/requests/").then(({ data }) => {
      setRequests(data.results ?? data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Moji zahtjevi</h1>
        <Link to="/student/new-request"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novi zahtjev
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">Nemaš aktivnih zahtjeva.</p>
          <Link to="/student/new-request" className="mt-3 inline-block text-sm text-blue-600 hover:underline font-medium">
            Kreiraj prvi zahtjev
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.request_id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${r.request_type === "transport" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                      {r.request_type === "transport" ? "🚗 Prijevoz" : "🛠️ Usluga"}
                    </span>
                  </div>

                  {/* Datum */}
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {r.request_date}
                  </p>

                  {/* Transport detalji */}
                  {r.request_type === "transport" && r.transport_details && (
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>📍 {r.transport_details.pickup_address}</p>
                      <p>🏁 {r.transport_details.dropoff_address}</p>
                    </div>
                  )}

                  {/* Service detalji */}
                  {r.request_type === "service" && r.service_details && (
                    <p className="text-sm text-gray-600">
                      {r.service_details.service_category}
                      {r.service_details.location ? ` – ${r.service_details.location}` : ""}
                    </p>
                  )}

                  {/* Vrijame dolaska */}
                  {r.end_time && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Trebam biti u {formatTime(r.end_time)}
                    </p>
                  )}

                  {/* Vozač i pickup time — prikaži tek kad je prihvaćeno */}
                  {r.status === "accepted" && r.accepted_by_name && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 space-y-1">
                      <p className="text-xs font-semibold text-blue-700">Vozač preuzima tvoj zahtjev</p>
                      <p className="text-sm text-blue-800 font-medium">{r.accepted_by_name}</p>
                      {r.start_time && (
                        <p className="text-sm text-blue-700">
                          Dolazak po tebe u <span className="font-bold">{formatTime(r.start_time)}</span>
                        </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
