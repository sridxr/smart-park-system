import { Filter, MapPinned, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import DecisionReplay from "../../components/ai/DecisionReplay";
import SimulationPanel from "../../components/ai/SimulationPanel";
import StrategySelector from "../../components/ai/StrategySelector";
import MapPanel from "../../components/MapPanel";
import ParkingCard from "../../components/ParkingCard";
import DetailDrawer from "../../components/ui/DetailDrawer";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import SkeletonPanel from "../../components/ui/SkeletonPanel";

function UserExplorePage() {
  const workspace = useOutletContext();
  const [detailParkingId, setDetailParkingId] = useState("");

  const selectedParking = useMemo(
    () => workspace.parkings.find((parking) => parking._id === detailParkingId) || null,
    [detailParkingId, workspace.parkings]
  );

  const openParkingDetails = (parkingId) => {
    setDetailParkingId(parkingId);
    workspace.setDecisionReplayTargetId(parkingId);
    void workspace.refreshDecisionReplay(parkingId);
  };

  if (workspace.loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr_0.5fr]">
        <SkeletonPanel className="h-[740px]" />
        <SkeletonPanel className="h-[740px]" />
        <SkeletonPanel className="h-[740px]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <StrategySelector
          options={workspace.strategyModes}
          value={workspace.strategyMode}
          onChange={workspace.setStrategyMode}
        />

        <div className="grid gap-6 xl:grid-cols-[0.32fr_0.68fr_0.5fr]">
        <aside className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Filter className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Filters</h3>
              <p className="text-sm text-white/55">Tune discovery without cluttering the main map</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <select
              value={workspace.carType}
              onChange={(event) => workspace.setCarType(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm"
            >
              <option value="hatchback">Hatchback</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
            </select>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">Price</label>
              <input
                type="range"
                min="50"
                max="1000"
                value={workspace.maxPrice}
                onChange={(event) => workspace.setMaxPrice(Number(event.target.value))}
                className="mt-3 w-full"
              />
              <p className="mt-2 text-sm text-white/70">Up to Rs. {workspace.maxPrice}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">Distance</label>
              <input
                type="range"
                min="1"
                max="25"
                value={workspace.maxDistance}
                onChange={(event) => workspace.setMaxDistance(Number(event.target.value))}
                className="mt-3 w-full"
              />
              <p className="mt-2 text-sm text-white/70">{workspace.maxDistance} km</p>
            </div>
          </div>
          <div className="mt-5">
            <SimulationPanel
              simulation={workspace.decisionSimulation}
              minutesOffset={workspace.simulationOffset}
              onOffsetChange={workspace.setSimulationOffset}
              onApply={workspace.applySimulationRecommendation}
            />
          </div>
        </aside>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MapPinned className="text-emerald-200" />
              <div>
                <h3 className="text-xl font-semibold text-white">Explore the live network</h3>
                <p className="text-sm text-white/55">{workspace.location.fullText || "Your current location"}</p>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65">
              {workspace.parkings.length} parkings
            </div>
          </div>
          <div className="mt-5">
            <MapPanel
              markers={workspace.parkings}
              interactive
              selectedLocation={workspace.location}
              onLocationChange={workspace.setLocation}
              onMarkerSelect={(marker) => openParkingDetails(marker?._id || "")}
              height="680px"
              showHeatmap
              showLegend
              previewEnabled
              activeMarkerId={detailParkingId}
            />
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Parking list</h3>
              <p className="text-sm text-white/55">Scroll ranked matches and open details in a side panel</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {workspace.sortedRecommendations.length ? (
              workspace.sortedRecommendations.map((parking) => (
                <div key={parking._id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openParkingDetails(parking._id)}
                    className="app-hover-lift w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70"
                  >
                    Preview details for {parking.title}
                  </button>
                  <ParkingCard
                    parking={parking}
                    bookingId={workspace.bookingId}
                    isFavorite={workspace.favoriteIds.includes(parking._id)}
                    onFavorite={() => workspace.handleFavorite(parking._id)}
                    onBook={() => workspace.openCheckout(parking)}
                  />
                </div>
              ))
            ) : (
              <EmptyStateCard
                eyebrow="Explore"
                title="No parkings match this filter set"
                description="Try widening your price or distance range, switch the vehicle type, or move the map to a new area."
                actionLabel="Reset Nearby Search"
                onAction={() => {
                  workspace.setMaxPrice(500);
                  workspace.setMaxDistance(10);
                }}
                icon={<SlidersHorizontal size={18} />}
              />
            )}
          </div>
        </section>
      </div>
      </div>

      <DetailDrawer
        isOpen={Boolean(selectedParking)}
        title={selectedParking?.title || ""}
        subtitle={selectedParking ? `${selectedParking.address?.area}, ${selectedParking.address?.district}` : ""}
        onClose={() => setDetailParkingId("")}
        width="max-w-lg"
      >
        {selectedParking ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">Smart Score</p>
                <p className="mt-2 text-white">{selectedParking.ai?.recommendationScore || 0}/100</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">Price</p>
                <p className="mt-2 text-white">Rs. {selectedParking.dynamicPrice || selectedParking.fare}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">Availability</p>
                <p className="mt-2 text-white">{selectedParking.availableSlots}/{selectedParking.totalSlots}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">Car Fit</p>
                <p className="mt-2 text-white">{selectedParking.ai?.carFit}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">ETA</p>
                <p className="mt-2 text-white">{selectedParking.ai?.traffic?.eta || "Live"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/40">Traffic Delay</p>
                <p className="mt-2 text-white">{selectedParking.ai?.traffic?.trafficDelay || "+0 min"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              {selectedParking.ai?.explanation}
            </div>
            {selectedParking.ai?.vehicleCompatibility?.applies ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-white/75">
                <p className="font-medium text-white">{selectedParking.ai.vehicleCompatibility.label}</p>
                <p className="mt-2">{selectedParking.ai.vehicleCompatibility.summary}</p>
              </div>
            ) : null}
            <div className="rounded-2xl border border-sky-400/15 bg-sky-500/[0.06] p-4 text-sm text-white/75">
              <p className="font-medium text-white">Recommended Parking</p>
              <ul className="mt-3 space-y-2">
                <li>Closest access: {selectedParking.ai?.distanceKm ?? "Nearby"} km</li>
                <li>Cheapest live rate: Rs. {selectedParking.dynamicPrice || selectedParking.fare}</li>
                <li>Low traffic signal: {selectedParking.ai?.demandLevel || selectedParking.demandLevel}</li>
                <li>Route quality: {selectedParking.ai?.traffic?.routeQuality || "Balanced"}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              {selectedParking.ai?.traffic?.routeSummary || selectedParking.ai?.predictiveAvailability}
            </div>
            <DecisionReplay
              replay={workspace.decisionReplay}
              loading={workspace.decisionReplay.loading}
              onRefresh={() => workspace.refreshDecisionReplay(selectedParking._id)}
            />
            <button
              type="button"
              onClick={() => workspace.openCheckout(selectedParking)}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Pay & Book
            </button>
          </div>
        ) : null}
      </DetailDrawer>
    </>
  );
}

export default UserExplorePage;
