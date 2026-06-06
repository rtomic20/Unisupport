import { useEffect, useState } from "react";
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

const inputCls =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("transport");
  const [requests, setRequests] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Home care create form
  const [showCareForm, setShowCareForm] = useState(false);
  const [careForm, setCareForm] = useState({ appointment_date: "", start_time: "", end_time: "", location: "", description: "" });
  const [careError, setCareError] = useState("");
  const [careSaving, setCareSaving] = useState(false);

  // Peer support create form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ title: "", description: "", start_date: "", end_date: "", total_hours_planned: "" });
  const [planError, setPlanError] = useState("");
  const [planSaving, setPlanSaving] = useState(false);

  function loadAll() {
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
  }

  useEffect(() => { loadAll(); }, []);

  async function handleCreateCare() {
    setCareError("");
    if (!careForm.appointment_date || !careForm.start_time || !careForm.end_time) {
      setCareError("Datum i vrijeme su obavezni.");
      return;
    }
    setCareSaving(true);
    try {
      await api.post("/home-care/appointments/", {
        appointment_date: careForm.appointment_date,
        start_time: careForm.start_time,
        end_time: careForm.end_time,
        location: careForm.location,
        description: careForm.description,
      });
      setShowCareForm(false);
      setCareForm({ appointment_date: "", start_time: "", end_time: "", location: "", description: "" });
      loadAll();
    } catch (err: any) {
      setCareError(JSON.stringify(err.response?.data ?? "Greška."));
    } finally {
      setCareSaving(false);
    }
  }

  async function handleCreatePlan() {
    setPlanError("");
    if (!planForm.title || !planForm.start_date || !planForm.total_hours_planned) {
      setPlanError("Naslov, datum početka i broj sati su obavezni.");
      return;
    }
    setPlanSaving(true);
    try {
      await api.post("/peer-support/plans/", {
        title: planForm.title,
        description: planForm.description,
        start_date: planForm.start_date,
        end_date: planForm.end_date || null,
        total_hours_planned: Number(planForm.total_hours_planned),
      });
      setShowPlanForm(false);
      setPlanForm({ title: "", description: "", start_date: "", end_date: "", total_hours_planned: "" });
      loadAll();
    } catch (err: any) {
      setPlanError(JSON.stringify(err.response?.data ?? "Greška."));
    } finally {
      setPlanSaving(false);
    }
  }

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
        <p className="text-sm text-gray-500 mt-1">Pregled svih vaših zahtjeva po kategoriji.</p>
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
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── PRIJEVOZ TAB ─────────────────────────────── */}
      {activeTab === "transport" && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">Pregled vaših zahtjeva za prijevoz.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Datum</th>
                    <th className="px-4 py-3">Polazište → Odredište</th>
                    <th className="px-4 py-3">Dolazak do</th>
                    <th className="px-4 py-3">Vozač</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Nema zahtjeva za prijevoz.</td></tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.request_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{r.request_date}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {r.transport_details
                            ? <span>{r.transport_details.pickup_address} → {r.transport_details.dropoff_address}</span>
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(r.end_time)}</td>
                        <td className="px-4 py-3 text-gray-600">{r.accepted_by_name || "—"}</td>
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

      {/* ── NJEGA U DOMU TAB ─────────────────────────── */}
      {activeTab === "care" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Pregled i zahtjev za termine kućne njege.</p>
            </div>
            <button
              onClick={() => { setCareForm({ appointment_date: "", start_time: "", end_time: "", location: "", description: "" }); setCareError(""); setShowCareForm(true); }}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              + Zatraži termin njege
            </button>
          </div>

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
                  {appointments.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nema termina njege u domu.</td></tr>
                  ) : (
                    appointments.map((a) => (
                      <tr key={a.appointment_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{a.appointment_date}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatTime(a.start_time)} – {formatTime(a.end_time)}</td>
                        <td className="px-4 py-3 text-gray-600">{a.location || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{a.caregiver_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs">
                          {a.description ? <span className="italic text-xs">{a.description}</span> : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${CARE_STATUS_COLORS[a.status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
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

          {/* Care create modal */}
          {showCareForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Zatraži termin njege</h2>
                  <button onClick={() => setShowCareForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Datum *</label>
                    <input type="date" value={careForm.appointment_date}
                      onChange={(e) => setCareForm({ ...careForm, appointment_date: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Početak *</label>
                      <input type="time" value={careForm.start_time}
                        onChange={(e) => setCareForm({ ...careForm, start_time: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Kraj *</label>
                      <input type="time" value={careForm.end_time}
                        onChange={(e) => setCareForm({ ...careForm, end_time: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lokacija</label>
                    <input type="text" placeholder="npr. Dom studenta, soba 204"
                      value={careForm.location}
                      onChange={(e) => setCareForm({ ...careForm, location: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opis (opcionalno)</label>
                    <textarea rows={2} placeholder="Što vam treba..."
                      value={careForm.description}
                      onChange={(e) => setCareForm({ ...careForm, description: e.target.value })}
                      className={inputCls} />
                  </div>
                  {careError && <p className="text-red-600 text-sm">{careError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowCareForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Odustani</button>
                    <button onClick={handleCreateCare} disabled={careSaving}
                      className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                      {careSaving ? "Sprema..." : "Pošalji zahtjev"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VRŠNJAČKA PODRŠKA TAB ───────────────────── */}
      {activeTab === "plans" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Pregled vaših planova vršnjačke podrške i sesija s asistentom.</p>
            </div>
            <button
              onClick={() => { setPlanForm({ title: "", description: "", start_date: "", end_date: "", total_hours_planned: "" }); setPlanError(""); setShowPlanForm(true); }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Zatraži plan podrške
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Naziv plana</th>
                    <th className="px-4 py-3">Asistent</th>
                    <th className="px-4 py-3">Početak</th>
                    <th className="px-4 py-3">Kraj</th>
                    <th className="px-4 py-3 text-right">Plan. sati</th>
                    <th className="px-4 py-3 text-right">Odrađeno</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {plans.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Nema planova vršnjačke podrške.</td></tr>
                  ) : (
                    plans.map((p) => (
                      <tr key={p.plan_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                        <td className="px-4 py-3 text-gray-600">{p.assistant_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.start_date}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{p.end_date || "—"}</td>
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

          {/* Plan create modal */}
          {showPlanForm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Zatraži plan podrške</h2>
                  <button onClick={() => setShowPlanForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Naslov *</label>
                    <input type="text" placeholder="npr. Podrška pri kretanju"
                      value={planForm.title}
                      onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Opis</label>
                    <textarea rows={2} placeholder="Opišite vrstu podrške..."
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Datum početka *</label>
                      <input type="date" value={planForm.start_date}
                        onChange={(e) => setPlanForm({ ...planForm, start_date: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Datum završetka</label>
                      <input type="date" value={planForm.end_date}
                        onChange={(e) => setPlanForm({ ...planForm, end_date: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Planirani broj sati *</label>
                    <input type="number" min={1} placeholder="npr. 20"
                      value={planForm.total_hours_planned}
                      onChange={(e) => setPlanForm({ ...planForm, total_hours_planned: e.target.value })}
                      className={inputCls} />
                  </div>
                  {planError && <p className="text-red-600 text-sm">{planError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowPlanForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Odustani</button>
                    <button onClick={handleCreatePlan} disabled={planSaving}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {planSaving ? "Slanje..." : "Pošalji zahtjev"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
