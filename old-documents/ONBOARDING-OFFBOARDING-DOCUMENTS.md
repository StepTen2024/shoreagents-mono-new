# 📚 Onboarding & Offboarding Documents

## Overview

This document catalogs the official onboarding and offboarding resources available in the ShoreAgents AI platform. These documents are stored in the `/public/On Boarding Off Boarding/` directory and are accessible to authorized personnel.

---

## 📁 Document Inventory

### 1. **SHOREAGENTS-STAFF HANDBOOK_2025**

**File:** `SHOREAGENTS-STAFF HANDBOOK_2025 (1).pdf`  
**Location:** `/public/On Boarding Off Boarding/`  
**Access URL:** `http://localhost:3000/On Boarding Off Boarding/SHOREAGENTS-STAFF HANDBOOK_2025 (1).pdf`

**Purpose:**
- Complete company policies and procedures
- Staff expectations and responsibilities
- Benefits and compensation information
- Code of conduct and workplace guidelines
- Company culture and values

**Usage:**
- Required reading for all new hires
- Reference document for existing staff
- Available through admin onboarding workflow
- Can be linked in knowledge base

---

### 2. **Sample Employment Contract**

**File:** `Rizalyn Valdez - Project Employment Contract.pdf`  
**Location:** `/public/On Boarding Off Boarding/`  
**Access URL:** `http://localhost:3000/On Boarding Off Boarding/Rizalyn Valdez - Project Employment Contract.pdf`

**Purpose:**
- Template for project-based employment contracts
- Legal agreement between ShoreAgents and employee
- Outlines terms, conditions, and expectations
- Compensation and benefits details
- Termination and offboarding procedures

**Usage:**
- Reference template for HR/Admin
- Used during onboarding completion process
- Customizable for each new hire
- Legal documentation for employment records

---

### 3. **Philippine Labor Code**

**File:** `Philippine Labor Code (4).pdf`  
**Location:** `/public/On Boarding Off Boarding/`  
**Access URL:** `http://localhost:3000/On Boarding Off Boarding/Philippine Labor Code (4).pdf`

**Purpose:**
- Official labor law reference for Philippines-based operations
- Legal compliance requirements
- Employee rights and protections
- Employer obligations and responsibilities
- Labor standards and regulations

**Usage:**
- Legal reference for HR decisions
- Compliance verification
- Dispute resolution guidance
- Required reading for management
- Training material for HR staff

---

## 🔄 Integration Points

### Current System Integration

These documents should be integrated into:

1. **Admin Onboarding Workflow** (`/admin/onboarding`)
   - Link to Staff Handbook during new hire setup
   - Employment contract template accessible during completion
   - Labor Code reference for compliance checks

2. **Staff Onboarding Portal** (`/onboarding`)
   - Staff Handbook acknowledgment required
   - Contract review and e-signature capability
   - Rights and responsibilities education

3. **Knowledge Base** (`/admin/knowledge-base`)
   - Add as ADMIN category documents
   - Searchable and downloadable
   - Version-controlled updates

4. **Document Management System**
   - Upload to documents table in database
   - Categorize as ONBOARDING/OFFBOARDING
   - Set appropriate access permissions

---

## 📋 Recommended Actions

### Immediate Integration

- [ ] Create database entries for these documents
- [ ] Add download links to admin onboarding pages
- [ ] Include handbook acknowledgment in staff onboarding flow
- [ ] Add labor code reference to admin knowledge base

### Document Management

- [ ] Implement version control for handbook updates
- [ ] Create contract template system with variables
- [ ] Set up automatic distribution during onboarding
- [ ] Track document acknowledgment/signatures

### Compliance

- [ ] Ensure all new hires receive and acknowledge handbook
- [ ] Maintain records of contract signing
- [ ] Update documents annually for legal compliance
- [ ] Provide labor code training for management

---

## 🔐 Access Control

**Staff Handbook:**
- ✅ Admin: Full access
- ✅ Management: Full access
- ✅ Staff: Read-only during onboarding
- ❌ Clients: No access

**Employment Contract:**
- ✅ Admin: Full access
- ✅ Management/HR: Template access
- ✅ Individual Staff: Own contract only
- ❌ Other Staff: No access

**Labor Code:**
- ✅ Admin: Full access
- ✅ Management: Full access
- ✅ HR Staff: Full access
- ⚠️ General Staff: Reference access as needed

---

## 🛠️ Technical Implementation

### File Paths

```typescript
const ONBOARDING_DOCS = {
  handbook: '/On Boarding Off Boarding/SHOREAGENTS-STAFF HANDBOOK_2025 (1).pdf',
  contractTemplate: '/On Boarding Off Boarding/Rizalyn Valdez - Project Employment Contract.pdf',
  laborCode: '/On Boarding Off Boarding/Philippine Labor Code (4).pdf',
}
```

### Database Schema

```prisma
model OnboardingDocument {
  id           String   @id @default(uuid())
  type         String   // 'HANDBOOK', 'CONTRACT', 'LABOR_CODE'
  title        String
  filePath     String
  version      String
  effectiveDate DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("onboarding_documents")
}
```

### API Endpoints

```typescript
// Get onboarding documents
GET /api/admin/onboarding/documents

// Download specific document
GET /api/admin/onboarding/documents/:id/download

// Track document acknowledgment
POST /api/staff/onboarding/acknowledge
```

---

## 📊 Usage Statistics

**To Be Implemented:**

Track the following metrics:
- Document downloads per staff member
- Handbook acknowledgment rate
- Contract completion timeline
- Labor code reference frequency
- Document update notifications

---

## 🔄 Update Schedule

**Staff Handbook:**
- Annual review: January
- Update as needed for policy changes
- Version history maintained
- Staff notified of updates

**Employment Contract:**
- Review: Quarterly
- Update for legal compliance
- Template improvements as needed

**Labor Code:**
- Update when laws change
- Annual verification of current version
- Legal review recommended

---

## 📞 Contact & Support

**For Questions About:**

**Documents Content:**
- Contact: HR Department
- Email: hr@shoreagents.com

**System Access:**
- Contact: IT Department
- Support: IT Ticket (Category: SYSTEM_ACCESS)

**Legal Compliance:**
- Contact: Management/Legal
- Ticket: MANAGEMENT category

---

## 📝 Notes

- All documents are in PDF format for consistency
- Files are publicly accessible but should be moved to authenticated routes
- Consider implementing e-signature system for contracts
- Labor Code reference may need annual updates
- Backup copies should be maintained outside `/public` folder

---

**Last Updated:** October 23, 2025  
**Document Owner:** Admin/HR Department  
**Next Review:** January 2026

