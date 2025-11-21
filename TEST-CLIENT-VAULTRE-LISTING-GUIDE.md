# VAULTRE Real Estate CRM - Property Listing Processing Guide

**Client:** Prestige Property Group Australia  
**Prepared For:** Shore Agents BPO Team  
**Last Updated:** November 2025  
**Document Type:** Client Standard Operating Procedure  
**Confidentiality:** Internal Use Only - Prestige Property Group Staff

---

## 📋 Table of Contents

1. [Overview of VAULTRE CRM](#overview)
2. [Before You Begin - Prerequisites](#prerequisites)
3. [Step-by-Step Listing Process](#step-by-step)
4. [Property Information Requirements](#property-info)
5. [Photo Upload Guidelines](#photos)
6. [Description Writing Standards](#descriptions)
7. [Pricing and Commission Setup](#pricing)
8. [Marketing Campaign Configuration](#marketing)
9. [Quality Assurance Checklist](#qa-checklist)
10. [Common Errors and Troubleshooting](#troubleshooting)
11. [Contact Information](#contacts)

---

## 🏠 Overview of VAULTRE CRM {#overview}

VAULTRE is Prestige Property Group's primary customer relationship management system for managing property listings across Australia. It integrates with major property portals including:

- Domain.com.au
- Realestate.com.au
- RealCommercial (for commercial properties)
- Our company website (prestigepropertygroup.com.au)

**Your Role:** As a BPO listing coordinator, you are responsible for accurately inputting property details, uploading media, and ensuring listings are portal-ready within 24 hours of receiving property information from our agents.

---

## ✅ Before You Begin - Prerequisites {#prerequisites}

### Required Access & Credentials

You must have:
- [ ] VAULTRE account credentials (provided by your team lead)
- [ ] VPN access to Prestige Property Group network
- [ ] Access to Google Drive folder: "Pending Listings"
- [ ] Adobe Creative Cloud access (for photo editing if needed)
- [ ] Domain.com.au and Realestate.com.au portal logins

### Required Information Before Starting

Every listing requires:
- [ ] Agent handover form (includes all property details)
- [ ] Minimum 8 professional photos (preferably 15-20)
- [ ] Floor plan (if available - mandatory for properties over $800k)
- [ ] Property title certificate or section number
- [ ] Vendor authority form (confirms client approval to list)

**Important:** NEVER start a listing without the vendor authority form. This is a legal requirement in Australia.

---

## 📝 Step-by-Step Listing Process {#step-by-step}

### Step 1: Access VAULTRE Dashboard

1. **Login to VAULTRE:**
   - URL: https://prestigepg.vaultre.com.au
   - Username: Your assigned PPG email
   - Password: Use your assigned password (reset every 90 days)

2. **Navigate to Listings Module:**
   - Click "Listings" in the left sidebar
   - Select "Create New Listing"
   - Choose listing type:
     - **Sale** (for properties being sold)
     - **Lease** (for rental properties)
     - **Both** (dual listing - rare, requires agent approval)

### Step 2: Property Address Entry

**CRITICAL:** Address accuracy affects portal feed sync. Double-check everything!

**Required Fields:**
- **Street Number:** e.g., "45" or "12A" (include unit number if applicable)
- **Street Name:** e.g., "Collins"
- **Street Type:** Select from dropdown (Street, Road, Avenue, etc.)
- **Suburb:** Start typing and select from auto-complete
- **State:** NSW, VIC, QLD, SA, WA, TAS, NT, ACT
- **Postcode:** 4-digit postcode (VAULTRE will validate)

**Tips:**
- VAULTRE uses Google Maps API for validation
- If address doesn't validate, check for typos
- For new developments, you may need to use "Display Address" field
- Rural properties sometimes need manual override (contact tech support)

**Example Correct Entry:**
```
Street Number: 12
Street Name: Ocean
Street Type: Parade
Suburb: Coogee
State: NSW
Postcode: 2034
```

### Step 3: Property Type and Features

**Property Category Selection:**

**Residential:**
- House
- Townhouse
- Unit/Apartment
- Villa
- Duplex/Semi-Detached
- Terrace
- Studio
- Retirement Living

**Commercial:**
- Office
- Retail
- Industrial/Warehouse
- Medical/Consulting
- Hotel/Leisure
- Land/Development
- Rural

**Key Features (Required Fields):**

For Residential Properties:
- **Bedrooms:** Whole number only (Studio = 0, Bedsit = 1)
- **Bathrooms:** Can use decimals (e.g., 2.5 for 2 full + 1 powder room)
- **Car Spaces:** Include garage + carport + open spaces
- **Land Size:** In square meters (m²) - check title certificate
- **Building Size:** Internal living area in m²

**Feature Checkboxes (Select all that apply):**
- Swimming Pool (In-ground / Above-ground)
- Air Conditioning (Ducted / Split System)
- Heating (Gas / Electric / Ducted)
- Dishwasher
- Built-in Wardrobes
- Alarm System
- Balcony/Deck
- Study/Home Office
- Outdoor Entertainment Area
- Garden/Yard
- Pet Friendly (important for rentals!)
- Furnished/Unfurnished (rentals only)

**Special Property Types:**

**Heritage Listed:**
If property is heritage-listed:
1. Check "Heritage Listed" box
2. Add heritage overlay number in notes
3. Include heritage information in description
4. Agent MUST approve description before publishing

**Off-the-Plan:**
If property hasn't been built yet:
1. Select "Off-the-Plan" status
2. Completion date is MANDATORY
3. Use developer-provided renders (not photos)
4. Add disclaimer in description (template in VAULTRE)

### Step 4: Pricing Information

**CRITICAL:** Pricing errors can have legal consequences. Triple-check all figures.

**For Sale Properties:**

**Price Display Options:**
1. **Fixed Price:** e.g., "$1,250,000"
   - Most common for properties under $2M
   - Must be exact asking price
   - Cannot be changed without vendor authority

2. **Price Range:** e.g., "$1,200,000 - $1,350,000"
   - Used in VIC for transparency laws
   - Range cannot exceed 10% of lower figure
   - Both portals will display the range

3. **Auction:** Display as "Auction [Date]"
   - Must include auction date/time
   - Cannot show indicative price on Domain/REA (NSW law)
   - Can show price guide on website

4. **Contact Agent:** Use when vendor requests no price
   - Less common, reduces enquiries
   - Still need internal price guide for CRM

5. **Expression of Interest (EOI):** For unique properties
   - Must include EOI close date
   - Usually 2-4 weeks campaign

**For Lease/Rental Properties:**

**Weekly Rent Amount:**
- Format: "$XXX per week"
- Must be whole dollar amount (no cents)
- Include decimal for monthly if needed (VAULTRE calculates automatically)

**Bond Amount:**
- Usually 4 weeks rent (standard in most states)
- Check state legislation (some states have caps)

**Lease Term:**
- 6 months or 12 months (standard)
- Flexibility options (e.g., "6-12 month lease available")

**Available Date:**
- Format: DD/MM/YYYY
- "Now" if available immediately
- Future date if currently tenanted

### Step 5: Agent and Office Information

**Primary Agent Assignment:**
- Select from dropdown (alphabetical by last name)
- This agent receives enquiries by default

**Secondary Agent (Optional):**
- For team listings
- Both agents receive enquiry notifications

**Office Assignment:**
- VAULTRE auto-assigns based on suburb
- Override if needed (e.g., agent operates from different office)

**Commission Settings (Admin Only):**
- You do NOT need to enter this
- Agent or office admin handles commission
- Leave this section blank

### Step 6: Property Description

**CRITICAL SECTION:** Descriptions must follow Australian consumer law and PPG standards.

**Description Length:**
- Minimum: 150 words
- Maximum: 1000 words (portals will truncate beyond this)
- Optimal: 300-500 words (keeps reader engaged)

**Mandatory Opening Line (Prestige Property Group Standard):**

For Sales:
> "Prestige Property Group is proud to present..."

For Rentals:
> "Available for lease through Prestige Property Group..."

**Description Structure (Follow This Order):**

**1. Headline Hook (1 sentence)**
Example: "Nestled in the heart of Coogee, this stunning beachside residence offers the ultimate coastal lifestyle."

**2. Property Overview (2-3 sentences)**
- Property type and key features
- Highlight standout features
- Set the scene

**3. Interior Features (1 paragraph)**
- Bedrooms (number, size, features)
- Bathrooms (quality, fixtures)
- Living areas (layout, flow, natural light)
- Kitchen (appliances, storage, bench space)

**4. Exterior Features (1 paragraph)**
- Outdoor spaces (balcony, deck, yard)
- Landscaping
- Parking (garage, carport, visitor parking)
- Pool/spa if applicable

**5. Location Benefits (1 paragraph)**
- Distance to key amenities (walking distance preferred)
- Schools (very important for families)
- Transport (train, bus, ferry)
- Shopping and dining
- Beaches/parks

**6. Additional Features (dot points or short paragraph)**
- Storage
- Security
- Energy efficiency
- Smart home features
- Strata/body corporate details (if applicable)

**7. Call to Action (Final sentence)**
Example: "Contact [Agent Name] today to arrange your private inspection."

**Writing Style Guidelines:**

✅ **Do:**
- Use descriptive language (but stay accurate)
- Highlight unique features
- Include walking distances ("400m to beach")
- Mention schools by name
- Use proper grammar and spelling
- Write in present tense
- Be enthusiastic but professional

❌ **Don't:**
- Exaggerate (legal risk)
- Use ALL CAPS (looks unprofessional)
- Include discriminatory language (e.g., "perfect for young couples" - illegal!)
- Make guarantees ("best investment in the area")
- Include personal opinions
- Use abbreviations excessively
- Copy-paste from other listings

**Banned Phrases (Australian Consumer Law):**
- "Best in class"
- "Unbeatable value"
- "Once in a lifetime"
- "Must sell"
- "Urgent sale"
- Any claim you can't prove with evidence

**Template Library:**

VAULTRE has description templates:
- Click "Load Template" button
- Select property type
- Customize with specific property details
- ALWAYS personalize - never use template as-is

### Step 7: Photo Upload and Management

**CRITICAL:** Photos are the most important part of any listing. 85% of buyers view photos before reading description.

**Photo Requirements:**

**Minimum Standards:**
- Resolution: Minimum 1920x1080px (Full HD)
- Format: JPEG or PNG
- File size: Under 5MB per photo
- Color: High quality, well-lit, color-corrected
- Orientation: Landscape preferred (portrait for vertical spaces)

**Photo Count by Price Range:**
- Under $500k: Minimum 8 photos
- $500k - $1M: Minimum 12 photos
- $1M - $2M: Minimum 15 photos
- $2M+: Minimum 20 photos + video tour

**Required Photos (In This Order):**

1. **Hero Shot** (Main front photo)
   - Property exterior from best angle
   - Include landscaping
   - Shot in daylight (preferably morning/afternoon for best light)
   - This photo appears first on all portals - make it count!

2. **Living Areas** (3-4 photos)
   - Main living room
   - Dining area
   - Family room (if applicable)
   - Wide angles showing flow

3. **Kitchen** (2-3 photos)
   - Full kitchen view
   - Close-up of appliances/finishes
   - Breakfast bar (if applicable)

4. **Bedrooms** (1 photo per bedroom)
   - Master bedroom always included
   - Show built-in wardrobes if notable
   - Natural light is key

5. **Bathrooms** (1 photo per bathroom)
   - Main bathroom
   - Ensuite(s)
   - Powder room if it's nice

6. **Outdoor Areas** (2-4 photos)
   - Backyard/garden
   - Deck/patio/entertaining area
   - Pool (if applicable)
   - Views (if applicable)

7. **Parking** (1 photo)
   - Garage or carport
   - Only if it's a selling feature

8. **Additional Features** (as needed)
   - Home office/study
   - Cellar/storage
   - Unique features (e.g., wine cellar, gym)

**Photo Upload Process:**

1. Click "Add Photos" in VAULTRE
2. Drag and drop photos OR click "Browse"
3. Photos upload automatically
4. Wait for all photos to process (green checkmark)
5. **Rearrange Photos:**
   - Drag thumbnails to reorder
   - Hero shot MUST be first
   - Logical flow: exterior → interior → outdoor
6. **Add Captions (Optional but Recommended):**
   - "Spacious open-plan living area"
   - "Modern kitchen with quality appliances"
   - Keep under 50 characters

**Photo Editing (If Needed):**

VAULTRE has basic editing tools:
- Brightness/Contrast adjustment
- Straighten/Rotate
- Crop

**When to Edit:**
- Photos too dark (brighten slightly)
- Crooked angles (straighten)
- Remove personal items (crop if minor)

**When NOT to Edit:**
- Never remove structural elements
- Never add elements (e.g., blue sky filter)
- Never use excessive filters
- Never alter colors to misrepresent

**If Photos Are Poor Quality:**
- Contact agent immediately
- Request professional photography
- DO NOT publish listing with bad photos
- Better to delay 24 hours than publish poor listing

**Floor Plans:**

If provided:
1. Upload to "Floor Plans" section (separate from photos)
2. Format: PDF or high-res JPEG
3. Must be to scale and accurate
4. Portals display this separately

### Step 8: Marketing Campaign Setup

**CRITICAL:** This determines where your listing appears online.

**Portal Selection:**

**Default Configuration (Most Listings):**
- ✅ Domain.com.au (Prestige listings)
- ✅ Realestate.com.au (Prestige listings)
- ✅ Prestige Property Group website (always)

**Premium Upgrades (Requires Agent Approval):**
- ⭐ Domain Premier Listing ($500-800/week)
- ⭐ REA Premiere Listing ($600-1000/week)
- ⭐ Featured Listing (homepage banner)

**Process:**
1. Default is "Standard Listing" on both portals
2. If agent wants premium, they'll note it in handover form
3. Select premium options from dropdown
4. VAULTRE charges automatically to office account

**Social Media Integration:**

VAULTRE auto-posts to:
- Facebook (Prestige Property Group page)
- Instagram (automatic story + feed post)
- LinkedIn (commercial properties only)

**Enable These by Default** (checkboxes in Marketing section):
- ✅ Share to Facebook
- ✅ Share to Instagram
- ✅ Email to database (sends to relevant contacts)
- ✅ Add to weekly newsletter

**Inspection Times:**

If agent has provided inspection times:
1. Click "Add Inspection"
2. Enter date (DD/MM/YYYY)
3. Enter time (e.g., 10:00 AM - 10:30 AM)
4. Select "Public Inspection" or "Private Inspection"
5. Add multiple inspection times if needed

**If no inspection times provided:**
- Leave this section blank
- Agent will add later via mobile app

**Campaign Duration:**

For Sale:
- Default: 60 days (auto-renews)
- Premium campaigns: 30-90 days

For Lease:
- Default: 30 days (auto-renews)
- Usually leases faster, monitor closely

### Step 9: Compliance and Legal

**Australian Property Laws - MUST DO:**

**1. Vendor Authority Check:**
- Confirm vendor authority form is uploaded to Google Drive
- File name format: "[Address] - Vendor Authority - [Date].pdf"
- If missing: STOP and email agent

**2. Energy Efficiency Rating (Residential Sales Only):**
- Required in ACT (mandatory)
- Recommended in other states
- Upload certificate if provided
- If not provided, note "On request" in description

**3. Price Guide Compliance (Victoria Only):**
- VIC requires "Statement of Information"
- Must include comparable sales (agent provides)
- Upload SOI document to VAULTRE
- Failure to include = $10,000 fine

**4. Water Efficiency Rating (Rentals Only):**
- Required in most states for rentals
- Agent provides BASIX certificate
- Upload to "Compliance Documents"

**5. Strata/Body Corporate Reports:**
- For units/townhouses
- Agent should provide recent strata report
- Upload if available
- Note in description: "Strata report available"

**Compliance Checklist in VAULTRE:**

Before you can publish, VAULTRE checks:
- [ ] Vendor authority uploaded
- [ ] Minimum photos (8+)
- [ ] Description meets minimum length
- [ ] Price entered correctly
- [ ] Agent assigned
- [ ] Property address validated

**If Any Are Red (✗):**
- You cannot publish listing
- Fix issues first
- Checklist must be all green (✓)

### Step 10: Preview and Publish

**Final Review Process:**

1. **Click "Preview Listing"**
   - Shows how it will appear on portals
   - Check for:
     - Photo order correct
     - Description reads well
     - Price displays correctly
     - Contact details correct

2. **Check Mobile View**
   - 80% of buyers view on mobile first
   - Click "Mobile Preview" tab
   - Ensure photos display properly
   - Description should be readable

3. **Run Spelling/Grammar Check**
   - VAULTRE has built-in spell checker
   - Click "Check Spelling" button
   - Fix any errors (red underlines)

4. **Get Second Opinion (if new to role):**
   - For first 20 listings, have team lead review
   - Use "Share Preview" link
   - Send via Slack for quick feedback

**Publishing:**

1. **Click "Publish Listing"**
2. **Confirm portal distribution:**
   - Domain.com.au ✓
   - Realestate.com.au ✓
   - Company website ✓
3. **Review publication time:**
   - Immediate OR
   - Scheduled (select date/time)
4. **Click "Confirm & Publish"**

**What Happens Next:**

- VAULTRE sends listing to portals (5-10 minutes)
- Domain/REA process listing (15-30 minutes)
- Listing goes live on portals (usually within 1 hour)
- Auto-email sent to agent confirming publication
- Social media posts published automatically

**Monitoring:**

After publishing:
1. Check portals after 1 hour to confirm live
2. If not live, click "Resync" in VAULTRE
3. If still issues, contact VAULTRE support

---

## 🔧 Common Errors and Troubleshooting {#troubleshooting}

### Error: "Address Cannot Be Validated"

**Cause:** Google Maps doesn't recognize address
**Solution:**
1. Check for typos in street name
2. Try different street type (e.g., "St" vs "Street")
3. For new developments, use "Manual Override" checkbox
4. Contact VAULTRE support if persistent

### Error: "Photo Upload Failed"

**Cause:** File size too large or format unsupported
**Solution:**
1. Check file size (must be under 5MB)
2. Convert to JPEG if using different format
3. Try uploading one photo at a time
4. Clear browser cache and try again

### Error: "Price Range Exceeds 10%"

**Cause:** VIC transparency laws require range within 10%
**Solution:**
1. Recalculate range: lower price × 1.10 = maximum upper price
2. Example: $1,000,000 can only go up to $1,100,000
3. Contact agent if they insist on wider range

### Error: "Listing Not Appearing on Domain"

**Cause:** Usually a sync delay
**Solution:**
1. Wait 1-2 hours (peak times are slower)
2. Click "Resync to Portals" in VAULTRE
3. Check Domain account directly to see if listing is there
4. Contact Domain support if still not showing after 3 hours

### Error: "Cannot Publish - Missing Vendor Authority"

**Cause:** Compliance check failed
**Solution:**
1. Check Google Drive for vendor authority form
2. If not there, email agent immediately
3. DO NOT bypass this check (legal requirement)
4. Upload form and try again

---

## 📞 Contact Information {#contacts}

### VAULTRE Technical Support

**Email:** support@vaultre.com.au  
**Phone:** 1300 VAULTRE (1300 828 587)  
**Hours:** Monday-Friday 8am-6pm AEST  
**Emergency After-Hours:** Available for critical issues

### Prestige Property Group Contacts

**BPO Team Lead:**  
- Name: Contact your team lead
- Email: Available in Slack
- Slack: #ppg-listings channel

**PPG Operations Manager:**  
- Handles escalations and agent communication
- Contact via team lead

**Portal Support (if VAULTRE can't help):**

**Domain.com.au:**  
- Email: customersupport@domain.com.au
- Phone: 1300 794 443

**Realestate.com.au:**  
- Email: customersupport@rea-group.com
- Phone: 1300 134 174

---

## ✅ Quality Assurance Checklist {#qa-checklist}

Use this for EVERY listing before publishing:

**Address & Property Details:**
- [ ] Street address is correct and validated
- [ ] Suburb, state, postcode are correct
- [ ] Property type selected correctly
- [ ] Bedrooms, bathrooms, car spaces are accurate
- [ ] Land size matches title certificate
- [ ] All relevant features are checked

**Pricing:**
- [ ] Price is correct and matches handover form
- [ ] Price display type is appropriate
- [ ] For VIC: Price range is within 10%
- [ ] For rentals: Bond is calculated correctly

**Description:**
- [ ] Minimum 150 words
- [ ] Starts with PPG mandatory opening
- [ ] No spelling or grammar errors
- [ ] No banned phrases used
- [ ] Includes location benefits
- [ ] Ends with call to action
- [ ] Agent name is correct

**Photos:**
- [ ] Minimum photo count for price range
- [ ] Hero shot is first
- [ ] All photos are high resolution
- [ ] Photos are in logical order
- [ ] Floor plan uploaded (if available)
- [ ] No poor quality or blurry photos

**Agent & Office:**
- [ ] Primary agent assigned correctly
- [ ] Office assignment is correct
- [ ] Contact details are accurate

**Marketing:**
- [ ] Domain listing enabled
- [ ] REA listing enabled
- [ ] Social media sharing enabled
- [ ] Inspection times added (if provided)

**Compliance:**
- [ ] Vendor authority uploaded
- [ ] Energy certificate uploaded (if applicable)
- [ ] Statement of Information included (VIC only)
- [ ] All compliance checks are green ✓

**Final:**
- [ ] Preview checked on desktop
- [ ] Preview checked on mobile
- [ ] Second opinion obtained (if required)
- [ ] Ready to publish!

---

## 📚 Additional Resources

**VAULTRE Training Videos:**
- Access via VAULTRE dashboard → Help → Video Tutorials
- Recommended: "Listing Creation Fundamentals" (15 mins)

**PPG Style Guide:**
- Location: Google Drive → PPG Resources → Style Guide
- Covers description writing standards and brand voice

**Australian Consumer Law Reference:**
- ACCC website: www.accc.gov.au
- Real estate specific guidelines

**Portal Help Centers:**
- Domain: help.domain.com.au
- REA: help.realestate.com.au

---

## 📝 Document Change Log

**v1.3 - November 2025**
- Updated photo count requirements
- Added VIC Statement of Information requirement
- Clarified price range rules
- Added mobile preview step

**v1.2 - August 2025**
- Added social media integration section
- Updated VAULTRE interface screenshots
- Added troubleshooting section

**v1.1 - May 2025**
- Initial version for BPO team

---

**Document Prepared By:** Prestige Property Group Operations Team  
**For:** Shore Agents BPO Staff  
**Classification:** Internal Use Only  
**Next Review Date:** February 2026

---

*End of Document*

