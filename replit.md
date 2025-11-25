# One Wonder Lake - Civic Advocacy & Annexation Campaign

## Project Overview
One Wonder Lake is a data-driven civic advocacy website and political campaign focused on municipal annexation in Wonder Lake, Illinois. The platform has evolved from a general informational site into a targeted annexation tool backed by geospatial analysis and interactive mapping.

## Core Mission
Unite currently unincorporated neighborhoods—specifically "doughnut hole" islands and edge subdivisions like Deep Spring Woods and Sunrise Ridge—under a single Wonder Lake village government.

## Key Campaign Arguments

### 1. Bringing Tax Dollars Home
Capture LGDF (Local Government Distributive Fund) money that currently stays with the state to fund Wonder Lake infrastructure and services.

### 2. Local Control & Property Rights
Use Pre-Annexation Agreements to "grandfather" existing rural liberties (sheds, fences, etc.) while ensuring unified code enforcement protects property values.

### 3. Improved Safety & Services
Replace sporadic County Sheriff coverage with dedicated Village policing and fund local amenities like playgrounds and green spaces.

### 4. The "Inevitability" Argument
For residents in identified "force annexation" zones (<60 acres, wholly surrounded), voluntary annexation allows them to negotiate terms now rather than facing involuntary inclusion later.

## Technical Implementation

### Current Features (Completed)
- ✅ **Address Eligibility Checker**: Interactive tool using OpenStreetMap geocoding + Turf.js to check if an address is inside/outside village boundaries
- ✅ **Interactive Map**: Leaflet + OpenStreetMap integration showing official village boundary and address markers
- ✅ **Precise Boundary Detection**: Uses official Village municipal boundary GeoJSON data
- ✅ **Doughnut Hole Detection**: Successfully identifies unincorporated islands wholly surrounded by the village
- ✅ **Responsive Civic Design**: Professional governmental aesthetic with deep lake blue theme

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: Shadcn/ui components
- **Mapping**: Leaflet + react-leaflet with OpenStreetMap tiles
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js for point-in-polygon calculations
- **Data**: Official GeoJSON municipal boundary data

### Data Analysis Findings
Based on geospatial analysis, the system has identified:
- **3 specific unincorporated islands** meeting statutory requirements for involuntary annexation:
  - Island 1: ~9 acres
  - Island 2: ~3 acres
  - Island 3: <1 acre

### Strategic Roadmap (Future Features)

#### Phase 2: Enhanced Mapping & Analytics
- [ ] **"Domino Strategy" Map**: Identify "key connector" properties that, once annexed, unlock landlocked neighbors for eligibility
- [ ] **Island Visualization**: Color-coded overlay showing the 3 identified "force annexation" doughnut holes
- [ ] **Subdivision Boundaries**: Add Deep Spring Woods, Sunrise Ridge, and other target subdivision boundaries

#### Phase 3: Progress Tracking
- [ ] **"Race to 51%" Trackers**: Visual progress bars for specific subdivisions showing proximity to simple majority needed for annexation
- [ ] **Live Statistics Dashboard**: Track annexation pledges, petition signatures, community engagement metrics

#### Phase 4: Legal & Outreach Tools
- [ ] **Pre-Annexation Agreement Templates**: Downloadable legal templates to ease resident property rights concerns
- [ ] **"Visualizing the Wallet" Calculator**: Compare actual tax bills to combat financial misinformation
- [ ] **Email Campaign Integration**: Direct outreach tools for residents in identified zones

#### Phase 5: Advanced Intelligence
- [ ] **Property Title Integration**: Use generated location descriptions for formal annexation ordinance planning
- [ ] **Public Meeting Scheduler**: Coordinate community town halls and Q&A sessions

## File Structure

### Key Files
- `client/src/components/AddressChecker.tsx`: Main address checking interface with map integration
- `client/src/components/WonderLakeMap.tsx`: Leaflet map component displaying boundary and markers
- `client/src/data/village-data.ts`: Exports official village boundary GeoJSON
- `client/src/data/wonder-lake-boundary.geojson`: Official municipal boundary data
- `design_guidelines.md`: Complete design system and brand guidelines

### Page Components
- `Hero.tsx`: Campaign tagline and primary CTA
- `Mission.tsx`: Core messaging about annexation benefits
- `BenefitsGrid.tsx`: Three-pillar benefit cards (Tax, Control, Safety)
- `FAQ.tsx`: Myth-busting accordion for common concerns
- `Vision.tsx`: Community future messaging
- `Footer.tsx`: Basic footer with attribution

## Development

### Running Locally
The project uses a full-stack JavaScript setup:
```bash
npm run dev
```
This starts both Express backend (for future API needs) and Vite frontend on the same port.

### Storage Strategy
Currently using in-memory storage (MemStorage) for any data persistence needs. Can be upgraded to PostgreSQL database if campaign tracking features are added.

### Design System
- **Primary Color**: Deep Lake Blue (#005f73) - Primary buttons, navbar
- **Accent Color**: Teal (#94d2bd) - Hover states, map highlights
- **Background**: Clean white with subtle teal tints for section backgrounds
- **Typography**: System sans-serif stack optimized for accessibility
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

## User Workflow

1. **Visit Homepage** → See hero message and campaign pillars
2. **Enter Address** → Type Wonder Lake address in checker
3. **View Map Result** → See marker on interactive map showing position relative to village boundary
4. **Check Status** → Get visual + text confirmation if inside village or in annexation zone
5. **Learn Benefits** → Scroll through benefits, FAQ, and vision sections

## Civic Impact Goals

### Short-term
- Educate 500+ unincorporated residents about annexation benefits
- Collect 200+ petition signatures supporting voluntary annexation
- Identify and contact residents in the 3 "force annexation" islands

### Medium-term
- Achieve 51% support in target subdivisions (Sunrise Ridge, Deep Spring Woods)
- Facilitate 10+ Pre-Annexation Agreements with concerned property owners
- Host 5+ community town halls explaining the initiative

### Long-term
- Successfully annex all identified "doughnut hole" islands
- Create unified Wonder Lake village serving 2,000+ total residents
- Demonstrate successful civic tech + grassroots organizing model for other communities

## Recent Changes
- **2024-11-25**: Expanded FAQ section from 4 to 11 items with persuasive content addressing LGDF funding, force annexation reality, Pre-Annexation Agreements, property values, and common resident concerns
- **2024-11-25**: Integrated Leaflet mapping with official GeoJSON boundary data
- **2024-11-25**: Replaced mock rectangular boundary with actual municipal boundary polygon
- **2024-11-25**: Added interactive map showing real-time address checking with visual markers

## User Preferences
- Professional governmental aesthetic (no flashy colors or animations)
- Accessibility-first design (readable by all demographics including seniors)
- Transparent data sourcing (use official municipal boundaries, cite sources)
- Mobile-friendly (many residents will view on phones)
