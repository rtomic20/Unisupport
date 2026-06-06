import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Appointment {
  appointment_id: number;
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

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(t: string | null): string {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default function CaregiverSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  function load(date: string) {
    setLoading(true);
    setError("");
    api
      .get<Appointment[] | { results: Appointment[] }>("/home-care/appointments/", {
        params: { date },
      })
      .then((res) => {
        const raw = Array.isArray(res.data)
          ? res.data
          : (res.data as { results: Appointment[] }).results ?? [];
        const sorted = [...raw].sort((a, b) =>
          (a.start_time ?? "").localeCompare(b.start_time ?? "")
        );
        setAppointments(sorted);
      })
      .catch(() => setError("Greška pri učitavanju termina."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(selectedDate);
  }, [selectedDate]);

  async function handleComplete(id: number) {
    setCompleting(id);
    try {
      await api.post(`/home-care/appointments/${id}/complete/`);
      load(selectedDate);
    } catch {
      setError("Greška pri označavanju termina kao završenog.");
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Moj raspored</h1>
        <p className="text-sm text-gray-500 mt-1">Pregledajte termine po datumu.</p>
      </div>

      {/* Date picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-5 flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-600">Datum:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSelectedDate(getTodayISO())}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Danas
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Učitavanje...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500 text-sm">Nema termina za odabrani datum.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Početak</th>
                  <th className="px-4 py-3">Kraj</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Lokacija</th>
                  <th className="px-4 py-3">Opis</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                      {formatTime(appt.start_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatTime(appt.end_time)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {appt.student_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{appt.location || "—"}</td>
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
                    <td className="px-4 py-3">
                      {appt.status !== "completed" && appt.status !== "cancelled" && (
                        <button
                          onClick={() => handleComplete(appt.appointment_id)}
                          disabled={completing === appt.appointment_id}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          {completing === appt.appointment_id ? "Sprema..." : "Označi završenim"}
                        </button>
                      )}
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
