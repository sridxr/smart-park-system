import { useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  CircleF,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";

const libraries = ["places"];
const defaultCenter = { lat: 13.0827, lng: 80.2707 };

function hasValidLocation(marker) {
  return Number.isFinite(Number(marker?.location?.lat)) && Number.isFinite(Number(marker?.location?.lng));
}

function getMarkerColor(marker) {
  return marker?.ai?.heatmapColor || marker?.heatmapColor || "#22c55e";
}

function getAvailabilityColor(marker) {
  const availableSlots = Number(marker?.availableSlots || 0);
  const totalSlots = Number(marker?.totalSlots || 0);

  if (availableSlots <= 0) {
    return "#ef4444";
  }

  if (totalSlots > 0 && availableSlots / totalSlots <= 0.3) {
    return "#f59e0b";
  }

  return "#22c55e";
}

function getHeatRadius(marker) {
  const intensity = marker?.ai?.heatmapIntensity || marker?.liveMetrics?.demandScore || 20;
  return 90 + intensity * 6;
}

function MapPanel({
  markers = [],
  interactive = false,
  selectedLocation,
  onLocationChange,
  height = "420px",
  showHeatmap = false,
  showLegend = false,
  previewEnabled = false,
  activeMarkerId = "",
  onMarkerSelect,
}) {
  const [autocomplete, setAutocomplete] = useState(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState("");
  const mapRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });
  const validMarkers = useMemo(
    () =>
      markers.filter(hasValidLocation).map((marker) => ({
        ...marker,
        location: {
          lat: Number(marker.location.lat),
          lng: Number(marker.location.lng),
        },
      })),
    [markers]
  );

  const center = useMemo(() => {
    if (
      Number.isFinite(Number(selectedLocation?.lat)) &&
      Number.isFinite(Number(selectedLocation?.lng))
    ) {
      return {
        lat: Number(selectedLocation.lat),
        lng: Number(selectedLocation.lng),
      };
    }

    if (validMarkers[0]?.location) {
      return validMarkers[0].location;
    }

    return defaultCenter;
  }, [selectedLocation, validMarkers]);
  const previewMarker = useMemo(
    () =>
      validMarkers.find((marker) => marker._id === hoveredMarkerId) ||
      validMarkers.find((marker) => marker._id === activeMarkerId) ||
      null,
    [activeMarkerId, hoveredMarkerId, validMarkers]
  );

  const handlePlaceChanged = () => {
    const place = autocomplete?.getPlace();
    const lat = place?.geometry?.location?.lat();
    const lng = place?.geometry?.location?.lng();
    const fullText = place?.formatted_address || place?.name || "";

    if (!lat || !lng || !onLocationChange) {
      return;
    }

    onLocationChange({
      lat,
      lng,
      fullText,
    });

    mapRef.current?.panTo({ lat, lng });
  };

  const handleMapClick = (event) => {
    if (!interactive || !onLocationChange) {
      return;
    }

    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();

    if (!lat || !lng) {
      return;
    }

    onLocationChange({
      lat,
      lng,
      fullText: selectedLocation?.fullText || "",
    });
  };

  if (!apiKey) {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/70 p-6 text-slate-300">
        Add `VITE_GOOGLE_MAPS_API_KEY` to enable the live Google Maps experience.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-300">
        Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="relative rounded-[28px] border border-white/10 bg-slate-950/70 p-3 shadow-[0_20px_80px_rgba(2,8,23,0.45)]">
      {interactive ? (
        <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
          <input
            placeholder="Search location or landmark with Google Maps"
            className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
        </Autocomplete>
      ) : null}

      {showLegend ? (
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-white/70">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Availability markers</div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">Available</div>
          <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-100">Limited</div>
          <div className="rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-rose-100">Full</div>
          {showHeatmap ? (
            <div className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sky-100">
              Demand heat layer enabled
            </div>
          ) : null}
        </div>
      ) : null}

      <GoogleMap
        onLoad={(map) => {
          mapRef.current = map;
        }}
        mapContainerStyle={{ width: "100%", height }}
        center={center}
        zoom={13}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#082f49" }] },
          ],
        }}
      >
        {showHeatmap
          ? validMarkers.map((marker) => (
              <CircleF
                key={`heat-${marker._id || `${marker.location?.lat}-${marker.location?.lng}`}`}
                center={marker.location}
                radius={getHeatRadius(marker)}
                options={{
                  fillColor: getMarkerColor(marker),
                  fillOpacity: 0.2,
                  strokeColor: getMarkerColor(marker),
                  strokeOpacity: 0.4,
                  strokeWeight: 1,
                }}
              />
            ))
          : null}

        {validMarkers.map((marker) => (
          <MarkerF
            key={marker._id || `${marker.location?.lat}-${marker.location?.lng}`}
            position={marker.location}
            title={marker.title}
            onMouseOver={() => {
              if (previewEnabled) {
                setHoveredMarkerId(marker._id || "");
              }
            }}
            onMouseOut={() => {
              if (previewEnabled) {
                setHoveredMarkerId("");
              }
            }}
            onClick={() => {
              onMarkerSelect?.(marker);
            }}
            icon={
              window.google
                ? {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: getAvailabilityColor(marker),
                    fillOpacity: 1,
                    strokeColor: "#e2e8f0",
                    strokeWeight: 1.5,
                    scale: 9,
                  }
                : undefined
            }
          />
        ))}

        {selectedLocation?.lat && selectedLocation?.lng ? (
          <MarkerF
            position={{
              lat: Number(selectedLocation.lat),
              lng: Number(selectedLocation.lng),
            }}
            icon={
              window.google
                ? {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#0f172a",
                    strokeWeight: 2,
                    scale: 7,
                  }
                : undefined
            }
          />
        ) : null}
      </GoogleMap>

      {previewEnabled && previewMarker ? (
        <div className="pointer-events-none absolute bottom-6 left-6 w-[min(340px,calc(100%-3rem))] rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(2,8,23,0.96))] p-4 shadow-[0_24px_80px_rgba(2,8,23,0.52)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Live preview</p>
              <h4 className="mt-2 text-lg font-semibold text-white">{previewMarker.title}</h4>
              <p className="mt-2 text-sm text-white/60">
                {previewMarker.address?.area}
                {previewMarker.address?.district ? `, ${previewMarker.address.district}` : ""}
              </p>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: `${getAvailabilityColor(previewMarker)}55`,
                background: `${getAvailabilityColor(previewMarker)}22`,
                color: "#f8fafc",
              }}
            >
              {previewMarker.availableSlots > 0 ? `${previewMarker.availableSlots} slots` : "Full"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/75">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Price</p>
              <p className="mt-2 font-medium text-white">Rs. {previewMarker.dynamicPrice || previewMarker.fare}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/75">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Distance</p>
              <p className="mt-2 font-medium text-white">
                {previewMarker.ai?.distanceKm !== null && previewMarker.ai?.distanceKm !== undefined
                  ? `${previewMarker.ai.distanceKm} km`
                  : "Nearby"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/75">
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Score</p>
              <p className="mt-2 font-medium text-white">{previewMarker.ai?.recommendationScore || 0}%</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {previewMarker.ai?.explanation || "Live AI recommendation available for this parking."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default MapPanel;
