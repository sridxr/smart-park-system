import { BellRing, Bot, ChevronDown, Clock3, Flame, MapPinned, Sparkles, Wallet } from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

import AIChatAssistant from "../../components/AIChatAssistant";
import DecisionDNA from "../../components/ai/DecisionDNA";
import DecisionReplay from "../../components/ai/DecisionReplay";
import FutureDecisionPanel from "../../components/ai/FutureDecisionPanel";
import IntentPredictionCard from "../../components/ai/IntentPredictionCard";
import SimulationPanel from "../../components/ai/SimulationPanel";
import StrategySelector from "../../components/ai/StrategySelector";
import ZeroClickParkingCard from "../../components/ai/ZeroClickParkingCard";
import MapPanel from "../../components/MapPanel";
import MetricCard from "../../components/MetricCard";
import BillingPanel from "../../components/mobility/BillingPanel";
import TripStatus from "../../components/mobility/TripStatus";
import DashboardHero from "../../components/user/DashboardHero";
import EmptyStateCard from "../../components/ui/EmptyStateCard";
import SkeletonPanel from "../../components/ui/SkeletonPanel";
import { useAuth } from "../../context/AuthContext";

function ExpandableSection({ eyebrow, title, subtitle, defaultOpen = false, children }) {
  return (
    <details
      open={defaultOpen}
      className="group app-surface rounded-[30px] p-6"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">{eyebrow}</p>
          ) : null}
          <h3 className="mt-2 text-2xl font-semibold text-[color:var(--app-text)]">{title}</h3>
          {subtitle ? <p className="mt-2 text-sm text-[color:var(--app-text-muted)]">{subtitle}</p> : null}
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-[color:var(--app-text-muted)] transition group-open:rotate-180">
          <ChevronDown size={16} />
        </div>
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}

function UserDashboardPage() {
  const workspace = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (workspace.loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SkeletonPanel className="h-[420px]" />
        <div className="space-y-6">
          <SkeletonPanel className="h-40" />
          <SkeletonPanel className="h-64" />
        </div>
      </div>
    );
  }

  const leadParking = workspace.leadParking;
  const bookingSpend = workspace.bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
  const recentBookings = workspace.bookings.slice(0, 4);
  const preferredPriceRange =
    workspace.personalization?.preferredPriceRange?.max
      ? workspace.personalization.preferredPriceRange
      : workspace.behaviorSummary?.preferredPriceRange || { min: 0, max: 0 };
  const activeTripVisible = Boolean(workspace.activeTrip || workspace.currentBilling?.active);
  const confidenceBannerLabel =
    workspace.aiConfidenceLevel === "strong"
      ? "Best Parking Found"
      : workspace.aiConfidenceLevel === "cautious"
        ? "Multiple good options available"
        : "Smart balanced recommendation";

  return (
    <div className="space-y-6">
      <DashboardHero
        userName={user?.name}
        leadParking={leadParking}
        onParkForMe={workspace.runOneTapParking}
        onExplore={() => navigate("/user/explore")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Live Recommendations" value={workspace.parkings.length} accent="role" helper="Discovery engine output" />
        <MetricCard label="Bookings" value={workspace.bookings.length} accent="blue" helper="Active and historical reservations" />
        <MetricCard label="Spend" value={`Rs. ${bookingSpend}`} accent="role" helper="Lifetime booking value" />
      </div>

      {workspace.liveDecisionSwitch?.shouldSwitch ? (
        <div className="app-accent-panel rounded-[28px] p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">Live optimization</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Better parking found, switch?</h3>
              <p className="mt-2 text-sm text-white/80">{workspace.liveDecisionSwitch.message}</p>
              <p className="mt-2 text-sm text-white/65">
                Current: {workspace.liveDecisionSwitch.currentOption?.etaMinutes || 0} min, Rs. {workspace.liveDecisionSwitch.currentOption?.price || 0}
                {" "}to New: {workspace.liveDecisionSwitch.betterOption?.etaMinutes || 0} min, Rs. {workspace.liveDecisionSwitch.betterOption?.price || 0}
              </p>
            </div>
            <button
              type="button"
              onClick={() => workspace.openCheckout(workspace.liveDecisionSwitch.betterOption)}
              className="app-button-primary rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              Review switch
            </button>
          </div>
        </div>
      ) : null}

      {activeTripVisible ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <TripStatus
            trip={workspace.activeTrip}
            onAdvance={workspace.updateTripStage}
            onExtend={workspace.extendActiveTrip}
            onComplete={workspace.completeActiveTrip}
          />
          <BillingPanel billing={workspace.currentBilling} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="app-accent-panel rounded-[32px] p-6 text-white">
          <div className="flex items-center gap-3">
            <Flame className="text-emerald-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">AI recommendation</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {leadParking?.title || "No recommendation yet"}
              </h3>
            </div>
          </div>
          {leadParking ? (
            <>
              <p className="mt-4 text-sm font-medium text-sky-100/90">{confidenceBannerLabel}</p>
              <p className="mt-3 text-sm text-white/75">{leadParking.ai?.explanation}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-white/40">Smart Score</p>
                  <p className="mt-2 text-white">{leadParking.ai?.recommendationScore || 0}/100</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-white/40">Live Price</p>
                  <p className="mt-2 text-white">Rs. {leadParking.dynamicPrice || leadParking.fare}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-white/40">ETA</p>
                  <p className="mt-2 text-white">{leadParking.ai?.traffic?.eta || "Live"}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-white/40">Availability</p>
                  <p className="mt-2 text-white">{leadParking.availableSlots || 0}/{leadParking.totalSlots || 0} slots</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-500/[0.06] p-4 text-sm text-white/75">
                <p className="font-medium text-white">Why this parking</p>
                <p className="mt-2">
                  Distance {leadParking.ai?.distanceKm ?? "Nearby"} km | Demand {leadParking.ai?.demandLevel || leadParking.demandLevel || "Low"} | Route {leadParking.ai?.traffic?.routeQuality || "Unknown"}
                </p>
                <p className="mt-2 text-white/65">
                  {leadParking.ai?.traffic?.routeSummary || "Traffic-aware scoring is active when live route data is available."}
                </p>
                {leadParking.ai?.vehicleCompatibility?.applies ? (
                  <p className="mt-2 text-white/65">{leadParking.ai.vehicleCompatibility.label}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => workspace.openCheckout(leadParking)}
                className="app-button-primary mt-5 rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Pay & Book
              </button>
            </>
          ) : (
            <EmptyStateCard
              eyebrow="Recommendation"
              title="Your AI lane is getting ready"
              description="Once a strong nearby option is available, this card will show the parking, price, and why SmartPark AI chose it."
              actionLabel="Explore Network"
              onAction={() => navigate("/user/explore")}
              icon={<Flame size={18} />}
              className="mt-4"
            />
          )}
        </div>

        <div className="app-surface rounded-[32px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Map</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Live parking preview</h3>
              <p className="mt-2 text-sm text-white/55">See the closest live inventory before opening the full explore view.</p>
            </div>
            <Link
              to="/user/explore"
              className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              Open Explore
            </Link>
          </div>
          <div className="mt-5">
            <MapPanel
              markers={workspace.parkings.slice(0, 8)}
              selectedLocation={workspace.location}
              height="420px"
              showHeatmap
              showLegend
              previewEnabled
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="app-surface rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock3 className="text-emerald-200" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Recent bookings</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Latest reservation activity</h3>
              </div>
            </div>
            <Link to="/user/bookings" className="app-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold">
              View all bookings
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentBookings.length ? (
              recentBookings.map((booking) => (
                <div key={booking._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{booking.parkingTitle}</p>
                      <p className="mt-2 text-sm text-white/55">
                        {booking.startTime
                          ? `${new Date(booking.startTime).toLocaleDateString("en-IN")} ${new Date(booking.startTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`
                          : new Date(booking.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <p>Rs. {booking.amount}</p>
                      <p className="mt-1">{booking.status}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard
                eyebrow="Bookings"
                title="No bookings yet"
                description="Start your first parking journey and your latest reservations will appear here."
                actionLabel="Find Parking"
                onAction={() => navigate("/user/explore")}
                icon={<Clock3 size={18} />}
              />
            )}
          </div>
        </div>

        <div className="app-surface rounded-[30px] p-6">
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-200" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">Preference model</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">What AI has learned</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Preferred locations</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(workspace.activePreferredAreas || []).slice(0, 4).map((area) => (
                  <span key={area} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                    {area}
                  </span>
                ))}
                {!workspace.activePreferredAreas.length ? (
                  <span className="text-sm text-white/50">No dominant location pattern yet</span>
                ) : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Preferred price range</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {preferredPriceRange.max
                  ? `Rs. ${preferredPriceRange.min} - Rs. ${preferredPriceRange.max}`
                  : "Still learning"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Searches tracked</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {workspace.behaviorSummary.searches?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm text-white/40">Peak booking window</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {workspace.topBookingHours[0]
                  ? `${String(workspace.topBookingHours[0].hour).padStart(2, "0")}:00`
                  : "Collecting"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ExpandableSection
        eyebrow="Advanced AI"
        title="Decision Lab"
        subtitle="Simulation, intent prediction, explainability, and future modeling live here so the main dashboard stays focused."
      >
        <div className="space-y-6">
          <StrategySelector
            options={workspace.strategyModes}
            value={workspace.strategyMode}
            onChange={workspace.setStrategyMode}
          />

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <IntentPredictionCard
              intent={workspace.intentPrediction}
              onAccept={workspace.applyPredictedIntent}
            />
            {!workspace.zeroClickDismissed && workspace.zeroClickSuggestion?.available ? (
              <ZeroClickParkingCard
                suggestion={workspace.zeroClickSuggestion}
                onConfirm={workspace.confirmZeroClickSuggestion}
                onDismiss={workspace.dismissZeroClickSuggestion}
              />
            ) : (
              <div className="app-surface rounded-[30px] p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--app-text-soft)]">Zero-click parking</p>
                <h3 className="mt-2 text-xl font-semibold text-[color:var(--app-text)]">Auto-suggestion stays optional</h3>
                <p className="mt-3 text-sm text-[color:var(--app-text-muted)]">
                  When the intent engine is confident enough, SmartPark AI can suggest or pre-stage a parking choice without interrupting your normal booking flow.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DecisionDNA profile={workspace.decisionProfile} />
            <SimulationPanel
              simulation={workspace.decisionSimulation}
              minutesOffset={workspace.simulationOffset}
              onOffsetChange={workspace.setSimulationOffset}
              onApply={workspace.applySimulationRecommendation}
            />
          </div>

          <FutureDecisionPanel
            futureSimulation={workspace.futureSimulation}
            decisionTree={workspace.decisionTree}
            collectiveInsight={workspace.collectiveInsight}
          />

          <DecisionReplay
            replay={workspace.decisionReplay}
            loading={workspace.decisionReplay.loading}
            onRefresh={() => workspace.refreshDecisionReplay(leadParking?._id)}
          />
        </div>
      </ExpandableSection>

      <ExpandableSection
        eyebrow="More Tools"
        title="Assistant, Alerts, and Activity"
        subtitle="Helpful secondary context that stays available without competing with the main booking journey."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <BellRing className="text-emerald-200" />
              <div>
                <h3 className="text-xl font-semibold text-white">Alerts</h3>
                <p className="text-sm text-white/55">Only the top live signals stay visible here.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {workspace.hotspots.length ? (
                workspace.hotspots.slice(0, 3).map((hotspot) => (
                  <div key={hotspot._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <p className="font-medium text-white">{hotspot.parkingTitle}</p>
                    <p className="mt-2 text-sm text-white/60">
                      {hotspot.totalBookings} bookings | Avg fare Rs. {Math.round(hotspot.avgFare || 0)}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyStateCard
                  eyebrow="Live alerts"
                  title="No urgent alerts right now"
                  description="The network looks calm. When demand spikes or parking fills up quickly, the most important signals will show here."
                  icon={<BellRing size={18} />}
                />
              )}
            </div>
          </div>

          <div className="app-surface rounded-[30px] p-6">
            <div className="flex items-center gap-3">
              <Bot className="text-emerald-200" />
              <div>
                <h3 className="text-xl font-semibold text-white">AI assistant</h3>
                <p className="text-sm text-white/55">Ask for parking help without leaving the dashboard.</p>
              </div>
            </div>
            <div className="mt-4">
              <AIChatAssistant
                location={workspace.location}
                carType={workspace.carType}
                maxPrice={workspace.maxPrice}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 app-surface rounded-[30px] p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-emerald-200" />
            <div>
              <h3 className="text-xl font-semibold text-white">Recent activity</h3>
              <p className="text-sm text-white/55">Searches, saves, and bookings across your latest sessions.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {workspace.timelinePreview.length ? (
              workspace.timelinePreview.map((item) => (
                <div key={item._id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.description || item.action}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/45">
                      {item.action}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <EmptyStateCard
                eyebrow="Activity"
                title="No recent activity yet"
                description="As you search, save, and book parking, the most recent actions will appear here."
                actionLabel="Open Explore"
                onAction={() => navigate("/user/explore")}
                icon={<MapPinned size={18} />}
              />
            )}
          </div>
        </div>
      </ExpandableSection>
    </div>
  );
}

export default UserDashboardPage;
