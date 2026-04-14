function formatDayLabel(date) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function buildDailySeries(rows = [], getValue, days = 7) {
  const series = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  for (let index = 0; index < days; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    series.push({
      key: current.toISOString().slice(0, 10),
      label: formatDayLabel(current),
      value: 0,
    });
  }

  rows.forEach((row) => {
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = date.toISOString().slice(0, 10);
    const bucket = series.find((entry) => entry.key === key);
    if (bucket) {
      bucket.value += getValue(row);
    }
  });

  return series.map(({ key, ...entry }) => entry);
}

function buildRoleDistribution(users = []) {
  const counts = users.reduce(
    (accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] || 0) + 1;
      return accumulator;
    },
    { user: 0, lender: 0, admin: 0 }
  );

  return Object.entries(counts).map(([role, value]) => ({
    name: role,
    value,
  }));
}

function buildDemandZones(bookings = []) {
  const grouped = bookings.reduce((accumulator, booking) => {
    const key = booking.parkingTitle || "Unknown";

    if (!accumulator[key]) {
      accumulator[key] = {
        location: key,
        bookings: 0,
        revenue: 0,
      };
    }

    accumulator[key].bookings += 1;
    accumulator[key].revenue += booking.amount || 0;
    return accumulator;
  }, {});

  return Object.values(grouped)
    .sort((left, right) => right.bookings - left.bookings)
    .slice(0, 6);
}

function buildAdminDecisionInsights({
  totalUsers = 0,
  totalBookings = 0,
  totalParkings = 0,
  revenue = 0,
  busiestLocations = [],
  peakHours = [],
  roleDistribution = [],
}) {
  const userShare =
    roleDistribution.find((entry) => entry.name === "user")?.value || 0;
  const lenderShare =
    roleDistribution.find((entry) => entry.name === "lender")?.value || 0;
  const inventoryPressure = totalParkings
    ? Math.round((totalBookings / totalParkings) * 10) / 10
    : 0;
  const insights = [];

  if (busiestLocations[0]) {
    insights.push(
      `${busiestLocations[0].location} is the hottest zone right now. Consider increasing supply or surge pricing support there.`
    );
  }

  if (peakHours.length) {
    insights.push(
      `Peak demand is clustering around ${peakHours
        .map((hour) => `${hour}:00`)
        .join(", ")}. Queue lender alerts before those windows.`
    );
  }

  if (inventoryPressure >= 1.5) {
    insights.push(
      "Booking velocity is outpacing inventory growth. Review new lender acquisition and slot expansion."
    );
  } else {
    insights.push(
      "Supply is keeping pace with demand. Focus on conversion and repeat-booking retention."
    );
  }

  if (lenderShare > 0 && userShare / lenderShare >= 6) {
    insights.push(
      "User growth is significantly ahead of lender growth. Recruiting more lenders should improve recommendation quality."
    );
  }

  if (revenue > 0 && totalBookings > 0) {
    insights.push(
      `Average booking value is Rs. ${Math.round(
        revenue / totalBookings
      )}. Use this benchmark for campaign and pricing experiments.`
    );
  }

  if (!insights.length && totalUsers > 0) {
    insights.push(
      "Platform health is stable. Monitor engagement cohorts and keep the demand engine calibrated."
    );
  }

  return insights;
}

function buildSystemAlerts({ parkings = [], demandZones = [] }) {
  const highDemandParkings = parkings.filter(
    (parking) =>
      parking.demandLevel === "High" ||
      parking.liveMetrics?.occupancyRate >= 80 ||
      parking.availableSlots <= 2
  );
  const alerts = [];

  if (highDemandParkings.length) {
    alerts.push(
      `${highDemandParkings.length} parking assets are under high demand pressure or near full capacity.`
    );
  }

  if (demandZones[0]?.bookings >= 3) {
    alerts.push(
      `${demandZones[0].location} is showing repeated booking activity and may require admin review.`
    );
  }

  if (!alerts.length) {
    alerts.push("No critical system alerts right now. Network demand is balanced.");
  }

  return alerts;
}

function buildLenderInsights({ listings = [], bookings = [] }) {
  const averageOccupancy = listings.length
    ? Math.round(
        listings.reduce(
          (sum, listing) => sum + (listing.liveMetrics?.occupancyRate || 0),
          0
        ) / listings.length
      )
    : 0;
  const revenueSeries = buildDailySeries(bookings, (booking) => booking.amount || 0, 7);
  const bookingSeries = buildDailySeries(bookings, () => 1, 7);
  const strongestLocation = buildDemandZones(bookings)[0];
  const insights = [];

  if (averageOccupancy >= 80) {
    insights.push("Portfolio occupancy is very strong. Surge pricing can be safely tested.");
  } else if (averageOccupancy >= 55) {
    insights.push("Occupancy is healthy. Small premium adjustments may improve yield.");
  } else {
    insights.push("Occupancy is soft. Promotions or lower entry pricing can increase utilization.");
  }

  if (strongestLocation) {
    insights.push(
      `${strongestLocation.location} is your strongest booking zone. Protect availability there during peak hours.`
    );
  }

  const recentRevenue = revenueSeries.reduce((sum, entry) => sum + entry.value, 0);
  if (recentRevenue > 0) {
    insights.push(
      `Last 7 days revenue reached Rs. ${recentRevenue}. Use the chart trend to spot strong weekdays.`
    );
  }

  return {
    insights,
    revenueSeries,
    bookingSeries,
  };
}

function getEstimatedBookingDurationMinutes(booking) {
  const start = booking?.parkingId?.timeSlot?.start
    ? new Date(booking.parkingId.timeSlot.start)
    : null;
  const end = booking?.parkingId?.timeSlot?.end
    ? new Date(booking.parkingId.timeSlot.end)
    : null;

  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    return Math.max(15, Math.round((end.getTime() - start.getTime()) / (60 * 1000)));
  }

  return 60;
}

function buildAdminAnalyticsSnapshot({ users = [], bookings = [], parkings = [] }) {
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const peakHours = buildDemandZones(
    bookings.map((booking) => ({
      parkingTitle: `${new Date(booking.createdAt).getHours()}:00`,
      amount: booking.amount || 0,
    }))
  )
    .map((entry) => Number.parseInt(String(entry.location).replace(":00", ""), 10))
    .filter((value) => !Number.isNaN(value))
    .slice(0, 4);

  const averageParkingDuration = bookings.length
    ? Math.round(
        bookings.reduce(
          (sum, booking) => sum + getEstimatedBookingDurationMinutes(booking),
          0
        ) / bookings.length
      )
    : 0;

  const conversionRate = users.length
    ? Number(((bookings.length / users.length) * 100).toFixed(1))
    : 0;

  const occupancyAverage = parkings.length
    ? Math.round(
        parkings.reduce(
          (sum, parking) => sum + (parking.liveMetrics?.occupancyRate || 0),
          0
        ) / parkings.length
      )
    : 0;

  return {
    totalRevenue,
    peakHours,
    averageParkingDuration,
    conversionRate,
    occupancyAverage,
  };
}

module.exports = {
  buildAdminAnalyticsSnapshot,
  buildAdminDecisionInsights,
  buildDailySeries,
  buildDemandZones,
  buildLenderInsights,
  buildRoleDistribution,
  buildSystemAlerts,
};
