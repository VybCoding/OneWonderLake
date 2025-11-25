# One Wonder Lake - Civic Advocacy & Annexation Campaign

## Overview
One Wonder Lake is a data-driven civic advocacy website and political campaign aimed at facilitating municipal annexation in Wonder Lake, Illinois. Its core mission is to unite unincorporated neighborhoods, specifically "doughnut hole" islands and edge subdivisions like Deep Spring Woods and Sunrise Ridge, under a single Wonder Lake village government. The platform leverages geospatial analysis and interactive mapping to inform residents about the benefits of annexation, such as capturing state tax dollars, gaining political representation, establishing local control, improving safety and services, and defining the community's future. The project seeks to educate residents, gather support, and ultimately achieve a unified village structure.

## User Preferences
- Professional governmental aesthetic (no flashy colors or animations)
- Accessibility-first design (readable by all demographics including seniors)
- Transparent data sourcing (use official municipal boundaries, cite sources)
- Mobile-friendly (many residents will view on phones)

## System Architecture

### UI/UX Decisions
The platform features a responsive civic design with a professional governmental aesthetic, utilizing a deep lake blue theme. UI components are built with Shadcn/ui. The design prioritizes accessibility and a mobile-first approach. The interactive map uses Leaflet with OpenStreetMap tiles, with zoom and drag functionalities locked to prevent interference with page scrolling, enhancing user experience.

### Technical Implementations
- **Address Eligibility Checker**: An interactive tool using OpenStreetMap geocoding and Turf.js to classify addresses as Wonder Lake residents, other municipality residents, or eligible for annexation. It checks against 30 neighboring McHenry County municipalities and identifies "doughnut hole" islands. Includes a 2-mile distance filter to prevent lookups for addresses in other counties or states.
- **Interactive Map**: Displays official village boundaries (GeoJSON) and address markers.
- **Property Tax Estimator**: A dedicated page (`/tax-estimator`) that calculates post-annexation taxes based on Equalized Assessed Value (EAV) and current tax bills, providing a detailed breakdown and a lookup guide for McHenry County property data.
- **Interest Tracking System**: Residents can express interest via forms in the Address Checker and Tax Estimator. Submissions are stored in a PostgreSQL database with source tracking.
- **Admin Dashboard**: A protected `/admin` panel using Replit Auth (OIDC) for campaign organizers to view interested parties, statistics, and submission sources.
- **Campaign Arguments**: Presented as six clickable pillars on the homepage, each with in-depth content in a dialog: "Bring State Tax Dollars Home," "Gain a Voice (Representation)," "Define Our Future (Self-Determination)," "Establish Local Control & Protect Rights," "Improve Safety & Services," and "Golf Cart Freedom."

### Feature Specifications
- **Precise Boundary Detection**: Uses official Village municipal boundary GeoJSON data and McHenry County GIS boundary data for neighboring municipalities.
- **Doughnut Hole Detection**: Identifies unincorporated islands wholly surrounded by the village.
- **Data Analysis**: Geospatial analysis has identified three specific unincorporated islands meeting statutory requirements for involuntary annexation.

### System Design Choices
The project utilizes a full-stack JavaScript setup.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS.
- **Backend**: Express (for API routes).
- **Database**: PostgreSQL (Neon) via Drizzle ORM for data persistence.
- **Authentication**: Replit Auth for admin access.

## External Dependencies
- **Mapping**: OpenStreetMap (tiles for Leaflet)
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **UI Components**: Shadcn/ui
- **Planned Integration**: Resend (for email confirmations)