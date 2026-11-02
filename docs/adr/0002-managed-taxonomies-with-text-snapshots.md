# ADR 0002 — Managed Category and Supplier Taxonomies with Text-Snapshot Storage

## Status

Accepted 2026-10-31 (design only; implementation requires separate approval).

## Context

Managing product categories and suppliers via free text in `products` leads to inconsistent naming and cumbersome re-entry. However, converting category and supplier references into rigid foreign key relations risks breaking or complicating immutable historical records (`inventory_events`, receipt references, and product snapshots) when categories or suppliers are renamed or archived.

## Decision

Introduce dedicated reference tables (`categories` and `suppliers`) for managing suggestions, validation, and metadata, while continuing to store denormalized text in `products` and `inventory_events`.

- **Tables**: `categories` (id, name, created_at, updated_at) and `suppliers` (id, name, phone, notes, created_at, updated_at) in the private schema.
- **Data retention**: `products` stores `category` and `supplier` as direct text strings. Renaming a category or supplier propagates to active products via a controlled update, while past `inventory_events` snapshots remain untouched.
- **Deletion rule**: Restrict deletion of a category or supplier if it is currently in use by any active product.
- **SKU PLU Integration**: Custom user-defined categories default to PLU category prefix `9` (Lainnya/Umum).
- **Navigation & UX**: Central management lives in Settings (`/settings`), paired with quick-add capabilities directly inside the Product creation modal (creatable combobox for categories, lightweight dialog for suppliers).

## Consequences

- Historical audit integrity is preserved: past stock movements and receipts are completely decoupled from changes to supplier contacts or category adjustments.
- Dropdown selections become structured and consistent across the UI without enterprise relational overhead.
- Renames require an explicit administrative sweep on the `products` table rather than cascading FK triggers.

## Alternatives considered

- **Strict Foreign Keys (`category_id`, `supplier_id`)**: Rejected because renaming or deleting would complicate append-only audit event snapshots and require nullable FKs or cascading locks across historical rows.
- **Settings JSON storage**: Storing categories/suppliers in `shop_settings` JSON columns was rejected to keep uniqueness constraints, searchability, and contact fields queryable via SQL.
