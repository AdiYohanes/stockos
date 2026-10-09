# StockOS — Product Requirements Document

## 1. Product Overview

StockOS is a lightweight stock management web application for one small shop (warung). It helps owners and staff manage products, stock levels, and daily stock movements through a simple interface.

All stock belongs to one shop. Warehouses, multiple locations, inter-warehouse transfers, and purchase orders are outside product scope. Incoming goods are recorded directly as stock-in movements with receipt references, without a purchasing lifecycle.

---

## 2. Product Goal

The primary goal of StockOS is to make stock management:

- Easy to understand
- Fast to operate
- Easy to monitor
- Reliable
- Accessible to non-technical users

Users should be able to quickly answer questions such as:

- What products do I currently have?
- Which products are low on stock?
- Which products are out of stock?
- What stock movements happened recently?
- Which products require attention?

---

## 3. Target Users

Initial target users:

- Owners of a single small shop or warung
- Shop staff receiving goods, recording sales-related stock out, and counting stock

Initial product scope should prioritize simple operational workflows rather than enterprise ERP requirements.

---

## 4. MVP Scope

### Authentication

Frontend flows:

- Login
- Signup
- Forgot password
- Reset password
- Logout

Current implementation may use mock authentication during frontend development.

Production authentication will be implemented during a later backend phase.

---

### Dashboard

Dashboard should provide an immediate overview of inventory health.

Potential information includes:

- Total products
- Total stock
- Low-stock items
- Out-of-stock items
- Recent stock activity
- Inventory status summaries

The dashboard should prioritize actionable information rather than decorative analytics.

---

### Product Management

Users should eventually be able to:

- View products
- Search products
- Filter products
- View product details
- Add products
- Edit products
- Archive or deactivate products

Basic product information may include:

- Product name
- SKU
- Category
- Current stock
- Unit
- Minimum stock threshold
- Status

Exact data fields should be finalized before backend schema implementation.

---

### Inventory

Users should eventually be able to monitor inventory quantities.

Core concepts:

- Current quantity
- Available stock
- Low-stock status
- Out-of-stock status

Inventory implementation should remain simple during MVP.

---

### Stock Movements

StockOS should track stock quantity changes.

Initial movement types may include:

- Stock in
- Stock out
- Adjustment

Each movement should eventually record enough information to understand:

- What changed
- Which product changed
- Quantity change
- When it happened
- Who initiated it

Exact persistence rules will be defined during backend design.

---

## 5. Frontend Phase Scope

The current development phase focuses only on frontend implementation.

Frontend objectives:

- Validate information architecture
- Validate primary user flows
- Establish reusable UI components
- Establish the StockOS design system
- Build responsive interfaces
- Build realistic mock interactions

Use mock data where backend data would normally be required.

Backend implementation should not be inferred solely from temporary frontend mock structures.

---

## 6. Out of Scope for Current Phase

The following are not part of the current frontend phase unless explicitly requested:

- Production database
- Production authentication
- API implementation
- Database migrations
- Accounting
- General ledger
- Purchasing workflow
- Sales order management
- Warehouse management, multiple locations, and stock transfers
- Purchase orders and purchasing lifecycle
- Multi-company ERP
- Advanced forecasting
- Enterprise approval workflows

These capabilities may be evaluated later.

---

## 7. UX Principles

StockOS should prioritize:

### Simplicity

Common actions should require minimal steps.

### Visibility

Important inventory conditions should be immediately recognizable.

### Consistency

Similar actions should behave consistently across features.

### Feedback

Users should receive clear feedback for:

- Loading
- Success
- Failure
- Empty states
- Validation errors

### Accessibility

Interactive elements should:

- Be keyboard accessible
- Have visible focus states
- Maintain sufficient contrast
- Use meaningful labels

---

## 8. Responsive Requirements

The application should support:

- Desktop
- Tablet
- Mobile

Desktop is the primary operational experience.

Mobile layouts should remain usable for monitoring and common lightweight actions.

---

## 9. Performance Expectations

Frontend should:

- Avoid unnecessary client-side JavaScript
- Avoid unnecessary dependencies
- Keep interactions responsive
- Avoid excessive animation
- Avoid rendering large unnecessary component trees

---

## 10. MVP Success Criteria

The frontend MVP should allow a user to understand and navigate the expected StockOS workflow without requiring a production backend.

A successful frontend foundation should demonstrate:

1. Authentication experience
2. Dashboard experience
3. Product management flow
4. Inventory visibility
5. Stock movement flow
6. Consistent responsive design

---

## 11. Future Product Areas

Possible future capabilities may include:

- Sales integration
- Barcode support
- Production-backed inventory valuation and reporting
- Enforced roles and permissions
- Real notifications

Warehouses, multiple locations, transfers, and purchase orders are not an approved roadmap; adding them requires an explicit scope change.

These are future considerations and should not automatically be treated as approved MVP requirements.

---

## 12. Current Status

Current development phase:

**Frontend Foundation**

Implemented:

- Authentication UI
- Mock authentication
- Protected dashboard area
- Dashboard UI
- Product catalog, add/edit/delete, and stock-in/out flows
- Brief success animation only after successful product creation
- Single-shop inventory levels, adjustments, and movement history
- Mock reports for valuation, movement, restock risk, and supplier deliveries
- Settings UI with browser-local preferences and mock team roles

Active dashboard navigation: Dashboard, Products, Inventory, Reports, Settings. No warehouse or purchase-order module.

Backend and database persistence are not yet implemented. Product and inventory collections are independent session-scoped mocks; dashboard and report analytics remain fixtures. Settings preferences alone use browser-local storage.
