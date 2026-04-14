function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateLiveBilling({ startTime, endTime, pricePerHour = 0 }) {
  if (!startTime) {
    return {
      durationMinutes: 0,
      durationHours: 0,
      totalPrice: 0,
    };
  }

  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMinutes = Math.max(0, Math.round((end - start) / 60000));
  const durationHours = roundCurrency(durationMinutes / 60);

  return {
    durationMinutes,
    durationHours,
    totalPrice: roundCurrency(durationHours * Number(pricePerHour || 0)),
  };
}

module.exports = {
  calculateLiveBilling,
};
