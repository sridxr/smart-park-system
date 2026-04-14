import { useOutletContext } from "react-router-dom";

function LenderBookingsPage() {
  const workspace = useOutletContext();

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-2xl font-semibold text-white">Lender bookings</h3>
        <input
          type="date"
          value={workspace.bookingDateFilter}
          onChange={(event) => workspace.setBookingDateFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
        />
      </div>
      <div className="mt-5 space-y-3">
        {workspace.bookings.map((booking) => (
          <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{booking.parkingTitle}</p>
                <p className="mt-2 text-sm text-white/55">
                  {booking.startTime
                    ? `${new Date(booking.startTime).toLocaleString("en-IN")} - ${new Date(booking.endTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                    : new Date(booking.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right text-sm text-white/70">
                <p>Rs. {booking.amount}</p>
                <p className="mt-1">{booking.status}{booking.duration ? ` | ${booking.duration}h` : ""}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LenderBookingsPage;
