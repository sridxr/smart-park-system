import { LayoutDashboard, MapPin, Wallet, LogOut } from "lucide-react";

function Sidebar({ onLogout }) {
  return (
    <div className="w-64 bg-blue-950/40 border-r border-blue-400/20 min-h-screen p-5">
      <h2 className="text-2xl font-bold text-blue-300 mb-8">
        Smart Parking
      </h2>

      <div className="space-y-4 text-white/80">
        <div className="flex items-center gap-2 p-2 rounded hover:bg-blue-500/20 cursor-pointer">
          <LayoutDashboard size={18} />
          Dashboard
        </div>

        <div className="flex items-center gap-2 p-2 rounded hover:bg-blue-500/20 cursor-pointer">
          <MapPin size={18} />
          Parking Listings
        </div>

        <div className="flex items-center gap-2 p-2 rounded hover:bg-blue-500/20 cursor-pointer">
          <Wallet size={18} />
          Revenue
        </div>
      </div>

      <button
        onClick={onLogout}
        className="mt-10 w-full bg-red-500 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
}

export default Sidebar;
