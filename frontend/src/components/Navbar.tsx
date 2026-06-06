import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const roleLinks: Record<string, { label: string; to: string }[]> = {
  admin: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Zahtjevi", to: "/admin/requests" },
    { label: "Prijevoz", to: "/admin/transport" },
    { label: "Njega u domu", to: "/admin/home-care" },
    { label: "Vršnjačka podrška", to: "/admin/peer-support" },
    { label: "Ankete", to: "/admin/surveys" },
    { label: "Korisnici", to: "/admin/users" },
    { label: "Uloge", to: "/admin/roles" },
    { label: "Izvještaji", to: "/admin/reports" },
  ],
  student: [
    { label: "Moji zahtjevi", to: "/student/dashboard" },
    { label: "Novi zahtjev", to: "/student/new-request" },
    { label: "Njega u domu", to: "/student/appointments" },
    { label: "Vršnjačka podrška", to: "/student/support-plans" },
    { label: "Ankete", to: "/student/surveys" },
  ],
  driver: [
    { label: "Dostupne vožnje", to: "/driver/dashboard" },
    { label: "Moje vožnje", to: "/driver/my-rides" },
  ],
  caregiver: [
    { label: "Dashboard", to: "/caregiver/dashboard" },
    { label: "Moj raspored", to: "/caregiver/schedule" },
  ],
  assistant: [
    { label: "Dashboard", to: "/assistant/dashboard" },
    { label: "Moji planovi", to: "/assistant/plans" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const links = roleLinks[user.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-blue-600 mr-4 text-lg">Unisupport</span>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user.first_name} {user.last_name}
            <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              {user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Odjava
          </button>
        </div>
      </div>
    </nav>
  );
}
