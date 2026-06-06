import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import TimePicker from "../../components/TimePicker";

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    request_date: "",
    end_time: "",
    description: "",
    pickup_address: "",
    dropoff_address: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/requests/", {
        request_type: "transport",
        request_date: form.request_date,
        end_time: form.end_time + ":00",
        description: form.description,
        transport_details: {
          pickup_address: form.pickup_address,
          dropoff_address: form.dropoff_address,
        },
      });
      navigate("/student/dashboard");
    } catch (err: any) {
      const data = err.response?.data;
      setError(typeof data === "object" ? JSON.stringify(data) : String(data));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Novi zahtjev — Prijevoz</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
            <input
              type="date"
              required
              value={form.request_date}
              onChange={(e) => setForm({ ...form, request_date: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trebam biti na odredištu u
            </label>
            <TimePicker
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
              required
            />
          </div>

          <div className="space-y-3 bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              Detalji prijevoza
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Polazište</label>
              <input
                type="text"
                required
                value={form.pickup_address}
                onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                placeholder="Ulica i broj, grad"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Odredište</label>
              <input
                type="text"
                required
                value={form.dropoff_address}
                onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })}
                placeholder="Ulica i broj, grad"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Napomena (opcionalno)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Dodatne napomene..."
              className={inputClass}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              Odustani
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Šaljem..." : "Pošalji zahtjev"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
