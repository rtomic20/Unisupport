import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Appointment {
  id: number;
  student_name: string;
  caregiver_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Na čekanju",
  assigned: "Dodijeljeno",
  completed: "Završeno",
  cancelled: "Otkazano",
};

function formatTime(t: string | null): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Appointment[] | { results: Appointment[] }>("/home-care/appointments/")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: Appointment[] }).results ?? [];
        setAppointments(data);
      })
      .catch(() => setError("Greška pri učitavanju termina."))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-xl font-bold text-gray-800">Moji termini njege</h1>
        <p className="text-sm text-gray-500 mt-1">Pregled svih vaših termina kućne njege.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">🏥</div>
          <p className="text-gray-500 text-sm">Nemate evidentiranih termina njege.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Vrijeme</th>
                  <th className="px-4 py-3">Lokacija</th>
                  <th className="px-4 py-3">Njegovatelj/ica</th>
                  <th className="px-4 py-3">Opis</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                      {appt.date}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{appt.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {appt.caregiver_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      {appt.description ? (
                        <span className="italic text-xs">{appt.description}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                          STATUS_COLORS[appt.status] ??
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
