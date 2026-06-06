import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import TimePicker from "../../components/TimePicker";

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    request_type: "transport",
    request_date: "",
    end_time: "",
    description: "",
    pickup_address: "",
    dropoff_address: "",
    service_category: "",
    location: "",
    start_time: "", // samo za service
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload: any = {
      request_type: form.request_type,
      request_date: form.request_date,
      end_time: form.end_time + ":00",
      description: form.description,
    };

    if (form.request_type === "transport") {
      payload.transport_details = {
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
      };
    } else {
      if (form.start_time) payload.start_time = form.start_time + ":00";
      payload.service_details = {
        service_category: form.service_category,
        location: form.location,
      };
    }

    try {
      await api.post("/requests/", payload);
      navigate("/student/dashboard");
    } catch (err: any) {
      const data = err.response?.data;
      setError(typeof data === "object" ? JSON.stringify(data) : String(data));
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Novi zahtjev</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Tip zahtjeva */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tip zahtjeva</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "transport", label: "Prijevoz", icon: "🚗" },
                { val: "service", label: "Usluga", icon: "🛠️" },
              ].map((t) => (
                <label
                  key={t.val}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.request_type === t.val
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input type="radio" name="request_type" value={t.val}
                    checked={form.request_type === t.val}
                    onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                    className="sr-only" />
                  <span>{t.icon}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
            <input type="date" required value={form.request_date}
              onChange={(e) => setForm({ ...form, request_date: e.target.value })}
              className={inputClass} />
          </div>

          {/* Vrijeme dolaska (oboje) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.request_type === "transport"
                ? "Trebam biti na odredištu u"
                : "Kraj usluge"}
            </label>
            <TimePicker
              value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })}
              required
            />
          </div>

          {/* Service: početak */}
          {form.request_type === "service" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Početak usluge (opcionalno)</label>
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
            </div>
          )}

          {/* Transport detalji */}
          {form.request_type === "transport" && (
            <div className="space-y-3 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Detalji prijevoza</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Polazište</label>
                <input type="text" required value={form.pickup_address}
                  onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                  placeholder="Ulica i broj, grad"
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Odredište</label>
                <input type="text" required value={form.dropoff_address}
                  onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })}
                  placeholder="Ulica i broj, grad"
                  className={inputClass} />
              </div>
            </div>
          )}

          {/* Service detalji */}
          {form.request_type === "service" && (
            <div className="space-y-3 bg-orange-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Detalji usluge</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorija usluge</label>
                <input type="text" required value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                  placeholder="npr. Čišćenje, Dostava, Pomoć..."
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokacija</label>
                <input type="text" required value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Adresa / naziv objekta"
                  className={inputClass} />
              </div>
            </div>
          )}

          {/* Napomena */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Napomena (opcionalno)</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} placeholder="Dodatne napomene..."
              className={inputClass} />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
              Odustani
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Šaljem..." : "Pošalji zahtjev"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
