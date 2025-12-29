# Step 9: Advanced Resume Builder Features (Update)

## Troubleshooting
- **White Page / PDF Crash**: If you encounter a white page in the Resume Builder, it is likely due to the PDF Renderer failing to load fonts. We have added an Error Boundary to catch this.
- **Font Issues**: Default font has been changed to `Helvetica` to ensure stability. Custom fonts like `Roboto` are registered asynchronously.
- **Canvas Errors**: Image download requires a valid canvas context.

## Features
... (Rest of the file remains the same)
