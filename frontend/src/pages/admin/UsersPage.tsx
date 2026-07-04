import { useEffect, useState } from "react";
import api from "../../api/axios";
import PasswordInput from "../../components/PasswordInput";
import RolesPage from "./RolesPage";

type UsersTab = "users" | "roles";

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_name: string;
  role_id: number;
  is_active: boolean;
}

interface Role {
  role_id: number;
  role_name: string;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UsersTab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role_id: "", password: "", is_active: true });
  const [error, setError] = useState("");

  function load() {
    api.get("/accounts/users/").then(({ data }) => setUsers(data));
    api.get("/accounts/roles/").then(({ data }) => setRoles(data));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", role_id: roles[0]?.role_id?.toString() || "", password: "", is_active: true });
    setShowForm(true);
    setError("");
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone, role_id: u.role_id.toString(), password: "", is_active: u.is_active });
    setShowForm(true);
    setError("");
  }

  async function handleSave() {
    setError("");
    const payload: any = { ...form, role_id: Number(form.role_id) };
    if (!payload.password) delete payload.password;
    try {
      if (editing) {
        await api.patch(`/accounts/users/${editing.user_id}/`, payload);
      } else {
        await api.post("/accounts/users/", payload);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(JSON.stringify(err.response?.data || "Greška"));
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Obriši korisnika ${u.email}?`)) return;
    await api.delete(`/accounts/users/${u.user_id}/`);
    load();
  }

  const tabs: { key: UsersTab; label: string }[] = [
    { key: "users", label: "Korisnici" },
    { key: "roles", label: "Uloge" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Korisnici</h1>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === t.key
                ? "bg-white border border-b-white border-gray-200 text-blue-700 -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "roles" && <RolesPage />}

      {activeTab === "users" && (<>
      <div className="flex items-center justify-between mb-6">
        <div />
        <button onClick={openCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Novi korisnik
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
              <th className="px-4 py-3">Ime i prezime</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Uloga</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-700">{u.first_name} {u.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{u.role_name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.is_active ? "Aktivan" : "Neaktivan"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(u)} className="text-xs text-blue-600 hover:underline">Uredi</button>
                  <button onClick={() => handleDelete(u)} className="text-xs text-red-500 hover:underline">Obriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </>)}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold">{editing ? "Uredi korisnika" : "Novi korisnik"}</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Ime" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Prezime" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefon (opcionalno)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={editing ? "Nova lozinka (ostavi prazno)" : "Lozinka"} />
              <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Aktivan korisnik
              </label>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
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
