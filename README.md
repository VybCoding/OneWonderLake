# One Wonder Lake - Civic Advocacy & Annexation Campaign

A data-driven civic advocacy website powered by interactive geospatial analysis, resident interest tracking, community Q&A, and admin dashboard for campaign management.

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

#### Core Tools
- **Address Eligibility Checker**: Users enter their address to see if they're inside or outside village boundaries
- **Interactive Map**: Real-time Leaflet + OpenStreetMap display showing:
  - Official village boundary (GeoJSON-based)
  - Address location markers with zoom-to-marker functionality
  - Map locked at optimal zoom level (scroll-wheel zoom, double-click zoom, touch zoom, and dragging disabled)
  - Visual result indicators (green = resident, yellow = annexation zone)
  
- **Property Tax Estimator** (`/tax-estimator`): Dedicated calculator page featuring:
  - Equalized Assessed Value (EAV) input field
  - Current annual tax bill entry
  - Post-annexation tax calculation using Village levy rate
  - Step-by-step guide to finding property info on McHenry County portal
  - Interactive tax breakdown pinwheel chart
  - Detailed breakdown showing Village levy amount and monthly impact

- **Precise Geospatial Detection**: Uses official municipal boundary polygon (not mock data)
- **Responsive Civic Design**: Professional governmental aesthetic, mobile-friendly

#### Homepage Features
- **Benefits Grid**: Six interactive pillar cards explaining annexation advantages:
  - Bring State Tax Dollars Home (LGDF & MFT funding)
  - Gain a Voice (Representation & Voting)
  - Define Our Future (Self-Determination)
  - Establish Local Control (Code Enforcement & Rights)
  - Improve Safety & Services (Policing & Amenities)
  - Golf Cart Freedom (Local Ordinance Benefits)
  - Each card clickable with in-depth content dialog

- **Interactive Fund Revenue Calculator** (embedded in "Bring State Tax Dollars Home" popup):
  - Slider-based calculator for population 1-6,000 residents
  - Real-time LGDF revenue calculation ($178 per resident/year)
  - Real-time MFT revenue calculation ($22.50 per resident/year)
  - Visual progress bars showing proportional revenue growth
  - Combined total annual revenue display
  - Detailed LGDF Key Points (Village usage flexibility: operations, public safety, parks, programs)
  - Detailed MFT Key Points (transportation-restricted: roads, sidewalks, snow removal, signals)
  - Census timing callout explaining 2030 Census deadline and special census costs ($15-25/household)

- **Homepage Call-to-Action Buttons**:
  - "Check My Address" button links to Address Checker
  - "Estimate My Taxes" button links to Tax Estimator Tool
  - Even spacing with icons for visual distinction
  - Responsive layout (stacks on mobile, side-by-side on desktop)

- **"Have More Questions?" Section**: 
  - Chat-style input box below the Benefits Grid
  - Allows residents to ask questions directly on the homepage
  - Questions automatically save to database for admin review
  - Opens question submission form with category selection
  - Rate limiting (5 submissions per hour per IP)

#### Interest & Disinterest Tracking
- **Dual Sentiment System**: Residents can express BOTH interest AND disinterest in annexation
- **Two-Button Interface**: Thumbs up ("I'm Interested") and thumbs down ("I'm NOT Interested")
- **Multiple Submission Points**:
  - Address Checker (after checking address)
  - Tax Estimator (after calculation)
  - Homepage "Have More Questions?" section
  - Comprehensive FAQ page
- **Context-Aware Forms**: Appropriate messaging for each sentiment
- **Database Tracking**: All submissions tracked with source and timestamp
- **Security Features**: Rate limiting, input validation, duplicate detection

#### Comprehensive FAQ System (`/more-info`)
- **Static FAQ Items**: 11+ myth-busting answers addressing resident concerns
- **Dynamic FAQs**: Community-submitted questions published as FAQ items
- **Search & Filter Features**:
  - Real-time search input filters FAQs by question and answer content
  - Category tabs (All, General, Taxes, Property Rights, Services)
  - "New" badge on FAQs created within last 7 days
  - "Popular" badge on FAQs with high view counts

- **Community Question Submission**:
  - Chat-style interface with smart suggestions
  - Question submission form with category selection
  - Collects name, email, optional phone/address
  - Questions saved to database for admin review
  - Rate limiting: 5 submissions per hour per IP

#### Admin Dashboard (`/admin`)
**Protected Access**: Replit Auth (Google, GitHub, email/password login)

**Community Sentiment Dashboard - Key Metrics**:
- **Interested Count**: Total residents interested in annexation
- **Not Interested Count**: Total residents expressing concerns
- **Pending Questions**: Community questions awaiting admin response
- **Published FAQs**: Total dynamic FAQs created from community questions
- **Address Searches**: Total address lookups performed
- **From Tax Estimator**: Submissions specifically from tax calculator

**Clickable Stat Cards with Navigation**:
- Click "Interested" → Filters responses to interested residents + switches to Responses tab
- Click "Not Interested" → Filters responses to disinterested residents + switches to Responses tab
- Click "Pending Questions" → Switches to Questions tab
- Click "Published FAQs" → Switches to Published FAQs tab
- Click "Address Searches" → Switches to Address Searches tab

**Responses Tab**:
- Table view with: Name, Email, Address, Interest Status, Phone, Source, Date, Notes
- Color-coded badges (green "Yes" for interested, red "No" for not interested)
- Click rows to view full details in dialog
- CSV export functionality with Interest Status column
- Filter by Interested/Not Interested with visual ring highlights

**Questions Tab**:
- View all community questions organized by status:
  - Pending (amber highlight)
  - Answered (review-ready)
  - Published (shown with checkmark)
- Click "Answer" to respond to questions
- Edit question text and category before answering
- Click "Publish to FAQ" to make answered questions public
- Admin can delete inappropriate questions with confirmation

**Published FAQs Tab**:
- View all dynamic FAQs from published community questions
- Add new FAQs directly (without community question)
- Delete FAQs with confirmation
- View counts displayed for each FAQ
- Track FAQ performance and popularity

**Address Searches Tab**:
- View all address lookups with result type badges
- Shows: Address, Result Type, Municipality, Date
- CSV export functionality

---

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

The production server automatically binds to `0.0.0.0` and uses the `PORT` environment variable for deployment compatibility.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Replit Auth (OIDC) for admin access
- **Mapping**: Leaflet 4.2.1 + react-leaflet with OpenStreetMap tiles
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js (point-in-polygon detection)
- **Data**: Official GeoJSON municipal boundary

### Project Structure
```
client/src/
├── components/
│   ├── Hero.tsx                    ← Homepage hero with dual CTA buttons
│   ├── BenefitsGrid.tsx            ← Six benefit pillars + "Have More Questions?" section
│   ├── FundRevenueCalculator.tsx   ← Interactive LGDF/MFT slider calculator
│   ├── AddressChecker.tsx          ← Main tool with map integration + interest form
│   ├── WonderLakeMap.tsx           ← Interactive Leaflet map
│   ├── TaxEstimator.tsx            ← Tax calculator with interest tracking
│   ├── TaxBreakdownPinwheel.tsx    ← Donut chart visualization
│   ├── FAQ.tsx                     ← Dynamic FAQ with search/filter
│   ├── QuestionForm.tsx            ← Question submission dialog with category selection
│   └── Navbar.tsx, Footer.tsx      ← Navigation components
├── data/
│   ├── village-data.ts             ← Official boundary GeoJSON
│   └── wonder-lake-boundary.json   ← Municipal boundary
└── pages/
    ├── home.tsx                    ← Landing page
    ├── more-info.tsx               ← FAQ page
    ├── tax-estimator.tsx           ← Tax calculator page
    └── admin.tsx                   ← Admin dashboard

server/
├── routes.ts                       ← API endpoints
├── storage.ts                      ← Database interface using Drizzle ORM
├── db.ts                           ← Database initialization
└── app.ts                          ← Express app setup

shared/
└── schema.ts                       ← Drizzle ORM schemas + Zod validation
```

### Database Schema
- **interested_parties**: Resident interest submissions with sentiment tracking
- **searched_addresses**: Address lookup analytics
- **community_questions**: User-submitted questions (pending, answered, published)
- **dynamic_faqs**: Published FAQs from community questions or admin-created

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

## 💾 Database

Uses PostgreSQL (Neon-backed) with Drizzle ORM for:
- **Interested Parties**: Resident interest/disinterest submissions
- **Searched Addresses**: Address lookup analytics
- **Community Questions**: User-submitted questions with admin responses
- **Dynamic FAQs**: Published FAQs from community questions
- **Users**: Admin credentials with permission flags

## 🔐 Security & Access Control

### Admin Access
- **Authentication**: Replit Auth protects admin dashboard
- **Authorization**: Admin access controlled via `isAdmin` database flag
- **Current Admin Users**: ddycus@gmail.com, developerdeeks@gmail.com

### Data Security
- **Rate Limiting**: 5 submissions per IP per hour
- **Input Validation**: Strict length constraints on all form fields
- **Duplicate Detection**: Prevents duplicate email submissions
- **Z-index Management**: Ensures all dropdowns appear above dialogs

## 👥 Contributing

1. Follow code conventions in existing components (React hooks, Tailwind, Shadcn/ui)
2. Add `data-testid` attributes to interactive elements
3. Keep components focused and collapsible
4. Refer to `design_guidelines.md` for styling standards
5. All form submissions use Drizzle ORM schema validation

## 📞 Support & Contact

For questions about the campaign or technical implementation, refer to the project documentation or contact the development team.

---

## 📝 Navigation Structure

### Single-Page Sections (Home Route `/`)
- **Mission**: Campaign core messaging
- **Benefits**: Six interactive pillar cards
- **"Have More Questions?"**: Direct question submission on homepage
- **Address Check**: Interactive address eligibility checker with map
- **FAQ**: Dynamic FAQ with search/filter

### Dedicated Pages
- **More Info** (`/more-info`): Comprehensive FAQ page with community questions
- **Tax Estimator** (`/tax-estimator`): Full-page property tax calculation tool
- **Admin Dashboard** (`/admin`): Protected admin panel (Replit Auth required)

---

**Last Updated**: November 26, 2025  
**Status**: ✅ Production Ready - All Features Functional  
**Current Version**: v1.1.134 (Interactive Fund Revenue Calculator, LGDF/MFT Details, Census Timing)
