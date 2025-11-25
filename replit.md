# One Wonder Lake - Civic Advocacy & Annexation Campaign

## Overview
One Wonder Lake is a data-driven civic advocacy website and political campaign aimed at facilitating municipal annexation in Wonder Lake, Illinois. Its core mission is to unite unincorporated neighborhoods, specifically "doughnut hole" islands and edge subdivisions like Deep Spring Woods and Sunrise Ridge, under a single Wonder Lake village government. The platform leverages geospatial analysis and interactive mapping to inform residents about the benefits of annexation, such as capturing state tax dollars, gaining political representation, establishing local control, improving safety and services, and defining the community's future. The project seeks to educate residents, gather support, and understand community sentiment to achieve a unified village structure.

## User Preferences
- Professional governmental aesthetic (no flashy colors or animations)
- Accessibility-first design (readable by all demographics including seniors)
- Transparent data sourcing (use official municipal boundaries, cite sources)
- Mobile-friendly (many residents will view on phones)

## System Architecture

### UI/UX Decisions
The platform features a responsive civic design with a professional governmental aesthetic, utilizing a deep lake blue theme. UI components are built with Shadcn/ui. The design prioritizes accessibility and a mobile-first approach. The interactive map uses Leaflet with OpenStreetMap tiles, with zoom and drag functionalities locked to prevent interference with page scrolling, enhancing user experience.

### Technical Implementations

#### Address Eligibility Checker
An interactive tool using OpenStreetMap geocoding and Turf.js to classify addresses as Wonder Lake residents, other municipality residents, or eligible for annexation. Features include:
- Checks against 30 neighboring McHenry County municipalities
- Identifies "doughnut hole" islands (unincorporated areas surrounded by the village)
- 2-mile distance filter to prevent lookups for addresses in other counties or states
- **Optimized Search Performance**: Prioritized query strategy tries most specific queries first ("Address, Wonder Lake, IL") with early exit logic when valid results found, reducing lookup time significantly
- **Animated Loading State**: Subtle bouncing dots animation with "Locating your address..." message during searches
- **Intelligent Address Normalization**:
  - Direction variations: "East" ↔ "E", "North" ↔ "N", etc.
  - Street type variations: "Road" ↔ "Rd", "Drive" ↔ "Dr", etc.
  - Local name variations: "Lakeshore" ↔ "Lake Shore", "Wonder Lake" ↔ "Wonderlake"
  - Multi-attempt search strategy that tries different address formats automatically
  - Geographic bounding box to focus searches on the Wonder Lake area (lat: 42.35-42.45, lon: -88.32 to -88.42)
- **"Did you mean?" Suggestions**: When an address is found outside the service area, shows clickable alternatives within Wonder Lake that the user can select

#### Interactive Map
Displays official village boundaries (GeoJSON) and address markers with visual feedback for different result types.

#### Property Tax Estimator
A dedicated page (`/tax-estimator`) that calculates post-annexation taxes based on Equalized Assessed Value (EAV) and current tax bills, providing a detailed breakdown and a lookup guide for McHenry County property data.

#### Dual Interest/Disinterest Tracking System
Residents can express BOTH interest AND disinterest in annexation via forms in the Address Checker and Tax Estimator:
- **Two-Button System**: Thumbs up ("I'm Interested in Annexation") and thumbs down ("I'm NOT Interested in Annexation") buttons
- **Context-Aware Forms**: Each option opens a form with appropriate messaging:
  - Interested: "Express Your Interest" - "Join our list of residents interested in voluntary annexation"
  - Disinterested: "Express Your Disinterest" - "Help us understand concerns about annexation. Your feedback is valuable"
- **Database Tracking**: All submissions include an `interested` boolean field to track sentiment
- Submissions stored in PostgreSQL database with source tracking (address_checker or tax_estimator)

#### Address Search Analytics
All address lookups are tracked in the database regardless of whether users submit the interest form:
- Records address, result type (resident, annexation, other_municipality, outside_area, not_found)
- Municipality name if applicable
- Timestamp for each search
- Provides campaign analytics on community engagement

#### Admin Dashboard (Community Sentiment Dashboard)
A protected `/admin` panel using Replit Auth (OIDC) for campaign organizers. Features include:

**Statistics Cards**:
- **Interested Count** (green, thumbs up icon): Shows count of residents interested in annexation
- **Not Interested Count** (red, thumbs down icon): Shows count of residents not interested
- **Address Searches**: Total address lookups
- **From Address Checker**: Submissions from the address eligibility tool
- **From Tax Estimator**: Submissions from the tax calculator

**Clickable Filter System**:
- Click "Interested" card to filter table to show only interested residents (green ring highlight when active)
- Click "Not Interested" card to filter table to show only disinterested residents (red ring highlight when active)
- **Reset Filter Button**: Appears when a filter is active, allows return to full list
- Filter badge displays in table header showing current filter state
- Tab counter updates to reflect filtered count

**Responses Tab**:
- Table with columns: Name, Email, Address, Interest (with color-coded badges), Phone, Source, Date, Notes
- **Interest Column**: Green "Yes" badge with thumbs up for interested, Red "No" badge with thumbs down for not interested
- Click any row to view full details in a dialog
- **CSV Export**: Includes Interest Status column for data analysis

**Address Searches Tab**:
- View all address lookups with result type badges and timestamps
- Export to CSV functionality

#### Campaign Arguments (Mission Pillars)
Presented as six clickable pillars on the homepage, each with in-depth content in a dialog:
1. "Bring State Tax Dollars Home"
2. "Gain a Voice (Representation)"
3. "Define Our Future (Self-Determination)"
4. "Establish Local Control & Protect Rights"
5. "Improve Safety & Services"
6. "Golf Cart Freedom"

### Feature Specifications
- **Precise Boundary Detection**: Uses official Village municipal boundary GeoJSON data and McHenry County GIS boundary data for neighboring municipalities.
- **Doughnut Hole Detection**: Identifies unincorporated islands wholly surrounded by the village.
- **Data Analysis**: Geospatial analysis has identified three specific unincorporated islands meeting statutory requirements for involuntary annexation.

### System Design Choices
The project utilizes a full-stack JavaScript setup:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express (for API routes)
- **Database**: PostgreSQL (Neon) via Drizzle ORM for data persistence
- **Authentication**: Replit Auth for admin access

### Database Schema
**interested_parties table**:
- id (UUID, primary key)
- name, email, phone, address, notes (text fields)
- source (address_checker or tax_estimator)
- interested (boolean - true for interested, false for not interested)
- createdAt (timestamp)

**searched_addresses table**:
- id (UUID, primary key)
- address (text)
- result (resident, annexation, other_municipality, outside_area, not_found)
- municipalityName (optional text)
- createdAt (timestamp)

## External Dependencies
- **Mapping**: OpenStreetMap (tiles for Leaflet)
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React (ThumbsUp, ThumbsDown, RotateCcw, etc.)

## Recent Updates (November 2025)
- Added dual interest/disinterest tracking with thumbs up/down buttons
- Renamed admin dashboard to "Community Sentiment Dashboard"
- Added clickable filter cards for Interested/Not Interested with visual feedback
- Added Reset Filter button that appears when filters are active
- Added Interest column to responses table with color-coded badges
- Updated CSV export to include interest status
- Optimized address search with prioritized queries and early exit logic
- Added animated loading state with bouncing dots during address lookups
