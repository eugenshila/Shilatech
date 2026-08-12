Updated README: admin, requests, upload and deployment notes.

New endpoints:
- POST /api/requests  — submit a part request (also GET to list requests for admin)
- POST /api/admin/upload — upload base64 image payload, returns { url }
- POST /api/admin/login — simple demo login (returns token)

Notes:
- The API writes to data/requests.json and data/products.json. This is suitable for demo/local use but not production.
- For production: configure SMTP via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) to enable email notifications.
- Set ADMIN_PASSWORD env to secure the admin login.
