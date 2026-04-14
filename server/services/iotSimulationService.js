const { ensureSlotLayout } = require("./slotManagementService");

function buildSeed(input = "") {
  return String(input)
    .split("")
    .reduce((accumulator, character, index) => accumulator + character.charCodeAt(0) * (index + 3), 0);
}

function getSensorStatus(seed, occupied) {
  const bucket = seed % 100;

  if (!occupied && bucket < 8) {
    return "offline";
  }

  if (bucket < 22) {
    return "syncing";
  }

  return "online";
}

function decorateParkingWithSensors(parking) {
  if (!parking) {
    return parking;
  }

  const slotLayout = ensureSlotLayout(parking);
  const timeBucket = Math.floor(Date.now() / (60 * 1000));
  const slots = slotLayout.slots.map((slot) => {
    const occupied = slot.status === "occupied" || Boolean(slot.occupied);
    const sensorStatus = getSensorStatus(
      buildSeed(`${parking._id || parking.id || parking.title}-${slot.code}-${timeBucket}`),
      occupied
    );

    return {
      ...slot,
      occupied,
      sensorStatus,
      sensorUpdatedAt: slot.sensorUpdatedAt || new Date(),
    };
  });

  const sensorSummary = slots.reduce(
    (accumulator, slot) => {
      accumulator.total += 1;
      accumulator[slot.sensorStatus] += 1;
      if (slot.occupied) {
        accumulator.occupied += 1;
      }
      return accumulator;
    },
    { total: 0, online: 0, syncing: 0, offline: 0, occupied: 0 }
  );

  return {
    ...parking,
    slotLayout: {
      ...slotLayout,
      slots,
    },
    sensorStatus: sensorSummary,
  };
}

function decorateParkingCollectionWithSensors(parkings = []) {
  return parkings.map((parking) => decorateParkingWithSensors(parking));
}

module.exports = {
  decorateParkingCollectionWithSensors,
  decorateParkingWithSensors,
};
