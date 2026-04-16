# Offer Letter Module - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFER LETTER MODULE                              │
│                     DKG HRMS Admin Dashboard                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Sidebar Navigation                           │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Dashboard                                                │  │    │
│  │  │  Employees                                                │  │    │
│  │  │  Assets                                                   │  │    │
│  │  │  Tasks                                                    │  │    │
│  │  │  Notifications                                            │  │    │
│  │  │  ► OFFER LETTER  ◄ (NEW - Admin Only)                   │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              OfferLetterForm Component                          │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │                   Multi-Step Wizard                       │  │    │
│  │  │                                                           │  │    │
│  │  │  STEP 1: Candidate Details                               │  │    │
│  │  │  ┌─────────────────────────────────────────────────┐     │  │    │
│  │  │  │ • Candidate Name (required)                     │     │  │    │
│  │  │  │ • Address (required, multiline)                 │     │  │    │
│  │  │  │ • Date (auto-filled)                            │     │  │    │
│  │  │  │ • Designation (required)                        │     │  │    │
│  │  │  │ • Location (required)                           │     │  │    │
│  │  │  │ • Joining Date (required)                       │     │  │    │
│  │  │  └─────────────────────────────────────────────────┘     │  │    │
│  │  │                                                           │  │    │
│  │  │  STEP 2: Salary & CTC                                    │  │    │
│  │  │  ┌─────────────────────────────────────────────────┐     │  │    │
│  │  │  │ • Basic Salary (required)                       │     │  │    │
│  │  │  │ • HRA (required)                                │     │  │    │
│  │  │  │ • Variable Dearness Allowance                   │     │  │    │
│  │  │  │ • Other Allowances                              │     │  │    │
│  │  │  │ ────────────────────────────────────────────    │     │  │    │
│  │  │  │ • Monthly Salary (auto-calculated) 💰           │     │  │    │
│  │  │  │ • Yearly CTC (auto-calculated) 💰               │     │  │    │
│  │  │  └─────────────────────────────────────────────────┘     │  │    │
│  │  │                                                           │  │    │
│  │  │  STEP 3: Acceptance Details                              │  │    │
│  │  │  ┌─────────────────────────────────────────────────┐     │  │    │
│  │  │  │ • Candidate Name (auto-populated)               │     │  │    │
│  │  │  │ • Aadhaar Number (required, 12 digits)          │     │  │    │
│  │  │  │ • Acceptance Date (auto-filled)                 │     │  │    │
│  │  │  │ • Candidate Signature (upload image) 📷         │     │  │    │
│  │  │  └─────────────────────────────────────────────────┘     │  │    │
│  │  │                                                           │  │    │
│  │  │  [Back] [Next] [Generate & Download PDF] 🔽              │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST Request
                                    │ JSON Payload (with base64 signature)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                            │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Route: POST /api/documents/offer-letter/generate        │  │    │
│  │  │  Handler: offerLetterController.generateOfferLetterPDF   │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              Offer Letter Controller                            │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  1. Validate Request Data                                │  │    │
│  │  │     ✓ Required fields present                            │  │    │
│  │  │     ✓ Data types correct                                 │  │    │
│  │  │     ✓ Aadhaar format valid                               │  │    │
│  │  │                                                           │  │    │
│  │  │  2. Create PDF Document (PDFKit)                         │  │    │
│  │  │     ✓ A4 size, proper margins                            │  │    │
│  │  │     ✓ 4 pages total                                      │  │    │
│  │  │                                                           │  │    │
│  │  │  3. Add Fixed Content                                    │  │    │
│  │  │     ✓ Company logo & branding                            │  │    │
│  │  │     ✓ Legal sections (unchanged)                         │  │    │
│  │  │     ✓ Terms and conditions                               │  │    │
│  │  │                                                           │  │    │
│  │  │  4. Inject Dynamic Data                                  │  │    │
│  │  │     ✓ Candidate details (precise coordinates)            │  │    │
│  │  │     ✓ Salary components (calculated)                     │  │    │
│  │  │     ✓ Acceptance details                                 │  │    │
│  │  │     ✓ Signature image (if provided)                      │  │    │
│  │  │                                                           │  │    │
│  │  │  5. Generate Salary Table (Annexure-I)                   │  │    │
│  │  │     ✓ Monthly breakdown                                  │  │    │
│  │  │     ✓ Yearly totals                                      │  │    │
│  │  │     ✓ Company contributions                              │  │    │
│  │  │     ✓ Final CTC                                          │  │    │
│  │  │                                                           │  │    │
│  │  │  6. Stream PDF to Client                                 │  │    │
│  │  │     ✓ Set headers (Content-Type, Disposition)            │  │    │
│  │  │     ✓ Stream file                                        │  │    │
│  │  │     ✓ Clean up temporary files                           │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PDF File Stream
                                    │ application/pdf
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FILE SYSTEM LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              PDF Storage Directory                              │    │
│  │              D:/HRMS_Uploads/pdfs/                              │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Offer_Letter_Aakash_Singh_2025-07-30.pdf               │  │    │
│  │  │  Offer_Letter_Jane_Doe_2025-08-01.pdf                   │  │    │
│  │  │  Offer_Letter_John_Smith_2025-08-05.pdf                 │  │    │
│  │  │  ...                                                      │  │    │
│  │  │  (Auto-cleanup after download)                           │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Browser Download
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER'S COMPUTER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📄 Offer_Letter_Aakash_Singh_2025-07-30.pdf                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Page 1: Header, Candidate Details, Job Details, Info Security │    │
│  │  Page 2: Termination, KRA, Joining Requirements                │    │
│  │  Page 3: Terms, Acceptance Section with Signature               │    │
│  │  Page 4: Annexure-I - Salary Breakdown Table                    │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ✅ Print-ready                                                          │
│  ✅ Visually identical to template                                      │
│  ✅ All data filled correctly                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                            DATA FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════════

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Step 1  │ ───► │  Step 2  │ ───► │  Step 3  │ ───► │ Generate │
│ Details  │      │  Salary  │      │ Accept.  │      │   PDF    │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
     │                  │                  │                  │
     │                  │                  │                  │
     ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Form State (React)                          │
│  {                                                              │
│    candidateName: "Aakash Singh",                              │
│    address: "268, Awas Vikas...",                              │
│    designation: "Asst. Manager...",                            │
│    basicSalary: 30000,                                         │
│    hra: 15000,                                                 │
│    monthlySalary: 70000,  ← Auto-calculated                    │
│    yearlyCTC: 840000,     ← Auto-calculated                    │
│    candidateSignature: "data:image/png;base64,..."            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend Controller (Node.js)                       │
│  1. Validate ✓                                                  │
│  2. Create PDF Document                                         │
│  3. Add Pages (1-4)                                             │
│  4. Place Text at Coordinates                                   │
│  5. Embed Signature Image                                       │
│  6. Generate Table                                              │
│  7. Finalize PDF                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ File Stream
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Download                             │
│  📥 Offer_Letter_Aakash_Singh_2025-07-30.pdf                   │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         COMPONENT HIERARCHY
═══════════════════════════════════════════════════════════════════════════

App.tsx
 │
 ├─ MainLayout
 │   │
 │   ├─ Sidebar ──────────────────────► "Offer Letter" Menu Item (NEW)
 │   │
 │   └─ Routes
 │       │
 │       ├─ /dashboard ──────────────► Dashboard
 │       ├─ /employees ──────────────► EmployeeList
 │       ├─ /assets ────────────────► AssetList
 │       └─ /documents/offer-letter ► OfferLetterForm (NEW)
 │                                      │
 │                                      ├─ Stepper (MUI)
 │                                      ├─ Step 1 Form Fields
 │                                      ├─ Step 2 Form Fields
 │                                      ├─ Step 3 Form Fields
 │                                      ├─ Signature Upload
 │                                      ├─ Validation Logic
 │                                      ├─ Auto-calculation
 │                                      └─ PDF Generation Call


═══════════════════════════════════════════════════════════════════════════
                         TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════

Frontend:
  ┌─────────────────────────────────────────────────────────────┐
  │ React 18 + TypeScript                                       │
  │ Material-UI (MUI) Components                                │
  │ React Router v6                                             │
  │ React Hooks (useState, useEffect)                           │
  └─────────────────────────────────────────────────────────────┘

Backend:
  ┌─────────────────────────────────────────────────────────────┐
  │ Node.js + Express.js                                        │
  │ TypeScript                                                  │
  │ PDFKit (PDF Generation)                                     │
  │ body-parser (10MB limit for signatures)                     │
  │ CORS (Cross-Origin Resource Sharing)                        │
  └─────────────────────────────────────────────────────────────┘

Storage:
  ┌─────────────────────────────────────────────────────────────┐
  │ Local File System                                           │
  │ D:/HRMS_Uploads/pdfs/                                       │
  │ Temporary storage with auto-cleanup                         │
  └─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Authentication & Authorization                         │
│  ✓ Admin role required                                          │
│  ✓ Role-based access control                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Input Validation                                       │
│  ✓ Frontend form validation                                     │
│  ✓ Backend data validation                                      │
│  ✓ Type checking (TypeScript)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: File Security                                          │
│  ✓ File size limits (10MB)                                      │
│  ✓ Secure file handling                                         │
│  ✓ Auto-cleanup of temp files                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Network Security                                       │
│  ✓ CORS protection                                              │
│  ✓ HTTPS ready                                                  │
│  ✓ No SQL injection (no DB queries)                             │
└─────────────────────────────────────────────────────────────────┘

```

## Legend

- 📷 Image Upload
- 💰 Auto-calculated Field
- 🔽 Download Action
- ✓ Validation/Check
- ► Selected/Active Item
- ───► Data Flow Direction
- │ Hierarchical Relationship
