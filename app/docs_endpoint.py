from fastapi.responses import HTMLResponse

def custom_docs():
    return HTMLResponse("""
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  <title>RemoteHive Admin Panel</title>
  <style>
    body { margin: 0; background-color: #1a1a1a; }
  </style>
</head>
<body>
  <rapi-doc
    spec-url="/api/v1/openapi.json"
    render-style="view" 
    layout="row"
    theme="dark"
    show-header="false"
    show-info="false"
    allow-server-selection="false"
    allow-authentication="true"
    nav-bg-color="#111827"
    nav-text-color="#9CA3AF"
    nav-hover-bg-color="#1F2937"
    nav-hover-text-color="#F9FAFB"
    nav-accent-color="#6366F1"
    primary-color="#6366F1"
    bg-color="#0F172A"
    text-color="#E2E8F0"
    heading-text="RemoteHive Admin"
    use-path-in-nav-bar="true"
  >
    <div slot="nav-logo" style="display: flex; align-items: center; justify-content: center; padding: 20px; border-bottom: 1px solid #1F2937;">
        <span style="color: #fff; font-weight: bold; font-size: 1.25rem;">RemoteHive Admin</span>
    </div>
  </rapi-doc>
</body>
</html>
""")
