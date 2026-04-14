import { useOutletContext } from "react-router-dom";

import ProfileSettingsCard from "../../components/profile/ProfileSettingsCard";

function LenderSettingsPage() {
  const workspace = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-semibold text-white">Pricing controls</h3>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white">Auto dynamic pricing</p>
                <p className="mt-1 text-sm text-white/55">Suggested price Rs. {workspace.previewDynamicPrice}</p>
              </div>
              <button
                type="button"
                onClick={() => workspace.setAutoDynamicPricing((prev) => !prev)}
                className={`rounded-full px-4 py-2 text-sm ${
                  workspace.autoDynamicPricing
                    ? "bg-sky-300 text-slate-950"
                    : "border border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {workspace.autoDynamicPricing ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
          <h3 className="text-xl font-semibold text-white">What SmartPark AI is watching</h3>
          <div className="mt-4 space-y-3">
            {workspace.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-white/75">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProfileSettingsCard />
    </div>
  );
}

export default LenderSettingsPage;
