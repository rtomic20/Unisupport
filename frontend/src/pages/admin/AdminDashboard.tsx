import { useEffect, useState } from "react";
import api from "../../api/axios";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

export default function AdminDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });

  useEffect(() => {
    api.get("/requests/").then(({ data }) => {
      const all = data.results ?? data;
      setRequests(all.slice(0, 10));
      setStats({
        total: all.length,
        pending: all.filter((r: any) => r.status === "pending").length,
        completed: all.filter((r: any) => r.status === "completed").length,
      });
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Ukupno zahtjeva</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Na čekanju</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Završeno</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Zadnjih 10 zahtjeva</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Tip</th>
                <th className="px-4 py-3">Datum</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((r) => (
                <tr key={r.request_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{r.request_id}</td>
                  <td className="px-4 py-3 text-gray-700">{r.student_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.request_type === "transport" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                      {r.request_type === "transport" ? "Prijevoz" : "Usluga"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.request_date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nema zahtjeva
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
