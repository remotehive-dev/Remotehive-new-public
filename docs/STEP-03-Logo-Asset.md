# Step 3: Shared Logo Asset

## Goal
- Use the uploaded logo across both Admin and Public sites.

## Paths
- Admin: `remotehive-admin/public/logo.png`
- Public: `remotehive-public/public/logo.png`

## Action Required
- Save the provided logo image file to both paths above.
- File name should be exactly `logo.png` (PNG format).

## Rendering
- Admin and Public header components will import the logo from `/logo.png`.
- If the file is not present, the UI will show a text fallback.

## Next
- Implement shared headers in both apps and verify the logo loads.

