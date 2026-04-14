function buildSlotLayout(totalSlots = 0) {
  const safeTotalSlots = Math.max(1, Number(totalSlots) || 1);
  const columns = safeTotalSlots >= 24 ? 6 : safeTotalSlots >= 12 ? 4 : 3;
  const rows = Math.ceil(safeTotalSlots / columns);
  const slots = [];

  for (let index = 0; index < safeTotalSlots; index += 1) {
    const row = Math.floor(index / columns) + 1;
    const column = (index % columns) + 1;

    slots.push({
      code: `S${String(row).padStart(2, "0")}-${String(column).padStart(2, "0")}`,
      status: "available",
      occupied: false,
      sensorStatus: "online",
      sensorUpdatedAt: new Date(),
      row,
      column,
    });
  }

  return {
    rows,
    columns,
    slots,
  };
}

function ensureSlotLayout(parking) {
  if (parking?.slotLayout?.slots?.length) {
    return parking.slotLayout;
  }

  return buildSlotLayout(parking?.totalSlots || 1);
}

function assignNextAvailableSlot(parking) {
  const slotLayout = ensureSlotLayout(parking);
  const slots = slotLayout.slots.map((slot) => ({ ...slot }));
  const nextSlotIndex = slots.findIndex((slot) => slot.status !== "occupied");

  if (nextSlotIndex === -1) {
    return {
      assignedSlotCode: null,
      slotLayout,
    };
  }

  slots[nextSlotIndex].status = "occupied";
  slots[nextSlotIndex].occupied = true;
  slots[nextSlotIndex].sensorStatus = "online";
  slots[nextSlotIndex].sensorUpdatedAt = new Date();

  return {
    assignedSlotCode: slots[nextSlotIndex].code,
    slotLayout: {
      ...slotLayout,
      slots,
    },
  };
}

function releaseAssignedSlot(parking, assignedSlotCode) {
  if (!assignedSlotCode) {
    return ensureSlotLayout(parking);
  }

  const slotLayout = ensureSlotLayout(parking);
  const slots = slotLayout.slots.map((slot) =>
    slot.code === assignedSlotCode
      ? {
          ...slot,
          status: "available",
          occupied: false,
          sensorStatus: "online",
          sensorUpdatedAt: new Date(),
        }
      : slot
  );

  return {
    ...slotLayout,
    slots,
  };
}

module.exports = {
  assignNextAvailableSlot,
  buildSlotLayout,
  ensureSlotLayout,
  releaseAssignedSlot,
};
