# User Guide

## Overview
This system helps your team create, review, and finalize Board Resolutions.

## Account Access
1. Register using your official Board name.
2. Wait for admin approval.
3. Approved users can access the dashboard and view resolutions.

## Roles
- `admin`: Manage users, settings, create/edit resolutions, finalize by uploading signed PDF.
- `bod_secretary`: Create/edit resolutions, finalize by uploading signed PDF.
- `bod_member` and other approved users: View resolutions and submit wording suggestions on draft resolutions.

## Dashboard
- The dashboard lists all resolutions visible to approved users.
- Each card shows status (`draft` or `final`).
- For `final` resolutions, edit/delete actions are locked.

## Create A Resolution (Admin/Secretary)
1. Go to Dashboard.
2. Click `Create New`.
3. Fill in title, clauses, signatories, and details.
4. Click `Save Draft`.

## Review And Suggestions
- Open a resolution in review view.
- Approved non-manager users can submit wording suggestions while status is `draft`.
- Admin/Secretary can accept/reject suggestions.

## Finalization Workflow
1. Open a draft resolution in review view.
2. Download/print unsigned copy as needed.
3. Sign externally (e.g., DICT certificate workflow).
4. Upload signed PDF in `Digital Signature Workflow`.
5. System automatically updates:
   - `signed_pdf_url`
   - `status = final`
   - finalization metadata (`finalized_at`, `finalized_by`)

## Final Resolution Rules
- A `final` resolution must have a signed PDF.
- `final` resolutions cannot be edited or deleted.
- If a resolution has no signed PDF, it cannot remain `final`.

## Settings (Admin/Secretary)
- Manage organization details and signatories.
- Upload logo and signature images.

## Admin User Management
- Approve pending users.
- Assign roles (`admin`, `bod_secretary`, `bod_member`).

## Troubleshooting
- `No resolutions found`:
  - Confirm account is approved.
  - Confirm data exists in `resolutions`.
- Cannot edit/delete:
  - Check if resolution status is `final`.
  - Only admin/secretary can manage non-final resolutions.
- Cannot upload signed PDF:
  - Ensure role is admin or secretary.
  - Upload a valid PDF file.

## Security Notes
- Access is role/status based.
- Finalization and edit/delete locks are enforced by database policies, not only by UI.
