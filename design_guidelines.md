# One Wonder Lake - Design Guidelines

## Design Approach
**Civic & Trustworthy**: Modern governmental website aesthetic that builds community confidence. Clean, professional, accessible to all demographics including seniors and first-time civic engagement participants.

## Color Palette
- **Primary**: Deep Lake Blue (#005f73) - Hero sections, navbar, primary buttons
- **Accent**: Teal (#94d2bd) - Hover states, highlights, secondary elements
- **Secondary**: Dark Cyan (#0a9396) - Supporting elements, borders
- **Background**: Clean White (#FFFFFF) - Main content areas
- **Result States**: Green (success/resident), Gold/Yellow (annexation zone)

## Typography
- **Font Family**: System sans-serif stack (SF Pro, Segoe UI, Roboto, Arial)
- **Hierarchy**: 
  - Hero Headline: Bold, 48-56px desktop / 32-36px mobile
  - Section Headlines: Semi-bold, 36-40px desktop / 28px mobile
  - Subheadings: Medium, 20-24px
  - Body: Regular, 16-18px with 1.6 line-height for readability
  - Button Text: Medium, 16px

## Layout System
- **Container**: Max-width 1200px, centered with responsive padding (px-6 mobile, px-8 desktop)
- **Section Spacing**: py-16 mobile, py-24 desktop for breathing room
- **Grid System**: CSS Grid for benefits (3 columns desktop, 1 column mobile)

## Component Specifications

### Navbar
- Sticky positioning, Deep Lake Blue background, white text
- Logo left-aligned, navigation links right-aligned
- Mobile: Hamburger menu icon (≤768px), slide-in drawer navigation
- Height: 64px, subtle shadow on scroll

### Hero Section
- Full viewport width, Deep Lake Blue background, white text, centered content
- No background image - solid color with strong typography focus
- Headline + Subhead + CTA button in vertical stack
- Button: Teal background with Deep Lake Blue on hover, rounded corners

### Benefits Grid
- 3 equal-width cards with icons, headlines, and descriptive text
- Card styling: White background, subtle shadow, rounded corners (8px)
- Icon placement: Top of card, 48x48px, Teal color
- Responsive: Stack to single column on mobile

### Address Checker Section
- Distinct background (light teal tint #f0f9f8 or similar)
- Large input field with rounded corners, clear placeholder text
- Button: Deep Lake Blue with Teal hover state
- Result container: Conditional color backgrounds (green/gold) with emoji icons and bold text

### FAQ Section
- Accordion pattern with expandable questions
- Question headers: Semi-bold with chevron icon (rotates on expand)
- Answer text: Slightly indented with comfortable padding
- Borders: Subtle Dark Cyan between items

### Vision Section
- Full-width with slight background tint, centered text
- Emphasis on community messaging with generous padding

### Footer
- Dark background (Deep Lake Blue or darker), white text, centered
- Minimal height, simple copyright text

## Interactive Elements
- **Buttons**: 2px border radius, smooth hover transitions (0.3s ease), scale slightly on hover (1.02)
- **Links**: Underline on hover, Teal color
- **Form Inputs**: 1px solid border, focus state with Teal outline
- **Mobile Menu**: Slide-in animation from right, overlay backdrop

## Responsive Breakpoints
- Mobile: <768px (single column, stacked layout, hamburger menu)
- Tablet: 768-1024px (2-column benefits if space allows)
- Desktop: >1024px (full 3-column layout)

## Accessibility
- Minimum touch target size: 44x44px for mobile buttons
- Color contrast: WCAG AA compliant (white text on Deep Lake Blue passes)
- Semantic HTML with proper heading hierarchy
- Focus indicators visible on all interactive elements

## Images
No hero background image - solid Deep Lake Blue background with typography focus creates stronger civic presence. This is intentional to maintain clarity and professional governmental aesthetic.