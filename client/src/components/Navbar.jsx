function Navbar({ title, onLogout, color }) {
  return (
    <div
      className={`w-full mb-6 p-4 rounded-xl backdrop-blur-md border border-white/20 flex justify-between items-center ${color}`}
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-white/60">
          Smart Parking • Live Availability
        </p>
      </div>

      <button
        onClick={onLogout}
        className="bg-red-500 px-4 py-2 rounded-lg hover:scale-105 transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;
