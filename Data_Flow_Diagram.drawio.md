# Diagram 3. Data Flow Diagram (Level 0)

**Entities and Flows:**

- **Customer / Owner / Staff / Rider**
  - → Requests / updates → **0. Water Refilling Station Delivery System**
  - ← Response / status ← **0. Water Refilling Station Delivery System**

- **0. Water Refilling Station Delivery System**
  - → Read / write → **MySQL Data Store: Customers, Orders, Deliveries, Payments**
  - ← Query results ← **MySQL Data Store: Customers, Orders, Deliveries, Payments**