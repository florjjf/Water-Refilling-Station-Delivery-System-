# Diagram 5. Sequence Diagram – Record a Payment

**Participants:**
- Staff
- Frontend
- Backend API
- MySQL

**Sequence of Events:**

1. Submit payment details
   - Staff → Frontend

2. POST /payments
   - Frontend → Backend API

3. Validate order and save payment
   - Backend API → MySQL

4. Return saved payment
   - MySQL → Backend API

5. Return updated balance
   - Backend API → Frontend