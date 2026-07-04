import { useState, useEffect } from "react";

interface A11ySettings {
  fontSize: "normal" | "large" | "xlarge";
  contrast: "normal" | "high";
  dyslexia: boolean;
}

const DEFAULT: A11ySettings = {
  fontSize: "normal",
  contrast: "normal",
  dyslexia: false,
};

function applySettings(s: A11ySettings) {
  const root = document.documentElement;
  root.setAttribute("data-font-size", s.fontSize);
  root.setAttribute("data-contrast", s.contrast);
  root.setAttribute("data-dyslexia", s.dyslexia ? "true" : "false");
}

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(() => {
    try {
      const saved = localStorage.getItem("unisupport_a11y");
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem("unisupport_a11y", JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<A11ySettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function reset() {
    setSettings(DEFAULT);
  }

  const btnBase =
    "flex-1 py-1.5 text-xs rounded-lg border transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500";
  const btnActive = "bg-blue-600 text-white border-blue-600";
  const btnInactive = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";

  return (
    <div className="fixed bottom-4 right-4 z-[200]" aria-label="Widget pristupačnosti">
      {open && (
        <div
          className="mb-3 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64"
          role="region"
          aria-label="Postavke pristupačnosti"
        >
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Pristupačnost</h2>

          {/* Font size */}
          <fieldset className="mb-4">
            <legend className="text-xs text-gray-500 mb-1.5 font-medium">Veličina teksta</legend>
            <div className="flex gap-1" role="group">
              {(["normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`${btnBase} ${settings.fontSize === size ? btnActive : btnInactive}`}
                  aria-pressed={settings.fontSize === size}
                >
                  {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Contrast */}
          <fieldset className="mb-4">
            <legend className="text-xs text-gray-500 mb-1.5 font-medium">Kontrast</legend>
            <div className="flex gap-1" role="group">
              {(["normal", "high"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => update({ contrast: c })}
                  className={`${btnBase} ${settings.contrast === c ? btnActive : btnInactive}`}
                  aria-pressed={settings.contrast === c}
                >
                  {c === "normal" ? "Normalni" : "Visoki"}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Dyslexia font */}
          <div className="mb-1">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Font za disleksiju</p>
            <button
              onClick={() => update({ dyslexia: !settings.dyslexia })}
              className={`w-full py-1.5 text-xs rounded-lg border transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                settings.dyslexia ? btnActive : btnInactive
              }`}
              aria-pressed={settings.dyslexia}
            >
              {settings.dyslexia ? "Uključeno" : "Isključeno"}
            </button>
          </div>

          <button
            onClick={reset}
            className="mt-3 w-full py-1.5 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 border border-transparent hover:border-gray-200"
          >
            Resetiraj na zadano
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={open ? "Zatvori postavke pristupačnosti" : "Otvori postavke pristupačnosti"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Universal accessibility icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="4" r="2" />
          <path d="M19 9h-5V7h-4v2H5v2h5v3l-2 7h2l1.5-5h1l1.5 5h2l-2-7V11h5V9z" />
        </svg>
      </button>
    </div>
  );
}
