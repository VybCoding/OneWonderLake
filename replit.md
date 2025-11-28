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

### Branding
- **Logo**: Official One Wonder Lake logo displayed prominently in all page headers
- **Logo Sizing**: Responsive sizing (h-20 mobile, h-28 desktop) with snug header fit
- **Consistent Branding**: Logo appears on main site navbar and admin dashboard header

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

#### Admin Map Visualization
An interactive map tab in the admin dashboard displaying color-coded pins to visualize community sentiment geographically:
- **Green pins**: Residents interested in annexation
- **Red pins**: Residents not interested in annexation  
- **Grey pins**: Searched addresses with no expressed preference
The map includes the village boundary overlay, summary statistics cards, and clickable popups showing address details. Coordinates are captured during address lookups and stored with interest submissions for geographic analysis.

#### Enhanced FAQ Section with Community Questions
Combines static and dynamic content with search, category filters, and "New" / "Popular" badges. A "Have More Questions?" chat interface allows users to submit questions, with smart suggestions and rate limiting. FAQ items can include optional `linkTo` properties to deep-link to other tools (e.g., the Tax Estimator from property tax questions).

#### Admin Questions Management
New admin tabs for managing community questions: "Questions" to view, answer, and publish submitted questions, and "Published FAQs" to manage dynamic FAQs, including adding new ones and tracking view counts.

#### Admin Email Communications (Bidirectional)
A comprehensive email tab in the admin dashboard with full bidirectional email capabilities:
- **Inbox**: View received emails sent to contact@onewonderlake.com with read/unread status and reply functionality
- **Sent**: Track all outgoing emails with recipient, subject, status, and timestamp
- **Quick Reply**: Click-to-compose email responses to recent form submissions (interested parties and community questions)
- **Compose Email**: Full email composition with HTML support for formatted messages
- **Reply to Inbound**: Reply directly to emails received in the inbox, with original message quoted
- **Resend Integration**: Uses Resend API for reliable email delivery from contact@onewonderlake.com
- **Usage Tracking**: Monthly email counter (sent + received) with visual progress bar
- **Auto-Shutoff**: Email sending pauses at 2,500/month to stay within free tier (3,000 limit)
- **Webhook Security**: Svix signature verification protects the inbound webhook endpoint
The system only sends emails to users who have given contact consent and have not unsubscribed.

**Webhook Configuration (Completed)**:
- Endpoint URL: `https://onewonderlake.replit.app/api/webhooks/resend`
- Event: `email.received`
- Webhook secret stored as `RESEND_WEBHOOK_SECRET` environment variable

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
- **Email**: Resend API with bidirectional webhook support

### Database Schema
- `interested_parties`: Stores resident interest/disinterest, contact info, source, consent, unsubscribe data, and geocoded coordinates (latitude/longitude) for map visualization.
- `searched_addresses`: Records address lookups, result types, timestamps, and geocoded coordinates.
- `community_questions`: Stores submitted questions, submitter info, category, status, answer, and consent data.
- `dynamic_faqs`: Stores FAQ content, category, view count, and creation metadata.
- `email_correspondence`: Tracks all sent emails including recipient, subject, body, status, Resend message ID, and relationships to interested parties or community questions.
- `inbound_emails`: Stores received emails from contact@onewonderlake.com including sender info, subject, body (fetched via Resend API with retry), read/replied status, reply associations, and debug payload.
- `email_usage`: Tracks monthly email counts (sent + received) for usage monitoring and auto-shutoff enforcement.
- `contacts`: Unified contact management table aggregating data from interested parties, community questions, and inbound emails. Includes marketing opt-out tracking and bulk messaging support.

## External Dependencies
- **Mapping**: OpenStreetMap (tiles for Leaflet)
- **Geocoding**: OpenStreetMap Nominatim API
- **Geospatial Analysis**: Turf.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth (OIDC)
- **Email Service**: Resend API
- **Webhook Verification**: Svix
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React

## Version History
- **v1.3.0** (2025-11-28): 
  - Added unified Contacts tab with CRUD operations and bulk messaging
  - Master-detail inbox layout with click-to-read and inline reply
  - Email body fetching with retry mechanism (Resend API timing fix)
  - Delete functionality for inbound emails
  - Admin footer with branding
- **v1.2.1** (2025-11-28): Email tab now shows unread inbox count as notification badge instead of total usage
- **v1.2.0** (2025-11-28): Added logo branding to all page headers, configured Resend webhook for bidirectional email
- **v1.1.x**: Bidirectional email system with inbox, usage tracking, and auto-shutoff
- **v1.0.x**: Initial release with address checker, interest forms, admin dashboard, and FAQ system
