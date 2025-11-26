# One Wonder Lake - Civic Advocacy & Annexation Campaign

## Overview
One Wonder Lake is a data-driven civic advocacy website and political campaign focused on facilitating municipal annexation in Wonder Lake, Illinois. The platform aims to unite unincorporated neighborhoods with the village government to capture state tax dollars, gain political representation, establish local control, improve safety and services, and define the community's future. It utilizes geospatial analysis and interactive mapping to educate residents, gather support, and understand community sentiment towards a unified village structure.

## User Preferences
- Professional governmental aesthetic (no flashy colors or animations)
- Accessibility-first design (readable by all demographics including seniors)
- Transparent data sourcing (use official municipal boundaries, cite sources)
- Mobile-friendly (many residents will view on phones)

## System Architecture

### UI/UX Decisions
The platform features a responsive civic design with a deep lake blue theme, prioritizing accessibility and mobile-first interaction. UI components are built with Shadcn/ui. Interactive maps use Leaflet with OpenStreetMap, with zoom/drag locked to enhance user experience.

### Technical Implementations

#### Address Eligibility Checker
An interactive tool using OpenStreetMap geocoding and Turf.js to classify addresses for annexation eligibility. It checks against 30 neighboring McHenry County municipalities, identifies "doughnut hole" islands, and uses a 2-mile distance filter. Features include optimized search, intelligent address normalization, and "Did you mean?" suggestions.

#### Interactive Map
Displays official village boundaries (GeoJSON) and address markers with visual feedback.

#### Property Tax Estimator
Calculates post-annexation taxes based on Equalized Assessed Value (EAV) and current tax bills, including a lookup guide for McHenry County property data.

#### Dual Interest/Disinterest Tracking System
Allows residents to express both interest and disinterest in annexation via forms. Submissions include a boolean field for sentiment tracking and are stored in a PostgreSQL database with source tracking.

#### Address Search Analytics
All address lookups are tracked in the database, recording address, result type, municipality name, and timestamp for campaign analytics.

#### Admin Dashboard (Community Sentiment Dashboard)
A protected `/admin` panel using Replit Auth for campaign organizers. It features statistics cards for interested/not interested counts and total address searches, a clickable filter system for responses, and separate tabs for detailed responses and address search logs. Both tabs support CSV export.

#### Enhanced FAQ Section with Community Questions
Combines static and dynamic content with search, category filters, and "New" / "Popular" badges. A "Have More Questions?" chat interface allows users to submit questions, with smart suggestions and rate limiting.

#### Admin Questions Management
New admin tabs for managing community questions: "Questions" to view, answer, and publish submitted questions, and "Published FAQs" to manage dynamic FAQs, including adding new ones and tracking view counts.

#### Campaign Arguments (Mission Pillars)
Six clickable pillars on the homepage provide in-depth content on key annexation benefits, such as "Bring State Tax Dollars Home" and "Improve Safety & Services".

#### Interactive Fund Revenue Calculator
A slider-based calculator embedded in the "Bring State Tax Dollars Home" pillar allows users to adjust population and see real-time LGDF and MFT revenue calculations.

#### Privacy & Consent Compliance
All forms require explicit consent checkboxes. A secure unsubscribe system with cryptographic tokens and a dedicated `/unsubscribe` page is implemented. The database tracks `contactConsent`, `unsubscribed`, and `unsubscribeToken` for privacy compliance.

### Feature Specifications
- **Precise Boundary Detection**: Uses official GeoJSON data for village and county boundaries.
- **Doughnut Hole Detection**: Identifies unincorporated islands surrounded by the village.
- **Data Analysis**: Geospatial analysis for statutory annexation requirements.

### System Design Choices
Full-stack JavaScript setup:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Replit Auth

### Database Schema
- `interested_parties`: Stores resident interest/disinterest, contact info, source, consent, and unsubscribe data.
- `searched_addresses`: Records address lookups, result types, and timestamps.
- `community_questions`: Stores submitted questions, submitter info, category, status, answer, and consent data.
- `dynamic_faqs`: Stores FAQ content, category, view count, and creation metadata.

## External Dependencies
- **Mapping**: OpenStreetMap (tiles for Leaflet)
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React