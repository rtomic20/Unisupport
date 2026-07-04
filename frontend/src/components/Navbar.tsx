import { Link, useLocation, useNavigate } from "react-router-dom";
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
    { label: "Prijevoz", to: "/student/transport" },
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

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  student: "Student",
  driver: "Vozač",
  caregiver: "Njegovatelj",
  assistant: "Asistent",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = roleLinks[user.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* Skip to main content — visible only on keyboard focus */}
      <a href="#main-content" className="skip-link">
        Preskoči na sadržaj
      </a>

      <nav className="bg-white border-b border-gray-200 shadow-sm" aria-label="Glavna navigacija">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="font-bold text-blue-600 mr-3 text-lg shrink-0" aria-label="Unisupport - početna stranica">
              Unisupport
            </span>
            {links.map((l) => {
              const isActive = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? "text-blue-700 bg-blue-50 font-medium"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user.first_name} {user.last_name}
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                {roleLabels[user.role] ?? user.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-2 py-1"
              aria-label="Odjava iz sustava"
            >
              Odjava
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
