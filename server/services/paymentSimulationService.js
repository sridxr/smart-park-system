const SIMULATED_GATEWAY_NAME = "SmartPark Checkout";

function createSimulationId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSimulatedOrder({ user, parking, amount }) {
  const numericAmount = Number(amount) || 0;

  return {
    id: createSimulationId("order"),
    entity: "order",
    amount: Math.round(numericAmount * 100),
    amountDisplay: numericAmount,
    currency: "INR",
    receipt: `smartpark_sim_${parking._id}_${Date.now()}`,
    gateway: SIMULATED_GATEWAY_NAME,
    createdAt: new Date().toISOString(),
    notes: {
      email: user.email,
      parkingTitle: parking.title,
    },
  };
}

function buildSimulatedPayment({ orderId = "" } = {}) {
  return {
    paymentId: createSimulationId("pay"),
    orderId: orderId || createSimulationId("order"),
    signature: createSimulationId("sig"),
    captured: true,
    gateway: SIMULATED_GATEWAY_NAME,
  };
}

module.exports = {
  SIMULATED_GATEWAY_NAME,
  buildSimulatedOrder,
  buildSimulatedPayment,
};
