# One Wonder Lake - Civic Advocacy & Annexation Campaign

## Overview
One Wonder Lake is a data-driven civic advocacy platform designed to facilitate municipal annexation in Wonder Lake, Illinois. Its primary purpose is to unite unincorporated neighborhoods with the village government to secure state tax dollars, gain political representation, establish local control, and improve community services and safety. The project aims to define the future of the community by educating residents through geospatial analysis and interactive mapping, gathering support, and understanding sentiment towards a unified village structure.

## Current Version
**v1.3.0** (November 28, 2025)

## User Preferences
- Professional governmental aesthetic (no flashy colors or animations)
- Accessibility-first design (readable by all demographics including seniors)
- Transparent data sourcing (use official municipal boundaries, cite sources)
- Mobile-friendly (many residents will view on phones)
- Do NOT modify opt-out checkbox structure in forms

## System Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | Shadcn/ui, Lucide React icons |
| Backend | Express.js (Node.js) |
| Database | PostgreSQL (Neon) via Drizzle ORM |
| Authentication | Replit Auth (OIDC) |
| Email Service | Resend API with bidirectional webhook |
| Webhook Security | Svix signature verification |
| Mapping | Leaflet with OpenStreetMap tiles |
| Geocoding | OpenStreetMap Nominatim API |
| Geospatial | Turf.js |

### UI/UX Design
The platform features a responsive civic design with a deep lake blue theme, prioritizing accessibility and mobile-first interaction. Interactive maps utilize Leaflet with OpenStreetMap tiles, with zoom and drag functionalities locked to enhance user experience.

### Branding
- **Logo**: Official One Wonder Lake logo in all page headers
- **Logo Sizing**: Responsive (h-20 mobile, h-28 desktop)
- **Consistent Branding**: Logo on navbar, admin header, and admin footer

## Application Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | `home.tsx` | Landing page with hero, mission pillars, address checker, FAQ, forms |
| `/admin` | `admin.tsx` | Protected admin dashboard (Replit Auth) |
| `/tax-estimator` | `tax-estimator.tsx` | Property tax estimation calculator |
| `/more-info` | `more-info.tsx` | Detailed campaign pillar content |
| `/unsubscribe` | `unsubscribe.tsx` | Secure unsubscribe with token validation |
| `*` | `not-found.tsx` | 404 error page |

## Public Features

### Address Eligibility Checker
Interactive tool using OpenStreetMap geocoding and Turf.js:
- Checks against 30 McHenry County municipalities
- Identifies "doughnut hole" islands (unincorporated areas surrounded by village)
- 2-mile distance filter from village boundary
- Intelligent address normalization and suggestions
- All searches logged with coordinates for analytics

### Property Tax Estimator
Calculates post-annexation taxes:
- Based on Equalized Assessed Value (EAV)
- Current tax breakdown by taxing district
- Village tax levy rate calculations
- Lookup guide for McHenry County property data

### Interest/Disinterest Forms
Dual-tracking system for resident sentiment:
- Captures: name, email, address, phone, notes
- Requires explicit contact consent checkbox
- Generates secure unsubscribe tokens
- Stores geocoded coordinates for map visualization
- Source tracking (address_checker vs tax_estimator)

### Community Questions
"Have More Questions?" interface:
- Question submission with category selection
- Categories: General, Taxes, Property Rights, Services
- Smart suggestions and rate limiting
- Routed to admin for review and publishing

### FAQ Section
Combined static and dynamic content:
- Search functionality
- Category filters
- "New" and "Popular" badges
- Deep-links to tools (e.g., Tax Estimator)

### Campaign Pillars (Mission)
Six clickable pillars with modal detail:
1. Bring State Tax Dollars Home (with LGDF/MFT calculator)
2. Gain Political Representation
3. Establish Local Control
4. Improve Safety & Services
5. Define Our Future
6. Unite Our Community

## Admin Dashboard

Protected by Replit Auth at `/admin`. Seven main tabs:

### 1. Responses Tab
- View interest/disinterest submissions
- Filter: All, Interested, Not Interested
- Statistics cards with counts
- CSV export

### 2. Questions Tab
- Pending community questions
- Inline answer functionality
- Publish to dynamic FAQ
- Delete questions

### 3. Published FAQs Tab
- Manage dynamic FAQ entries
- Add new FAQs manually
- View count tracking
- Mark as no longer "New"
- Delete FAQs

### 4. Searches Tab
- Address lookup logs
- Filter by result type
- Municipality assignments
- CSV export

### 5. Map Tab
Interactive geographic visualization:
- **Green pins**: Interested residents
- **Red pins**: Not interested residents
- **Grey pins**: Searched addresses (no preference)
- Village boundary overlay
- Clickable popups with details
- Summary statistics

### 6. Email Tab
Bidirectional email with two subtabs:

**Inbox:**
- Master-detail layout
- Read/unread status indicators
- Reply with quoted original
- Delete emails
- Unread count badge

**Sent:**
- Outgoing email history
- Recipient, subject, status, timestamp
- Click-to-view full content

**Features:**
- Compose with HTML support
- Usage tracking (sent + received)
- Progress bar visualization
- Auto-shutoff at 2,500/month (free tier limit: 3,000)
- Respects consent and unsubscribe status

### 7. Contacts Tab
Unified contact management:
- Aggregates from: interest forms, questions, inbound emails
- CRUD operations
- Filter by interest status and source
- Marketing opt-out toggle
- Bulk email with consent enforcement
- Seed from existing data

### Admin Footer
- One Wonder Lake logo
- Version display (v1.3.0)
- "Protected by Replit Auth"
- Contact email

## Database Schema

| Table | Purpose |
|-------|---------|
| `sessions` | Replit Auth sessions (required) |
| `users` | User accounts with admin flag |
| `interested_parties` | Interest submissions with geocoding |
| `searched_addresses` | Address lookup logs |
| `community_questions` | Submitted questions |
| `dynamic_faqs` | Published FAQ entries |
| `email_correspondence` | Sent emails |
| `inbound_emails` | Received emails with debug payload |
| `email_usage` | Monthly email counters |
| `contacts` | Unified contact list |

### Key Fields

**interested_parties:**
- `interested` (boolean): true=interested, false=not interested
- `latitude/longitude`: Geocoded coordinates
- `contactConsent`, `unsubscribed`, `unsubscribeToken`

**contacts:**
- `source`: interested_party, community_question, inbound_email, tax_estimator, manual
- `interestStatus`: interested, not_interested, unknown
- `marketingOptOut`: Bulk messaging exclusion
- `relatedEntityId`: Link to source record

**inbound_emails:**
- `textBody/htmlBody`: Email content (see Known Issues)
- `rawPayload`: Debug info with fetch attempts
- `isRead/isReplied`: Status tracking

## API Endpoints

### Public
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/searched-address` | Log address lookup |
| POST | `/api/interested` | Submit interest form |
| POST | `/api/questions` | Submit question |
| GET | `/api/dynamic-faqs` | Get FAQs |
| POST | `/api/dynamic-faqs/:id/view` | Increment view count |
| POST | `/api/tax/estimate` | Calculate taxes |
| POST | `/api/tax/breakdown` | Tax breakdown |
| GET | `/api/village-tax-info` | Village tax rates |
| POST | `/api/unsubscribe` | Process unsubscribe |
| GET | `/api/build-info` | Version info |

### Admin (Authenticated)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/check` | Verify admin status |
| GET | `/api/admin/interested` | List submissions |
| GET | `/api/admin/searched-addresses` | List searches |
| GET | `/api/admin/questions` | List questions |
| PATCH | `/api/admin/questions/:id/answer` | Answer question |
| POST | `/api/admin/questions/:id/publish` | Publish to FAQ |
| DELETE | `/api/admin/questions/:id` | Delete question |
| POST | `/api/admin/faqs` | Create FAQ |
| DELETE | `/api/admin/faqs/:id` | Delete FAQ |
| GET | `/api/admin/map-data` | Map visualization data |
| POST | `/api/admin/email/send` | Send email |
| GET | `/api/admin/email/history` | Sent emails |
| GET | `/api/admin/email/inbox` | Received emails |
| PATCH | `/api/admin/email/inbox/:id/read` | Mark read |
| DELETE | `/api/admin/email/inbox/:id` | Delete email |
| GET | `/api/admin/email/usage` | Usage stats |
| GET | `/api/admin/contacts` | List contacts |
| POST | `/api/admin/contacts` | Create contact |
| PATCH | `/api/admin/contacts/:id` | Update contact |
| DELETE | `/api/admin/contacts/:id` | Delete contact |
| POST | `/api/admin/contacts/seed` | Seed contacts |
| POST | `/api/admin/email/bulk-send` | Bulk email |

### Webhook
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/webhooks/resend` | Receive inbound emails |

## Environment Secrets

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API for sending emails |
| `RESEND_WEBHOOK_SECRET` | Svix verification for webhooks |
| `DATABASE_URL` | PostgreSQL connection (auto-configured) |

## Resend Integration

- **From Address**: contact@onewonderlake.com
- **Webhook URL**: `https://onewonderlake.replit.app/api/webhooks/resend`
- **Webhook Event**: `email.received`
- **Security**: Svix signature verification

## Privacy & Compliance

- All forms require explicit consent checkbox
- Cryptographic unsubscribe tokens
- Secure `/unsubscribe` page
- Database tracks: `contactConsent`, `unsubscribed`, `unsubscribeToken`
- Marketing opt-out in contacts
- Bulk messaging respects all opt-outs

## Development

```bash
npm run dev          # Start Express + Vite on port 5000
npm run db:push      # Push schema to database
npm run db:push --force  # Force push (use with caution)
```

## Known Issues

### Email Body Content (FIXED in v1.3.0)
**Issue**: Inbound email body content was null in the database.

**Root Cause**: 
- Resend's `email.received` webhook only sends metadata (from, to, subject, email_id)
- Email body is NOT included in the webhook payload
- **Original bug**: System was calling `GET https://api.resend.com/emails/{email_id}` (for sent emails)
- **Fix**: Changed to `GET https://api.resend.com/emails/receiving/{email_id}` (correct endpoint for received emails)

**Current Status**: The system now correctly fetches email body content using the `/receiving/` endpoint with retry logic (3 attempts at 1s, 2s, 3s delays).

## Version History

### v1.3.0 (November 28, 2025)
- Unified Contacts tab with CRUD and bulk messaging
- Master-detail inbox layout
- Email body fetch retry mechanism
- Delete functionality for inbound emails
- Admin footer with branding

### v1.2.1 (November 28, 2025)
- Unread inbox count badge on Email tab

### v1.2.0 (November 28, 2025)
- Logo branding in all headers
- Resend webhook configuration

### v1.1.x
- Bidirectional email system
- Usage tracking and auto-shutoff

### v1.0.x
- Initial release
- Address checker, interest forms
- Admin dashboard, FAQ system
