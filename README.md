# One Wonder Lake - Civic Advocacy & Annexation Campaign

A data-driven civic advocacy website powered by interactive geospatial analysis and mapping technology.

## 🎯 Mission

Unite currently unincorporated neighborhoods—specifically "doughnut hole" islands and edge subdivisions—under a single Wonder Lake village government to:
- **Bring tax dollars home** (capture LGDF state funds)
- **Establish local control** (unified code enforcement, property rights protection)
- **Improve safety & services** (dedicated policing, community amenities)

## ✅ Current Status

### Completed Features
- **Address Eligibility Checker**: Users enter their address to see if they're inside or outside village boundaries
- **Interactive Map**: Real-time Leaflet + OpenStreetMap display showing:
  - Official village boundary (GeoJSON-based)
  - Address location markers with zoom-to-marker functionality
  - Map locked at optimal zoom level (scroll-wheel zoom, double-click zoom, touch zoom, and dragging disabled)
  - Visual result indicators (green = resident, yellow = annexation zone)
- **Property Tax Estimator**: Dedicated calculator page featuring:
  - Equalized Assessed Value (EAV) input field
  - Current annual tax bill entry
  - Post-annexation tax calculation using Village levy rate ($0.2847 per $100 EAV)
  - Step-by-step guide to finding property info on McHenry County portal
  - Detailed breakdown showing Village levy amount, percentage increase, and monthly impact
- **Precise Geospatial Detection**: Uses official municipal boundary polygon (not mock data)
- **Responsive Civic Design**: Professional governmental aesthetic, mobile-friendly
- **Comprehensive FAQ (11 Items)**: Myth-busting answers addressing resident concerns:
  - LGDF funding benefits and multiplier effects
  - Force annexation legal reality (65 ILCS 5/7-1-13)
  - Pre-Annexation Agreements for property protection
  - Property value impacts of annexation
  - Property rights and code enforcement
  - Community policing benefits
  - Tax implications
  - Local vs. county government control
  - Status quo risks and urgency
  - Current resident benefits

### Identified Data Insights
- **3 unincorporated doughnut holes** identified meeting force-annexation criteria:
  - Island 1: ~9 acres
  - Island 2: ~3 acres
  - Island 3: <1 acre

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation & Running
```bash
npm install
npm run dev
```

The app starts on `http://localhost:5000` with both backend (Express) and frontend (Vite) running on the same port.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Mapping**: Leaflet 4.2.1 + react-leaflet with OpenStreetMap tiles
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js (point-in-polygon detection)
- **Data**: Official GeoJSON municipal boundary

### Project Structure
```
client/src/
├── components/
│   ├── AddressChecker.tsx      ← Main tool with map integration
│   ├── WonderLakeMap.tsx       ← Interactive Leaflet map (locked zoom)
│   ├── TaxEstimator.tsx        ← Post-annexation tax calculator
│   ├── FAQ.tsx                 ← 11-item persuasive FAQ
│   ├── Hero.tsx                ← Campaign hero section
│   ├── BenefitsGrid.tsx        ← Three pillar cards
│   ├── Mission.tsx, Vision.tsx
│   └── Navbar.tsx, Footer.tsx
├── data/
│   ├── village-data.ts         ← Exports official boundary GeoJSON
│   └── wonder-lake-boundary.json ← Official municipal boundary
└── pages/
    ├── home.tsx                ← Main landing page (Mission, Benefits, Address Check, FAQ, Vision)
    └── tax-estimator.tsx       ← Dedicated tax calculator page
```

### Data Flow
1. User enters address → Nominatim geocodes to coordinates
2. Turf.js performs point-in-polygon check against boundary
3. Marker placed on Leaflet map
4. Result shown visually (color-coded) + text confirmation

## 📋 Design System

- **Primary**: Deep Lake Blue (#005f73) — authority, trust
- **Accent**: Teal (#94d2bd) — highlights, interactions
- **Responsive**: Mobile-first, breakpoints at 768px & 1024px
- **Accessibility**: WCAG AA compliant, readable by all demographics

See `design_guidelines.md` for complete specifications.

## 🛣️ Roadmap

### Phase 2: Enhanced Mapping & Analytics
- [ ] "Domino Strategy" Map (key connector properties)
- [ ] Island Visualization (color-coded force-annexation zones)
- [ ] Subdivision Boundaries (Deep Spring Woods, Sunrise Ridge)

### Phase 3: Progress Tracking
- [ ] "Race to 51%" progress bars per subdivision
- [ ] Live Statistics Dashboard (pledges, signatures, engagement)

### Phase 4: Legal & Outreach Tools
- [ ] Pre-Annexation Agreement templates (downloadable)
- [ ] Advanced "Visualizing the Wallet" comparisons per subdivision
- [ ] Email campaign integration

### Phase 5: Advanced Intelligence
- [ ] Property Title Integration
- [ ] Public Meeting Scheduler
- [ ] Resident testimonial video gallery

## 💾 Storage

Currently using in-memory storage. Can scale to PostgreSQL for tracking campaigns, pledges, and user engagement as features develop.

## 🧪 Testing the Address Checker

Try these Wonder Lake, IL addresses to test:
- Valid address inside boundary → Green result
- Address outside boundary → Yellow result  
- Invalid/non-existent → Error message

## 👥 Contributing

1. Follow the code conventions in existing components (React hooks, Tailwind, Shadcn/ui patterns)
2. Add `data-testid` attributes to interactive elements
3. Keep components focused and collapsible where possible
4. Refer to `design_guidelines.md` for styling standards

## 📞 Support & Contact

For questions about the campaign or technical implementation, refer to the project documentation or contact the development team.

---

## 📝 Navigation Structure

The website now uses two distinct page types:

### Single-Page Sections (Home Route `/`)
- **Mission**: Campaign core messaging
- **Benefits**: Three-pillar benefit cards (Tax, Control, Safety)
- **Address Check**: Interactive address eligibility checker with live map
- **FAQ**: 11-item myth-busting accordion
- All scroll-to-section navigation via navbar

### Dedicated Pages
- **Tax Estimator** (`/tax-estimator`): Full-page property tax calculation tool with comprehensive breakdown

Navigation automatically adjusts: scroll links work on home page, page links navigate to dedicated pages.

**Last Updated**: November 25, 2024  
**Status**: Production Ready ✅
