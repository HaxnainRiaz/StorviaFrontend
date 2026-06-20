const DEFAULT_STYLE_TOKENS = {
    "--sv-font-body": "inherit",
    "--sv-font-heading": "inherit",
    "--sv-font-button": "inherit",
    "--sv-color-text": "#211815",
    "--sv-color-muted": "#7a6558",
    "--sv-color-bg": "#fbf7f0",
    "--sv-color-surface": "#ffffff",
    "--sv-color-border": "#eadccb",
    "--sv-color-accent": "#211815",
    "--sv-color-button": "#211815",
    "--sv-color-button-text": "#ffffff",
};

function cssEscapeValue(value) {
    return String(value || "").replace(/[{};]/g, "").trim();
}

function extractFallbackFonts(schema) {
    const fonts = schema?.globalStyles?.fonts;
    if (Array.isArray(fonts) && fonts.length) {
        return fonts[0];
    }
    return "";
}

function extractFallbackTokens(schema) {
    const colors = schema?.globalStyles?.colors || {};
    const font = extractFallbackFonts(schema);
    return {
        "--sv-font-body": font || DEFAULT_STYLE_TOKENS["--sv-font-body"],
        "--sv-font-heading": font || DEFAULT_STYLE_TOKENS["--sv-font-heading"],
        "--sv-font-button": font || DEFAULT_STYLE_TOKENS["--sv-font-button"],
        "--sv-color-text": colors.text || DEFAULT_STYLE_TOKENS["--sv-color-text"],
        "--sv-color-muted": colors.secondary || DEFAULT_STYLE_TOKENS["--sv-color-muted"],
        "--sv-color-bg": colors.background || DEFAULT_STYLE_TOKENS["--sv-color-bg"],
        "--sv-color-surface": DEFAULT_STYLE_TOKENS["--sv-color-surface"],
        "--sv-color-border": colors.secondary || DEFAULT_STYLE_TOKENS["--sv-color-border"],
        "--sv-color-accent": colors.primary || DEFAULT_STYLE_TOKENS["--sv-color-accent"],
        "--sv-color-button": colors.primary || DEFAULT_STYLE_TOKENS["--sv-color-button"],
        "--sv-color-button-text": DEFAULT_STYLE_TOKENS["--sv-color-button-text"],
    };
}

export function getStorefrontStyleVariables(schema) {
    const extracted = schema?.globalStyles?.styleContext?.cssVariables || {};
    const fallback = extractFallbackTokens(schema);
    return Object.fromEntries(
        Object.entries({ ...DEFAULT_STYLE_TOKENS, ...fallback, ...extracted })
            .filter(([, value]) => value && String(value).trim())
            .map(([key, value]) => [key, cssEscapeValue(value)])
    );
}

export function buildStorefrontStyleCss(storeSlug, schema) {
    if (!storeSlug) return "";
    const scope = `.store-${storeSlug}`;
    const variables = getStorefrontStyleVariables(schema);
    const varCss = Object.entries(variables)
        .map(([key, value]) => `${key}: ${value};`)
        .join("\n");

    return `
${scope} {
${varCss}
  --color-primary: var(--sv-color-accent);
  --color-secondary: var(--sv-color-border);
  --color-background: var(--sv-color-bg);
  --color-text: var(--sv-color-text);
  color: var(--sv-color-text);
  background: var(--sv-color-bg);
  font-family: var(--sv-font-body);
}
${scope} .storvia-theme-card {
  background: var(--sv-color-surface) !important;
  border-color: var(--sv-color-border) !important;
  color: var(--sv-color-text) !important;
  font-family: var(--sv-font-body);
}
${scope} .storvia-theme-heading,
${scope} .storvia-theme-title {
  color: var(--sv-color-text) !important;
  font-family: var(--sv-font-heading);
}
${scope} .storvia-theme-text {
  color: var(--sv-color-text) !important;
  font-family: var(--sv-font-body);
}
${scope} .storvia-theme-muted {
  color: var(--sv-color-muted) !important;
  font-family: var(--sv-font-body);
}
${scope} .storvia-theme-price {
  color: var(--sv-color-accent) !important;
  font-family: var(--sv-font-heading);
}
${scope} .storvia-theme-button {
  background: var(--sv-color-button) !important;
  border-color: var(--sv-color-button) !important;
  color: var(--sv-color-button-text) !important;
  font-family: var(--sv-font-button);
}
${scope} .storvia-theme-button-outline {
  background: transparent !important;
  border-color: var(--sv-color-border) !important;
  color: var(--sv-color-text) !important;
  font-family: var(--sv-font-button);
}
${scope} .storvia-category-filter {
  scrollbar-width: thin;
}
${scope} .storvia-category-chip {
  border-color: var(--sv-color-border) !important;
  color: var(--sv-color-text) !important;
  background: color-mix(in srgb, var(--sv-color-surface) 92%, transparent) !important;
  font-family: var(--sv-font-button);
}
${scope} .storvia-category-chip-active {
  border-color: var(--sv-color-button) !important;
  background: var(--sv-color-button) !important;
  color: var(--sv-color-button-text) !important;
}
`;
}
