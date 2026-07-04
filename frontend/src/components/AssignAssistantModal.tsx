import { useState, useEffect } from "react";
import api from "../api/axios";

interface Assistant {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Props {
  planId: number;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignAssistantModal({ planId, onClose, onAssigned }: Props) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/accounts/users/?role=assistant").then(({ data }) => {
      setAssistants(data.results ?? data);
    });
  }, []);

  async function handleAssign() {
    if (!selectedId) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/peer-support/plans/${planId}/`, {
        status: "active",
        assistant: Number(selectedId),
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Greška pri dodjeli asistenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-assistant-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 id="assign-assistant-title" className="font-semibold text-gray-800">
            Dodijeli asistenta
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
            aria-label="Zatvori modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="assistant-select" className="block text-xs font-medium text-gray-700 mb-1">
              Odaberi asistenta *
            </label>
            <select
              id="assistant-select"
              value={selectedId}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Odaberi asistenta —</option>
              {assistants.map((a) => (
                <option key={a.user_id} value={a.user_id}>
                  {a.first_name} {a.last_name} ({a.email})
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p role="alert" className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Odustani
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedId || saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {saving ? "Dodjeljujem..." : "Dodijeli"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
