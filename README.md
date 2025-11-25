# One Wonder Lake - Civic Advocacy & Annexation Campaign

A data-driven civic advocacy website powered by interactive geospatial analysis, resident interest tracking, and admin dashboard for campaign management.

## 🎯 Mission

Unite currently unincorporated neighborhoods—specifically "doughnut hole" islands and edge subdivisions—under a single Wonder Lake village government to:
- **Bring tax dollars home** (capture LGDF state funds)
- **Gain a voice** (voting rights and representation)
- **Define our future** (local self-determination)
- **Establish local control** (unified code enforcement, property rights protection)
- **Improve safety & services** (dedicated policing, community amenities)
- **Golf cart freedom** (local ordinance benefits)

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

- **Interest Tracking System** ✅ **WORKING**:
  - Residents can express interest in annexation via dialog forms
  - Interest form appears in Address Checker (for unincorporated addresses) and Tax Estimator (after calculation)
  - Collects name, email, address, phone (optional), and notes
  - All data stored in PostgreSQL database with source tracking
  - Security features: rate limiting (5 submissions/hour per IP), input validation with length constraints, duplicate email detection

- **Admin Dashboard** (`/admin`) ✅ **FUNCTIONAL**:
  - Protected access via Replit Auth (Google, GitHub, email/password login)
  - Admin access controlled via user database flag (granular permission control)
  - Real-time display of all interested parties with detailed stats
  - Source breakdown (Address Checker vs Tax Estimator submissions)
  - Comprehensive table view with contact info, address, notes, and submission date
  - Campaign organizers can review, search, and export resident interest data
  - Authorized admins: ddycus@gmail.com, developerdeeks@gmail.com

- **Benefits Grid**: Six interactive pillar cards explaining annexation advantages:
  - Bring State Tax Dollars Home (LGDF funding)
  - Gain a Voice (Representation & Voting)
  - Define Our Future (Self-Determination)
  - Establish Local Control (Code Enforcement & Rights)
  - Improve Safety & Services (Policing & Amenities)
  - Golf Cart Freedom (Local Ordinance Benefits)
  - Each card clickable with in-depth content dialog

### Identified Data Insights
- **3 unincorporated doughnut holes** identified meeting force-annexation criteria:
  - Island 1: ~9 acres
  - Island 2: ~3 acres
  - Island 3: <1 acre

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation & Running (Development)
```bash
npm install
npm run dev
```

The app starts on `http://localhost:5000` with both backend (Express) and frontend (Vite) running on the same port.

### Building & Deploying (Production)
```bash
npm run build
npm start
```

The production server automatically binds to `0.0.0.0` and uses the `PORT` environment variable for deployment compatibility. Production startup logs include database initialization diagnostics to help troubleshoot deployment issues.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM ✅ **VERIFIED WORKING**
- **Authentication**: Replit Auth (OIDC) for admin access
- **Mapping**: Leaflet 4.2.1 + react-leaflet with OpenStreetMap tiles
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js (point-in-polygon detection)
- **Data**: Official GeoJSON municipal boundary

### Project Structure
```
client/src/
├── components/
│   ├── AddressChecker.tsx      ← Main tool with map integration + interest form
│   ├── WonderLakeMap.tsx       ← Interactive Leaflet map (locked zoom)
│   ├── TaxEstimator.tsx        ← Post-annexation tax calculator + interest form
│   ├── InterestForm.tsx        ← Reusable interest submission dialog
│   ├── BenefitsGrid.tsx        ← Six pillar cards with click-to-expand dialogs
│   ├── FAQ.tsx                 ← 11-item persuasive FAQ
│   ├── Hero.tsx                ← Campaign hero section
│   ├── Mission.tsx, Vision.tsx ← Core messaging
│   └── Navbar.tsx, Footer.tsx
├── data/
│   ├── village-data.ts         ← Exports official boundary GeoJSON
│   └── wonder-lake-boundary.json ← Official municipal boundary
└── pages/
    ├── home.tsx                ← Main landing page (Mission, Benefits, Address Check, FAQ, Vision)
    ├── tax-estimator.tsx       ← Dedicated tax calculator page
    └── admin.tsx               ← Protected admin dashboard (Replit Auth required)

server/
├── routes.ts                   ← API endpoints for address checking, tax estimation, interest submissions, admin data
├── storage.ts                  ← Database storage interface using Drizzle ORM
├── db.ts                       ← Database initialization with diagnostic logging
├── app.ts                      ← Express app setup and middleware
├── index-dev.ts                ← Development server entry point
└── index-prod.ts               ← Production server with startup diagnostics

shared/
└── schema.ts                   ← Drizzle ORM schema definitions and Zod validation schemas
```

### Data Flow
1. User enters address → Nominatim geocodes to coordinates
2. Turf.js performs point-in-polygon check against boundary
3. Marker placed on Leaflet map
4. Result shown visually (color-coded) + text confirmation
5. If interested, user fills form in dialog → Rate-limited API submission
6. Data stored in PostgreSQL with IP-based rate limiting and duplicate detection
7. Admin logs in via Replit Auth, accesses `/admin` dashboard
8. Admin can view all submissions in real-time with full details

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
- [ ] Email campaign integration (Resend)

### Phase 5: Advanced Intelligence
- [ ] Property Title Integration
- [ ] Public Meeting Scheduler
- [ ] Resident testimonial video gallery

## 💾 Database

Uses PostgreSQL (Neon-backed) with Drizzle ORM for:
- **Interested Parties**: Stores resident interest submissions with contact info, source tracking, and timestamp ✅ **LOGGING CONFIRMED**
- **Users**: Stores admin user credentials with role/permission flags (isAdmin)
- **Future expansion**: Can add pledge tracking, event registrations, and campaign metrics

## 🔐 Security & Access Control

### Admin Access
- **Authentication**: Replit Auth (Google, GitHub, email/password) protects admin dashboard
- **Authorization**: Admin access controlled via `isAdmin` database flag
- **Current Admin Users**: 
  - ddycus@gmail.com
  - developerdeeks@gmail.com

### Data Security Features
- **Rate Limiting**: 5 submissions per IP per hour on interest form endpoint
- **Input Validation**: Strict length constraints on all form fields (name, email, address, phone, notes)
- **Duplicate Detection**: Prevents duplicate email submissions, returns helpful message
- **Dialog Z-index**: Interest form dialog uses z-[9999] to ensure visibility above map

### Production Deployment
- **Server Binding**: Automatically binds to `0.0.0.0` for Autoscale deployment compatibility
- **Port Configuration**: Uses `PORT` environment variable (defaults to 5000)
- **Startup Diagnostics**: Logs database initialization, static files, and server readiness to help troubleshoot deployment issues
- **Environment Variables**: DATABASE_URL and all secrets properly configured

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
5. All form submissions use Drizzle ORM schema validation via `drizzle-zod`

## 📞 Support & Contact

For questions about the campaign or technical implementation, refer to the project documentation or contact the development team.

---

## 📝 Navigation Structure

The website uses a hybrid navigation model:

### Single-Page Sections (Home Route `/`)
- **Mission**: Campaign core messaging
- **Benefits**: Six interactive pillar cards (Tax, Representation, Self-Determination, Local Control, Safety, Golf Carts)
- **Address Check**: Interactive address eligibility checker with live map
- **FAQ**: 11-item myth-busting accordion
- All scroll-to-section navigation via navbar

### Dedicated Pages
- **Tax Estimator** (`/tax-estimator`): Full-page property tax calculation tool with comprehensive breakdown
- **Admin Dashboard** (`/admin`): Protected admin panel for reviewing interested parties (requires Replit Auth with admin privileges)

Navigation automatically adjusts: scroll links work on home page, page links navigate to dedicated pages.

---

**Last Updated**: November 25, 2024  
**Status**: ✅ Production Ready - All Core Features Functional  
**Current Version**: 4.1 (Interest Tracking + Admin Dashboard + Production Deployment)
