function takeRows(rows, limit = 6) {
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

function buildUserSearchItems(context) {
  const parkings = takeRows(context?.parkings).map((parking) => ({
    id: `parking_${parking._id}`,
    label: parking.title,
    helper: parking.address?.area ? `Parking · ${parking.address.area}` : "Parking",
    to: "/user/explore",
    keywords: [
      parking.address?.area,
      parking.address?.district,
      parking.ai?.tag,
      parking.ai?.explanation,
    ],
  }));

  const bookings = takeRows(context?.bookings).map((booking) => ({
    id: `booking_${booking._id}`,
    label: booking.parkingTitle || "Booking",
    helper: booking.status ? `Booking · ${booking.status}` : "Booking",
    to: "/user/bookings",
    keywords: [booking.assignedSlotCode, booking.status],
  }));

  return [...parkings, ...bookings];
}

function buildLenderSearchItems(context) {
  const listings = takeRows(context?.listings).map((listing) => ({
    id: `listing_${listing._id}`,
    label: listing.title,
    helper: listing.address?.area ? `Listing · ${listing.address.area}` : "Listing",
    to: "/lender/parkings",
    keywords: [listing.address?.district, listing.status],
  }));

  const bookings = takeRows(context?.bookings).map((booking) => ({
    id: `lender_booking_${booking._id}`,
    label: booking.parkingTitle || "Booking",
    helper: booking.status ? `Reservation · ${booking.status}` : "Reservation",
    to: "/lender/bookings",
    keywords: [booking.userId?.name, booking.userId?.email],
  }));

  return [...listings, ...bookings];
}

function buildAdminSearchItems(context) {
  const users = takeRows(context?.users).map((user) => ({
    id: `user_${user._id}`,
    label: user.name || user.email,
    helper: user.role ? `User · ${user.role}` : "User",
    to: "/admin/users",
    keywords: [user.email, user.status],
  }));

  const parkings = takeRows(context?.parkings).map((parking) => ({
    id: `admin_parking_${parking._id}`,
    label: parking.title,
    helper: parking.address?.area ? `Parking · ${parking.address.area}` : "Parking",
    to: "/admin/parkings",
    keywords: [parking.address?.district, parking.demandLevel],
  }));

  const alerts = takeRows(context?.fraudLogs).map((log) => ({
    id: `fraud_${log._id}`,
    label: log.user?.name || log.email || "Fraud alert",
    helper: log.severity ? `Alert · ${log.severity}` : "Alert",
    to: "/admin/alerts",
    keywords: [log.message, log.type],
  }));

  return [...users, ...parkings, ...alerts];
}

export function buildWorkspaceSearchItems(role, context) {
  if (role === "lender") {
    return buildLenderSearchItems(context);
  }

  if (role === "admin") {
    return buildAdminSearchItems(context);
  }

  return buildUserSearchItems(context);
}
