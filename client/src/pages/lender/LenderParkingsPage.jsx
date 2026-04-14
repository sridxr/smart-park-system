import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import DetailDrawer from "../../components/ui/DetailDrawer";
import MapPanel from "../../components/MapPanel";
import SlotGrid from "../../components/SlotGrid";
import ParkingVehicleSupportEditor from "../../components/vehicles/ParkingVehicleSupportEditor";
import vehicleIntelligenceService from "../../services/vehicleIntelligenceService";

function LenderParkingsPage() {
  const workspace = useOutletContext();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [vehicleCatalog, setVehicleCatalog] = useState({
    rows: [],
    types: ["car", "bike", "suv", "ev"],
    brandsByType: {},
    modelsByTypeBrand: {},
  });

  useEffect(() => {
    void vehicleIntelligenceService
      .getLenderSupport()
      .then((response) => {
        setVehicleCatalog(response.data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-300/70">Inventory</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Manage parkings</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                workspace.resetEditor();
                setIsEditorOpen(true);
              }}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            >
              <PlusCircle className="mr-2 inline-block" size={16} />
              Add Parking
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {workspace.listings.map((listing) => (
              <button
                key={listing._id}
                type="button"
                onClick={() => {
                  workspace.setSelectedListingId(listing._id);
                  workspace.loadListingIntoEditor(listing);
                  setIsEditorOpen(true);
                }}
                className={`block w-full rounded-2xl border bg-slate-950/70 p-4 text-left ${
                  workspace.selectedListingId === listing._id ? "border-sky-300/30" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{listing.title}</p>
                    <p className="mt-2 text-sm text-white/55">
                      {listing.address?.area}, {listing.address?.district}
                    </p>
                  </div>
                  <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs text-sky-100">
                    {listing.availableSlots}/{listing.totalSlots}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
            <h3 className="text-xl font-semibold text-white">Selected parking snapshot</h3>
            {workspace.selectedListing ? (
              <div className="mt-4">
                <MapPanel markers={[workspace.selectedListing]} height="320px" />
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/70 p-4 text-sm text-white/55">
                Select a parking to inspect its operating view.
              </div>
            )}
          </div>

          {workspace.selectedListing?.slotLayout?.slots?.length ? (
            <SlotGrid
              slotLayout={workspace.selectedListing.slotLayout}
              title={`Slot grid | ${workspace.selectedListing.title}`}
              helper="Slot-level visibility without leaving the page"
            />
          ) : null}
        </div>
      </div>

      <DetailDrawer
        isOpen={isEditorOpen}
        title={workspace.editingListingId ? "Edit parking" : "Add parking"}
        subtitle="This drawer keeps inventory editing out of the main list view."
        onClose={() => setIsEditorOpen(false)}
        width="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Title" value={workspace.form.title} onChange={(event) => workspace.handleChange("title", event.target.value)} />
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Description" value={workspace.form.description} onChange={(event) => workspace.handleChange("description", event.target.value)} />
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Area" value={workspace.form.address.area} onChange={(event) => workspace.handleNestedChange("address", "area", event.target.value)} />
            <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="District" value={workspace.form.address.district} onChange={(event) => workspace.handleNestedChange("address", "district", event.target.value)} />
            <input type="number" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Fare" value={workspace.form.fare} onChange={(event) => workspace.handleChange("fare", Number(event.target.value))} />
            <input type="number" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Price per hour" value={workspace.form.pricePerHour} onChange={(event) => workspace.handleChange("pricePerHour", Number(event.target.value))} />
            <input type="number" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Total slots" value={workspace.form.totalSlots} onChange={(event) => workspace.handleChange("totalSlots", Number(event.target.value))} />
            <input type="time" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Open time" value={workspace.form.availabilityHours.openTime} onChange={(event) => workspace.handleNestedChange("availabilityHours", "openTime", event.target.value)} />
            <input type="time" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Close time" value={workspace.form.availabilityHours.closeTime} onChange={(event) => workspace.handleNestedChange("availabilityHours", "closeTime", event.target.value)} />
          </div>
          <MapPanel
            interactive
            selectedLocation={{ ...workspace.form.location, fullText: workspace.form.address.fullText }}
            onLocationChange={workspace.handleLocationChange}
            height="260px"
          />
          <ParkingVehicleSupportEditor
            catalog={vehicleCatalog}
            values={workspace.form}
            onToggle={workspace.toggleArrayValue}
          />
          <button
            type="button"
            onClick={workspace.saveListing}
            disabled={workspace.saving}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {workspace.saving ? "Saving..." : workspace.editingListingId ? "Save Changes" : "Create Parking"}
          </button>
        </div>
      </DetailDrawer>
    </>
  );
}

export default LenderParkingsPage;
