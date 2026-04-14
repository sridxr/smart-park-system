const roleThemeTokens = {
  user: {
    dark: {
      background: "#0B1220",
      card: "#121A2B",
      primary: "#3B82F6",
      accent: "#06B6D4",
      text: "#E5E7EB",
      textSecondary: "#9CA3AF",
    },
    light: {
      background: "#CBD5E1",
      card: "#B4C0D4",
      primary: "#3B82F6",
      accent: "#06B6D4",
      text: "#132238",
      textSecondary: "#5E6C81",
    },
  },
  lender: {
    dark: {
      background: "#0A1512",
      card: "#11211C",
      primary: "#10B981",
      accent: "#84CC16",
      text: "#E5E7EB",
      textSecondary: "#A7B2AF",
    },
    light: {
      background: "#CCD9D3",
      card: "#B8C8C0",
      primary: "#10B981",
      accent: "#84CC16",
      text: "#163025",
      textSecondary: "#61756B",
    },
  },
  admin: {
    dark: {
      background: "#0F0B1A",
      card: "#1A132B",
      primary: "#8B5CF6",
      accent: "#EC4899",
      text: "#EDE9FE",
      textSecondary: "#B7B0CC",
    },
    light: {
      background: "#D3C8E3",
      card: "#BDAFD4",
      primary: "#8B5CF6",
      accent: "#EC4899",
      text: "#2F1F4A",
      textSecondary: "#76688A",
    },
  },
};

function hexToRgb(hex) {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((value) => value + value)
          .join("")
      : sanitized;
  const numeric = Number.parseInt(normalized, 16);

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

function toRgbString(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

export function getRoleTheme(role = "user", mode = "dark") {
  const rolePalette = roleThemeTokens[role] || roleThemeTokens.user;
  const palette = rolePalette[mode] || rolePalette.dark;
  const primaryRgb = toRgbString(palette.primary);
  const accentRgb = toRgbString(palette.accent);

  return {
    ...palette,
    primaryRgb,
    accentRgb,
    cssVars: {
      "--app-bg": palette.background,
      "--app-surface": palette.card,
      "--app-surface-elevated":
        mode === "dark" ? "rgba(15, 23, 42, 0.78)" : "rgba(201, 210, 224, 0.84)",
      "--app-panel":
        mode === "dark" ? "rgba(255, 255, 255, 0.035)" : "rgba(191, 199, 214, 0.48)",
      "--app-border": mode === "dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(100, 116, 139, 0.16)",
      "--app-border-strong": mode === "dark" ? "rgba(148, 163, 184, 0.28)" : "rgba(100, 116, 139, 0.24)",
      "--app-text": palette.text,
      "--app-text-muted": palette.textSecondary,
      "--role-bg": palette.background,
      "--role-card": palette.card,
      "--role-primary": palette.primary,
      "--role-primary-rgb": primaryRgb,
      "--role-accent": palette.accent,
      "--role-accent-rgb": accentRgb,
      "--role-shadow":
        mode === "dark"
          ? "0 28px 90px rgba(2, 8, 23, 0.42)"
          : "0 14px 30px rgba(15, 23, 42, 0.08)",
    },
    badgeStyle: {
      borderColor: `rgba(${primaryRgb}, 0.24)`,
      background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.18), rgba(${accentRgb}, 0.12))`,
      color: palette.text,
    },
    primaryBadgeStyle: {
      borderColor: `rgba(${primaryRgb}, 0.24)`,
      background: `rgba(${primaryRgb}, 0.14)`,
      color: palette.text,
    },
    sidebarGlow:
      mode === "dark"
        ? `radial-gradient(circle at top, rgba(${primaryRgb}, 0.18), transparent 24%), radial-gradient(circle at 82% 16%, rgba(${accentRgb}, 0.14), transparent 18%), linear-gradient(180deg, ${palette.background}, #050913)`
        : `radial-gradient(circle at top, rgba(${primaryRgb}, 0.08), transparent 22%), radial-gradient(circle at 82% 16%, rgba(${accentRgb}, 0.06), transparent 16%), linear-gradient(180deg, color-mix(in srgb, ${palette.background} 88%, #94a3b8), color-mix(in srgb, ${palette.card} 92%, #cbd5e1))`,
  };
}

export default roleThemeTokens;
