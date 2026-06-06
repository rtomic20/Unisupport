import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Role { role_id: number; role_name: string; }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.get("/accounts/roles/").then(({ data }) => setRoles(data));
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setShowForm(true);
    setError("");
  }

  function openEdit(r: Role) {
    setEditing(r);
    setName(r.role_name);
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    setError("");
    try {
      if (editing) {
        await api.patch(`/accounts/roles/${editing.role_id}/`, { role_name: name });
      } else {
        await api.post("/accounts/roles/", { role_name: name });
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Greška"));
    }
  }

  async function handleDelete(r: Role) {
    if (!confirm(`Obriši ulogu "${r.role_name}"?`)) return;
    try {
      await api.delete(`/accounts/roles/${r.role_id}/`);
      load();
    } catch {
      alert("Nije moguće obrisati — uloga je u upotrebi.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Uloge</h1>
        <button onClick={openCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Nova uloga
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Naziv</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {roles.map((r) => (
              <tr key={r.role_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{r.role_id}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{r.role_name}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:underline">Uredi</button>
                  <button onClick={() => handleDelete(r)} className="text-xs text-red-500 hover:underline">Obriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold">{editing ? "Uredi ulogu" : "Nova uloga"}</h2>
            </div>
            <div className="p-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Naziv uloge"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Odustani</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Spremi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
