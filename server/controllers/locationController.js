const SavedLocation = require("../models/SavedLocation");

async function listSavedLocations(req, res) {
  const locations = await SavedLocation.find({ user: req.user._id }).sort({ isPinned: -1, createdAt: -1 });
  res.json(locations);
}

async function createSavedLocation(req, res) {
  if (req.body.isPinned) {
    await SavedLocation.updateMany({ user: req.user._id }, { isPinned: false });
  }

  const saved = await SavedLocation.create({
    user: req.user._id,
    label: req.body.label,
    fullText: req.body.fullText || "",
    location: {
      lat: Number(req.body.location?.lat),
      lng: Number(req.body.location?.lng),
    },
    isPinned: Boolean(req.body.isPinned),
  });

  res.status(201).json(saved);
}

async function removeSavedLocation(req, res) {
  await SavedLocation.findOneAndDelete({ _id: req.params.locationId, user: req.user._id });
  res.status(204).end();
}

module.exports = {
  createSavedLocation,
  listSavedLocations,
  removeSavedLocation,
};
