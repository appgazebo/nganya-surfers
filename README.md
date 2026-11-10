# Nganya Surfers: Nairobi Traffic Dodger 🚐💨

A 3D infinite runner built with **Babylon.js** and **TypeScript**, inspired by *Subway Surfers* and set in the vibrant world of Nairobi's famous **Nganya / Matatu culture**.

🌐 **Play Live Online**:
- **Official Custom Domain**: [https://nganyarunner.humblesherrif.online/](https://nganyarunner.humblesherrif.online/)
- **Cloudflare Pages Mirror**: [https://nganyarunner.pages.dev/](https://nganyarunner.pages.dev/)

---

## 🎮 Gameplay & Features

- **Iconic Incoming Nganyas**: Speeding, heavily customized matatus with dynamic underglow neons, chrome bull-bars, high rear wings, custom graffiti names (*"RONGAI BEAST"*, *"KAYOLE 1960"*, *"SUPER METRO"*, *"EASTLANDS PHANTOM"*), and authentic dual-tone air horns!
- **The "Boda-Boda" Motorbike Mode (Hoverboard Mechanic)**:
  - **Activation**: Double-tap on mobile, press `E` or `B` on keyboard, or tap the orange `🏍️` touch button.
  - **3D Boxer 150 Motorbike**: Real-time modeled motorcycle with teardrop fuel tank, tubular frame, spinning spoke wheels, chrome exhaust, and front headlight.
  - **Runner Riding Posture**: Runner sits on the saddle with hands gripping the handlebars and feet on the footpegs, leaning dynamically into lane switches!
  - **Crash Shield Protection**: If you hit an obstacle or an oncoming Matatu while riding the Boda-Boda, the bike absorbs the impact and crashes, launching your runner forward safely onto the road with an invulnerability landing window!
  - **Garage Upgrades & Styles**:
    - **Boxer 150 Classic** (Default): Fire red tank, chrome exhaust, black frame.
    - **Safari Delivery Racer** (KSh 4,000): High-vis yellow tank, delivery cargo box, tuned green accents.
    - **Cyber Boda Electric** (KSh 9,000): Glowing neon cyan battery pack and glowing cyan rims.
    - **3x Boda Refills**: Buy 3x Boda rides in the Garage for KSh 800.
- **Authentic Brand Billboards & Highway Advertising**:
  - **Safaricom**: Real branding with green signal wave emblem, red flourish, *"Together We Can"*, and 5G Ultra speed promo.
  - **Naivas Supermarket**: Official orange & green palette, shopping basket emblem, bold *"NAIVAS SUPERMARKET"*, and *"SAVES YOU MONEY! Karibu Tena"*.
  - **M-PESA (Safaricom)**: The famous green card with the red M-PESA ribbon badge and *"Tuma na Kupokea Pesa Rahisi"*.
  - **Equity Bank**: Maroon & gold branding with the iconic pitched roof house logo and *"Your Listening, Caring Partner"*.
  - **Matwana Culture**: High-energy street art graffiti billboard.
  - Complete 3D structures with industrial dark steel frames, dual concrete-footed support pylons, and overhead spotlight fixture bars.
- **The Nairobi Garage & Shop (Progression & Upgrades)**:
  - **Persistent KSh Bank Wallet**: Every Kenyan Shilling collected in runs is permanently banked in `localStorage` across sessions.
  - **Permanent Power-Up Upgrades (5 Tiers each)**:
    - 🚀 **Sheng Nitro**: Upgrade from 5.5s up to 12.0s duration!
    - 🧲 **Coin Magnet**: Upgrade duration from 8.0s up to 16.0s, and widen magnetic reach from 18m up to 34m (pulls across all 3 lanes!).
    - 🪙 **Score Multiplier Booster**: Permanent score multiplier boosts from 1.0x up to 3.0x.
  - **Character Outfits & Street Skins**:
    - **Street Runner** (Default): Nairobi red hoodie, electric blue snapback, denim jeans.
    - **Makanga VIP**: Classic corduroy conductor jacket, khaki trousers, gold whistle lanyard, and leather coin pouch.
    - **Cyber Matwana**: Glowing neon cyan cyber jacket, matte carbon pants, hot pink visor, and hi-tech battery pack.
  - Interactive Shop UI accessible directly from both the Start screen and Game Over screen.
- **Nganya Roof Surfing & Ramp Trucks**:
  - **Flatbed Breakdown / Recovery Ramp Trucks**: Heavy tow-trucks equipped with inclined steel diamond-tread ramps and flashing amber beacons.
  - Running up the ramp launches the player smoothly from the road asphalt onto the roofs of speeding and parked Nganyas!
  - **Multi-Tier Highway Gameplay**:
    - Sprint across the roofs of Matatus in traffic queues.
    - Leap from one bus roof to the next through the air!
    - **Rooftop Low-Clearance Sliding**: Slide under elevated overhead highway gantries and footbridge signs while on the roof to avoid getting swept off!
    - **Elevated Gold Coin Chains**: Collect high-value streaks of Kenyan Shillings floating along the bus roofs.
    - Dynamic camera elevation that floats up to give an expansive panoramic view looking down on Nairobi highway traffic.
- **Procedural Gengetone & Afrobeat Music Engine (Phase 4)**:
  - **Booming Sub-Bass Kick (808)**: Deep resonant sub-bass drops that give the authentic *"Hii nganya iko na bass"* feel!
  - **Gengetone 3-2 Dembow Rhythm**: Syncopated 16th-note kick, snare rimshot, and swinging shaker hi-hats.
  - **Dynamic Tempo Ramping**: BPM smoothly ramps from 106 up to 126 BPM as speed increases.
  - **Sheng Nitro Turbo Filter**: Resonant lowpass filter opens wide during Nitro boost for high-octane excitement!
  - **Audio Mute/Unmute**: Quick toggle button (`🔊 / 🔇`) in the HUD.
- **Road Hazards & Nairobi Street Life**:
  - Potholes with water reflections, speed bumps ("Matuta") with chevron stripes, roadside Kibandas, stacked tire barriers, and Expressway flyover pillars.
- **Visual Juice & Particles**:
  - Diesel exhaust smoke puffs from matatu exhaust pipes, sneaker slide sparks & dust, Sheng Nitro speed streaks with dynamic camera FOV expansion, and camera trauma screen shake.

---

## 🕹️ Controls

| Action | Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Switch Lane Left** | `A` or `←` | Swipe Left or tap `◀` |
| **Switch Lane Right** | `D` or `→` | Swipe Right or tap `▶` |
| **Jump** | `W`, `↑`, or `Space` | Swipe Up or tap `▲` |
| **Slide / Fast Fall** | `S` or `↓` | Swipe Down or tap `▼` |
| **Start / Restart** | `Enter`, `Space` | Tap button on screen |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```
