# About Sun Calculations

This project uses a **NOAA-style simplified solar position model** for professional-grade results with clear, explainable formulas. The goal is to match common solar calculators within a practical error range while keeping the implementation readable and verifiable.

## Key Concepts

- **Julian Day (JD)**: A continuous count of days used in astronomy. We convert a UTC Date into JD and Julian Century (JC).
- **Equation of Time (EoT)**: The difference between apparent solar time and mean solar time, caused by Earth’s orbital eccentricity and axial tilt.
- **Solar Declination (δ)**: The angle between the Sun’s rays and Earth’s equatorial plane. It controls seasonal altitude changes.
- **Hour Angle (H)**: The Sun’s angular distance from local solar noon, derived from true solar time.
- **Altitude / Azimuth**:
  - **Altitude**: Angle above the horizon (0° at horizon, 90° at zenith).
  - **Azimuth**: Compass direction measured **clockwise from north** (0° = north, 90° = east).

## Sunrise / Sunset Definition
We use the standard center-of-Sun altitude **-0.833°** for sunrise/sunset. This includes atmospheric refraction and the Sun’s apparent radius. Polar day/night is detected when the hour-angle solution does not exist.

## Twilight Definitions
Twilight is based on standard Sun center altitude thresholds:
- **Civil Twilight**: -6°
- **Nautical Twilight**: -12°
- **Astronomical Twilight**: -18°

## Golden / Blue Hour
We use configurable altitude ranges:
- **Golden hour**: 0° to +6°
- **Blue hour**: -6° to 0°

## Known Limitations
- Refraction is not modeled beyond the sunrise/sunset definition.
- Results are **approximate** and can differ by tens of seconds compared to high-precision ephemeris models.
- Extreme latitudes are more sensitive near the polar circle boundaries.

## References
- NOAA Solar Calculator (formulas and definitions)
- Jean Meeus, *Astronomical Algorithms* (general reference)
