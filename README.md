<div align="center">
  <h1>Sun Path Atlas</h1>
  <p>English | <a href="README.zh-Hans.md">简体中文</a></p>
  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/lailai0916/sun-path-atlas/deploy.yml?style=flat-square" alt="deployment" />
    <img src="https://img.shields.io/github/last-commit/lailai0916/sun-path-atlas?style=flat-square" alt="last commit" />
    <img src="https://img.shields.io/github/languages/top/lailai0916/sun-path-atlas?style=flat-square" alt="top language" />
    <img src="https://img.shields.io/github/repo-size/lailai0916/sun-path-atlas?style=flat-square" alt="repo size" />
    <img src="https://img.shields.io/github/license/lailai0916/sun-path-atlas?style=flat-square" alt="license" />
  </p>
</div>

## Website Introduction

A browser-based sun-path calculator for architecture and outdoor planning. Choose a
location, date, time, and timezone to inspect solar geometry in 2D or 3D, compare a full
year, and export the result.

## Website Features

☀️ **Solar geometry** — altitude, azimuth, sunrise, sunset, solar noon, day length, and
twilight bands use readable NOAA-style simplified formulas.

🌍 **Map input** — select coordinates on a world map or enter latitude and longitude
directly with an explicit timezone offset.

📊 **Day and year views** — inspect one day's track or compare representative monthly
tracks across the year.

🧭 **2D and 3D diagrams** — use a polar chart or rotate and zoom a Three.js sky sphere.

🖼️ **Deterministic export** — save the current diagram as SVG or high-resolution PNG.

🌐 **Bilingual interface** — English is the default and Simplified Chinese is complete.

## Getting Started

```bash
git clone https://github.com/lailai0916/sun-path-atlas.git
cd sun-path-atlas
npm install
npm run dev
```

Before publishing a change:

```bash
npm run lint
npm run build
```

## Calculation Scope

The model calculates equation of time, solar declination, hour angle, altitude, and
azimuth. Sunrise and sunset use a Sun-center altitude of $-0.833°$; civil, nautical, and
astronomical twilight use $-6°$, $-12°$, and $-18°$.

Results are approximate and may differ from high-precision ephemerides by tens of
seconds. Refraction is included only in the sunrise and sunset definition, terrain and
local horizon obstructions are not modelled, and polar-circle boundaries are more
sensitive. See [About Sun Calculations](docs/about.md) for formulas and limitations.

## Project Structure

```bash
sun-path-atlas/
├── src/
│   ├── components/                 # controls, charts, map, and statistics
│   ├── modules/                    # solar math, export, and i18n
│   ├── App.tsx                     # application composition
│   ├── index.css                   # themes and responsive layout
│   └── main.tsx                    # React entry point
├── docs/about.md                   # formulas, definitions, and limits
├── public/                         # static assets
├── index.html                      # Application entry page
├── package-lock.json               # Dependency lock file
├── package.json                    # Dependency configuration
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
└── LICENSE                         # Code license
```

## License

This project's code is licensed under [MIT License](LICENSE).
