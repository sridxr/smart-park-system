import { Clock3, Gauge, Route, UserCircle2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import AIInsights from "../../components/mobility/AIInsights";
import ProfileSettingsCard from "../../components/profile/ProfileSettingsCard";
import VehicleProfileForm from "../../components/vehicles/VehicleProfileForm";
import { useAuth } from "../../context/AuthContext";
import vehicleIntelligenceService from "../../services/vehicleIntelligenceService";

function UserProfilePage() {
  const { user } = useAuth();
  const workspace = useOutletContext();
  const preferredPriceRange = workspace.behaviorSummary.preferredPriceRange || { min: 0, max: 0 };
  const [vehicleCatalog, setVehicleCatalog] = useState({
    rows: [],
    types: ["car", "bike", "suv", "ev"],
    brandsByType: {},
    modelsByTypeBrand: {},
  });
  const [vehicleForm, setVehicleForm] = useState({
    label: "",
    type: "car",
    brand: "",
    model: "",
    number: "",
  });
  const [savedLocationForm, setSavedLocationForm] = useState({
    label: "",
    fullText: "",
    lat: "",
    lng: "",
  });

  useEffect(() => {
    void vehicleIntelligenceService
      .getMaster()
      .then((response) => {
        setVehicleCatalog(response.data);
      })
      .catch(() => {});
  }, []);

  const updateVehicleForm = (key, nextValue) => {
    setVehicleForm((current) => {
      if (key === "type") {
        return {
          ...current,
          type: nextValue,
          brand: "",
          model: "",
        };
      }

      if (key === "brand") {
        return {
          ...current,
          brand: nextValue,
          model: "",
        };
      }

      return {
        ...current,
        [key]: nextValue,
      };
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <UserCircle2 className="text-emerald-200" />
          <div>
            <h3 className="text-2xl font-semibold text-white">{user?.name}</h3>
            <p className="text-sm text-white/55">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-white/40">Role</p>
            <p className="mt-2 text-white">{user?.role}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-white/40">Favorite parkings</p>
            <p className="mt-2 text-white">{workspace.favoriteIds.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-white/40">Tracked searches</p>
            <p className="mt-2 text-white">{workspace.behaviorSummary.searches?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-white/40">Booking pattern</p>
            <p className="mt-2 text-white">
              {workspace.topBookingHours[0]
                ? `${String(workspace.topBookingHours[0].hour).padStart(2, "0")}:00 peak activity`
                : "Collecting activity"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Route className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Personalization insights</h3>
              <p className="text-sm text-white/55">The areas and behaviors informing your recommendation model</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {workspace.preferredAreas.map((area) => (
              <span key={area} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-100">
                {area}
              </span>
            ))}
            {!workspace.preferredAreas.length ? (
              <span className="text-sm text-white/55">Explore more locations to train personalization.</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Price and search profile</h3>
              <p className="text-sm text-white/55">How your budget and discovery behavior shape AI output</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Preferred price range</p>
              <p className="mt-2 text-white">
                {preferredPriceRange.max
                  ? `Rs. ${preferredPriceRange.min} - Rs. ${preferredPriceRange.max}`
                  : "No budget pattern yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Recent searches</p>
              <div className="mt-2 space-y-2">
                {(workspace.behaviorSummary.searches || []).slice(0, 3).map((search, index) => (
                  <p key={`${search.fullText}-${index}`} className="text-sm text-white/65">
                    {search.fullText || search.area || "Current location"} | {search.carType} | Rs. {search.maxPrice || "Any"}
                  </p>
                ))}
                {!workspace.behaviorSummary.searches?.length ? (
                  <p className="text-sm text-white/50">Search history will appear here once discovery is used.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Gauge className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Recommended for you</h3>
              <p className="text-sm text-white/55">Current high-confidence suggestions from your activity profile</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {workspace.personalizedRecommendations.map((parking) => (
              <div key={parking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="font-medium text-white">{parking.title}</p>
                <p className="mt-2 text-sm text-white/60">
                  {parking.address?.area} | Smart Score {parking.ai?.recommendationScore || 0}/100
                </p>
              </div>
            ))}
            {!workspace.personalizedRecommendations.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/55">
                Personal recommendations will appear after a bit more activity.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Clock3 className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Activity timeline</h3>
              <p className="text-sm text-white/55">A rolling history of search, booking, and preference actions</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {workspace.timelinePreview.map((item) => (
              <div key={item._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{item.description || item.action}</p>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/45">{item.action}</span>
                </div>
                <p className="mt-2 text-sm text-white/55">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {!workspace.timelinePreview.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/50">
                Your timeline will start filling as you search, save, and confirm bookings.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Vehicles</h3>
              <p className="text-sm text-white/55">Store exact vehicle profiles so SmartPark AI can recommend compatibility-aware parking.</p>
            </div>
          </div>
          <div className="mt-4">
            <VehicleProfileForm
              catalog={vehicleCatalog}
              value={vehicleForm}
              onChange={updateVehicleForm}
              onSubmit={() => {
                void workspace.addVehicle(vehicleForm);
                setVehicleForm({ label: "", type: "car", brand: "", model: "", number: "" });
              }}
              submitLabel="Add vehicle"
            />
          </div>
          <div className="mt-4 space-y-3">
            {workspace.vehicles.map((vehicle) => (
              <div key={vehicle._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{vehicle.label}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || vehicle.type || vehicle.vehicleType}
                      {vehicle.number ? ` | ${vehicle.number}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void workspace.removeVehicle(vehicle._id)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Route className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Saved locations</h3>
              <p className="text-sm text-white/55">Pin home, office, or favorite destinations for one-tap parking.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={savedLocationForm.label}
              onChange={(event) => setSavedLocationForm((current) => ({ ...current, label: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Label"
            />
            <input
              value={savedLocationForm.fullText}
              onChange={(event) => setSavedLocationForm((current) => ({ ...current, fullText: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Full address"
            />
            <input
              value={savedLocationForm.lat}
              onChange={(event) => setSavedLocationForm((current) => ({ ...current, lat: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Latitude"
            />
            <input
              value={savedLocationForm.lng}
              onChange={(event) => setSavedLocationForm((current) => ({ ...current, lng: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
              placeholder="Longitude"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void workspace.addSavedLocation({
                label: savedLocationForm.label,
                fullText: savedLocationForm.fullText,
                location: {
                  lat: Number(savedLocationForm.lat),
                  lng: Number(savedLocationForm.lng),
                },
              });
              setSavedLocationForm({ label: "", fullText: "", lat: "", lng: "" });
            }}
            className="app-button-primary mt-4 rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            Save location
          </button>
          <div className="mt-4 space-y-3">
            {workspace.savedLocations.map((location) => (
              <div key={location._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{location.label}</p>
                    <p className="mt-1 text-sm text-white/60">{location.fullText || `${location.location?.lat}, ${location.location?.lng}`}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void workspace.removeSavedLocation(location._id)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AIInsights
          title="Mobility intelligence"
          subtitle="Context-aware automation from your saved places, traffic, and trip history."
          items={[
            workspace.mobilityInsights.oneTapRecommendation
              ? `One-tap pick: ${workspace.mobilityInsights.oneTapRecommendation.parking.title}`
              : "No one-tap destination selected yet.",
            workspace.mobilityInsights.demandForecast?.message || "Demand forecast is warming up.",
            workspace.mobilityInsights.trafficSummary?.explanation || "Traffic-aware planning activates when live route data is available.",
            workspace.mobilityInsights.trustScore ? `Trust Score: ${workspace.mobilityInsights.trustScore}/100` : "Trust scoring is collecting usage data.",
          ]}
          ctaLabel="One-tap parking"
          onCta={workspace.runOneTapParking}
        />

        <ProfileSettingsCard />
      </div>
    </div>
  );
}

export default UserProfilePage;
