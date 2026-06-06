import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";

interface Appointment {
  id: number;
  student_name: string;
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

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const today = getTodayISO();

    Promise.all([
      api.get<Appointment[] | { results: Appointment[] }>("/home-care/appointments/", {
        params: { date: today },
      }),
      api.get<Appointment[] | { results: Appointment[] }>("/home-care/appointments/"),
    ])
      .then(([todayRes, allRes]) => {
        const todayData = Array.isArray(todayRes.data)
          ? todayRes.data
          : (todayRes.data as { results: Appointment[] }).results ?? [];
        const allData = Array.isArray(allRes.data)
          ? allRes.data
          : (allRes.data as { results: Appointment[] }).results ?? [];

        setTodayAppointments(todayData);
        setTotalCount(allData.length);
      })
      .catch(() => {
        setError("Greška pri učitavanju termina.");
      })
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Dobrodošli, {user?.first_name} {user?.last_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pregled vaših termina njege za danas.</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Termini danas</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{todayAppointments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Ukupno dodijeljenih termina</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{totalCount}</p>
        </div>
      </div>

      {/* Today's appointments table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Termini za danas</h2>
          <Link
            to="/caregiver/schedule"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Vidi raspored →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Vrijeme</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Lokacija</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todayAppointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    Nema termina za danas.
                  </td>
                </tr>
              ) : (
                todayAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                      {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{appt.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{appt.location || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                          STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUS_LABELS[appt.status] ?? appt.status}
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
  );
}
