import { Moon, SunMedium } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white/70 transition hover:border-white/20 hover:bg-white/[0.06]"
      title="Toggle theme"
    >
      <span className="relative flex h-6 w-11 items-center rounded-full bg-white/10 p-1">
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
            theme === "dark" ? "translate-x-0" : "translate-x-5"
          }`}
        />
      </span>
      {theme === "dark" ? <SunMedium size={16} className="group-hover:rotate-12 transition-transform" /> : <Moon size={16} className="group-hover:-rotate-12 transition-transform" />}
    </button>
  );
}

export default ThemeToggle;
