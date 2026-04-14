import { AnimatePresence, motion as Motion } from "framer-motion";
import { ArrowRight, MapPinned, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";

function OnboardingModal({ isOpen, onSkip, onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: MapPinned,
      eyebrow: "Welcome",
      hero: "Discover smarter parking without the clutter",
      title: "Discover nearby parking",
      description: "Search with the live map, smart filters, and AI-ranked recommendations.",
    },
    {
      icon: Wallet,
      eyebrow: "Feature highlights",
      hero: "Book faster with a guided, real-world flow",
      title: "Book in one flow",
      description: "SmartPark automatically allocates the best available slot and confirms the booking instantly.",
    },
    {
      icon: Sparkles,
      eyebrow: "Get started",
      hero: "Let the platform learn and personalize as you go",
      title: "Learn from your behavior",
      description: "The platform personalizes pricing, locations, and suggestions using your activity patterns.",
    },
  ];
  const activeStep = steps[step];

  return (
    <AnimatePresence>
      {isOpen ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-md"
        >
          <Motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-[linear-gradient(145deg,rgba(18,24,38,0.98),rgba(11,15,25,0.98))] p-8 shadow-[0_30px_120px_rgba(2,8,23,0.7)]"
          >
            <div className="flex items-center gap-2">
              {steps.map((item, index) => (
                <span
                  key={item.title}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === step ? "w-10 bg-blue-500" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.4em] text-blue-300/70">{activeStep.eyebrow}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white">{activeStep.hero}</h2>
            <p className="mt-3 max-w-2xl text-sm text-white/60">
              Here is the fastest path to getting value from SmartPark AI on your first session.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setStep(index)}
                    className={`rounded-[28px] border p-5 text-left transition duration-200 ${
                      index === step
                        ? "border-blue-400/20 bg-blue-500/10 shadow-[0_18px_50px_rgba(59,130,246,0.16)]"
                        : "border-white/10 bg-white/[0.04] hover:-translate-y-0.5 hover:border-white/15"
                    }`}
                  >
                    <div className={`inline-flex rounded-2xl border p-3 ${
                      index === step
                        ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/60">{item.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  onSkip();
                }}
                className="app-button-secondary rounded-2xl px-5 py-3 text-sm text-white/70"
              >
                Skip for now
              </button>
              <div className="flex gap-3">
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}
                    className="app-button-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                  >
                    Next
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(0);
                      onComplete();
                    }}
                    className="app-button-primary rounded-2xl px-5 py-3 text-sm font-semibold"
                  >
                    Get started
                  </button>
                )}
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default OnboardingModal;
