import { useState, FormEvent } from "react";
import api from "../api/axios";
import TimePicker from "./TimePicker";

interface Props {
  onClose: () => void;
  onSaved: () => void;
  request?: any;
  studentId?: number;
}

function toHHMM(t: string | undefined) {
  if (!t) return "";
  return t.slice(0, 5);
}

export default function RequestModal({ onClose, onSaved, request, studentId }: Props) {
  const isEdit = !!request;
  const [form, setForm] = useState({
    request_type: request?.request_type || "transport",
    request_date: request?.request_date || "",
    end_time: toHHMM(request?.end_time),
    start_time: toHHMM(request?.start_time),
    description: request?.description || "",
    pickup_address: request?.transport_details?.pickup_address || "",
    dropoff_address: request?.transport_details?.dropoff_address || "",
    service_category: request?.service_details?.service_category || "",
    location: request?.service_details?.location || "",
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

    if (!isEdit && studentId) payload.student = studentId;
    if (form.start_time) payload.start_time = form.start_time + ":00";

    if (form.request_type === "transport") {
      payload.transport_details = {
        pickup_address: form.pickup_address,
        dropoff_address: form.dropoff_address,
      };
    } else {
      payload.service_details = {
        service_category: form.service_category,
        location: form.location,
      };
    }

    try {
      if (isEdit) {
        await api.patch(`/requests/${request.request_id}/`, payload);
      } else {
        await api.post("/requests/", payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const data = err.response?.data;
      setError(typeof data === "string" ? data : JSON.stringify(data));
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-semibold text-gray-800 text-lg">
            {isEdit ? "Uredi zahtjev" : "Novi zahtjev"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tip zahtjeva</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ val: "transport", label: "🚗 Prijevoz" }, { val: "service", label: "🛠️ Usluga" }].map((t) => (
                <label key={t.val} className={`flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${form.request_type === t.val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <input type="radio" name="request_type" value={t.val} checked={form.request_type === t.val}
                    onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                    disabled={isEdit} className="sr-only" />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
            <input type="date" required value={form.request_date}
              onChange={(e) => setForm({ ...form, request_date: e.target.value })}
              className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.request_type === "transport" ? "Trebam biti na odredištu u" : "Kraj usluge"}
            </label>
            <TimePicker value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} required />
          </div>

          {form.request_type === "service" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Početak usluge (opcionalno)</label>
              <TimePicker value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            </div>
          )}

          {form.request_type === "transport" && (
            <div className="space-y-3 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Detalji prijevoza</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Polazište</label>
                <input type="text" required value={form.pickup_address}
                  onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                  placeholder="Adresa polazišta" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Odredište</label>
                <input type="text" required value={form.dropoff_address}
                  onChange={(e) => setForm({ ...form, dropoff_address: e.target.value })}
                  placeholder="Adresa odredišta" className={inputClass} />
              </div>
            </div>
          )}

          {form.request_type === "service" && (
            <div className="space-y-3 bg-orange-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Detalji usluge</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorija usluge</label>
                <input type="text" required value={form.service_category}
                  onChange={(e) => setForm({ ...form, service_category: e.target.value })}
                  placeholder="npr. Čišćenje, Dostava..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokacija</label>
                <input type="text" required value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Adresa / naziv mjesta" className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Napomena (opcionalno)</label>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className={inputClass} />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
              Odustani
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Sprema..." : isEdit ? "Spremi" : "Kreiraj"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
