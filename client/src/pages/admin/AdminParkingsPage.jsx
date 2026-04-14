import { useOutletContext } from "react-router-dom";

function AdminParkingsPage() {
  const workspace = useOutletContext();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {workspace.parkings.map((parking) => (
        <div key={parking._id} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-white">{parking.title}</h3>
              <p className="mt-2 text-sm text-white/55">
                {parking.address?.area}, {parking.address?.district}
              </p>
            </div>
            <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-100">
              {parking.demandLevel}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-950/70 p-3 text-white/70">
              <p className="text-white/40">Owner</p>
              <p className="mt-2 text-white">{parking.owner?.name || "Unknown"}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-3 text-white/70">
              <p className="text-white/40">Slots</p>
              <p className="mt-2 text-white">{parking.availableSlots}/{parking.totalSlots}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-3 text-white/70">
              <p className="text-white/40">Price</p>
              <p className="mt-2 text-white">Rs. {parking.dynamicPrice || parking.fare}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminParkingsPage;
