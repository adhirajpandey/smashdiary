# Design System Strategy: Kinetic Precision

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Editorial"**

This design system moves away from the stagnant, boxy layouts of traditional sports trackers and embraces the high-velocity spirit of professional badminton. We are not just building a utility; we are creating a digital arena. The aesthetic philosophy centers on **Kinetic Precision**—where high-contrast, bold typography meets fluid, layered surfaces.

To break the "template" look, we utilize intentional asymmetry. Large, aggressive display type (Space Grotesk) is often offset or overlapped by translucent glass containers, suggesting the "smash" and "flow" of a match. We treat the mobile screen as a high-end magazine spread: breathing room is a luxury, and movement is implied through diagonal accents and tonal shifts rather than rigid lines.

---

## 2. Colors & Surface Philosophy
The palette is engineered for high-performance environments—readable under gym lights and striking in low-light settings.

### The Palette
- **Primary (`#f3ffca` / `#cafd00`):** Our "Neon Velocity" accent. Used exclusively for high-intent actions and critical match data.
- **Secondary (`#7d98ff`):** The "Electric Court" blue. This provides the energetic, athletic soul of the interface.
- **Neutral Core (`#0e0e0e`):** A deep charcoal base that allows neon accents to vibrate with energy.

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited for sectioning.** 
Boundaries must be defined solely through background color shifts. To separate a match card from the background, use a shift from `surface` (#0e0e0e) to `surface-container-low` (#131313). This creates a sophisticated, "molded" look rather than a "pasted" look.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of athletic gear. 
- **Base Layer:** `surface` (#0e0e0e).
- **Secondary Sectioning:** `surface-container-low` (#131313).
- **Interactive Cards:** `surface-container` (#1a1a1a) or `surface-container-high` (#20201f).
Nesting must follow a logical elevation logic: an inner container must always be a "higher" tier than its parent to simulate a natural lift.

### The "Glass & Gradient" Rule
To elevate the "Premium" feel, floating action buttons or high-level stats should utilize **Glassmorphism**. Use `surface-variant` (#262626) at 60% opacity with a `20px` backdrop blur. For primary CTAs, apply a subtle linear gradient (45-degree) from `primary` (#f3ffca) to `primary-container` (#cafd00) to add "soul" and depth.

---

## 3. Typography: The Voice of the Athlete
The typographic system creates a tension between the technical precision of **Lexend** and the aggressive, architectural nature of **Space Grotesk**.

- **Display & Headlines (Space Grotesk):** These are your "power moves." Use `display-lg` and `headline-lg` with tight letter-spacing for scores, set-points, and hero titles. This font suggests the geometry of the court.
- **Body & Labels (Lexend):** Designed for maximum legibility during intense movement. The wider character footprint of Lexend ensures that even at `label-sm` (0.6875rem), data like "Birdie Speed" or "Win Ratio" remains glanceable.
- **Intentional Contrast:** Always pair a `display-sm` Space Grotesk header with a `body-md` Lexend sub-header to create an editorial hierarchy that feels curated, not auto-generated.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-highest` card atop a `surface-dim` background. The subtle 4% difference in hex value is enough for the human eye to perceive depth without visual clutter.
- **Ambient Shadows:** For "floating" match-start buttons, use a shadow color tinted with the `secondary` (#7d98ff) at 8% opacity with a `32px` blur. This creates a "glow" rather than a "shadow," mimicking the lights of a stadium.
- **The "Ghost Border" Fallback:** If a container sits on a color of similar value, use the `outline-variant` token (#484847) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (The Kinetic Trigger)
- **Primary:** Rounded `lg` (roughly `0.8rem` to `1rem`), not full-pill by default. Background: `primary` to `primary-container` gradient. Label: `on-primary` (#516700), Bold Lexend.
- **Secondary:** Surface-tinted glass. `outline-variant` at 20% opacity. 
- **Shape rule:** Match buttons should feel like molded control surfaces, not floating pills. Reserve fully rounded shapes for chips or tiny utility controls only.
- **Interaction:** On press, the button should scale to 96% to provide tactile feedback of "hitting" the shuttlecock.

### Cards (The Data Suite)
- Forbid all divider lines.
- Use `spacing-6` (1.3rem) to separate vertical content blocks.
- **The "Match Card":** Uses `surface-container-high`. The score is set in `headline-lg` Space Grotesk, pinned to the right edge to create an asymmetrical, modern layout.

### Chips (The Quick-Filter)
- Use `md` (0.375rem) roundedness. 
- Unselected: `surface-container-low`. 
- Selected: `secondary-container` (#004dea) with `on-secondary-container` text.

### Input Fields (The Precision Entry)
- Minimalist under-line style only. Use `outline` (#767575) at 40% opacity for the default state.
- Focus State: The underline transforms into a 2px `secondary` (#7d98ff) line with a subtle 4px glow.

### Custom Component: The "Momentum Tracker"
A horizontal sparkline component utilizing a `tertiary` (#8ff5ff) gradient to show point streaks. It should be uncontained, bleeding edge-to-edge to suggest continuous movement.

---

## 6. Do’s and Don'ts

### Do:
- **Use "Active" Spacing:** Use `spacing-10` and `spacing-12` to create large gutters between unrelated content groups. This creates an "Elite" feel.
- **Embrace the Dark:** Keep the `surface` dark to allow the high-performance colors (Neon/Electric Blue) to pop.
- **Overprint Typography:** Occasionally allow a large `display` background number (e.g., a "Set 1" indicator) to be partially obscured by a card to create depth.

### Don't:
- **Don't use 100% opaque borders.** This instantly makes the app look like a generic bootstrap template.
- **Don't use standard Grey shadows.** Shadows must always be tinted with the `on-surface` or `secondary` color.
- **Don't crowd the data.** If a screen feels full, increase the spacing and move secondary data into a "surface-container-lowest" drawer.
- **Don't use Serif fonts.** This system is about speed and technicality; serifs are too slow for the court.
