import { useState, useEffect } from "react";
import api from "../api/axios";

interface Driver {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Props {
  requestId: number;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignDriverModal({ requestId, onClose, onAssigned }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [pickupTime, setPickupTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/users/?role=driver").then(({ data }) => setDrivers(data));
  }, []);

  async function handleAssign() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      const body: any = { driver_id: selectedId };
      if (pickupTime) body.pickup_time = pickupTime;
      await api.post(`/requests/${requestId}/assign_driver/`, body);
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška pri dodjeli");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Dodijeli vozača</h2>
        </div>
        <div className="p-5 space-y-4">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Odaberi vozača —</option>
            {drivers.map((d) => (
              <option key={d.user_id} value={d.user_id}>
                {d.first_name} {d.last_name} ({d.email})
              </option>
            ))}
          </select>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Vrijeme preuzimanja (opcionalno)
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Odustani
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedId || saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Dodjeljujem..." : "Dodijeli"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
