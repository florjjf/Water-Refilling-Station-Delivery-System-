# Diagram 1. System Architecture Diagram

**Flow:**

`Owner / Staff / Delivery Rider` --HTTPS--> `Web Frontend (Browser)` --JSON--> `Flask Backend REST API` --SQL--> `MySQL Database`

`Flask Backend REST API` connects down to:
- **Business Modules**
  - Customers • Orders
  - Deliveries • Payments

`MySQL Database` connects up from (--Admin--):
- **phpMyAdmin / Workbench**