# ADR 0001 — Supabase Storage private bucket for product photos

## Status

Accepted 2026-10-21 (design only; implementation requires separate approval).

## Context

Product photos must be efficient to store and display, never duplicated, and never bulk the database. The novel constraint from grilling: bottom-line efficiency and dedup matter more than exotic formats; visual matching of re-compressed photos is explicitly not needed. The stack already uses Supabase (local isolated + one existing Cloud project `ohltpkxtucchqezkgfok`) with owner-checked private PostgreSQL RPCs. Cloud changes require a separate approval gate, so the choice must remain local-provable and later cloud-movable without redesign.

## Decision

Store product photos in a private Supabase Storage bucket, not in PostgreSQL, not on the app server filesystem, and not in a new vendor (Vercel Blob).

- Object naming derives from SHA-256 of the processed image content: identical uploads (of the processed variants) reuse the same object instead of creating a copy.
- Each product references at most one photo via small metadata (content hash, size, dimensions) kept in the products row, satisfying "database not bloated"; bytes live only in the bucket.
- Serving goes through an owner-session-guarded route handler rather than per-request signed URLs, with `Cache-Control: private, immutable` and an ETag from the content hash, so repeat views are cheap and privacy is preserved.
- Image processing (resize/compress to a display ~512px WebP variant and ~96px thumbnail) happens in the browser at upload time via canvas; no new server dependency such as sharp.
- Removing an old photo object is lazy and best-effort: it is deleted only when no other product references the same content hash.

## Consequences

- One provider, already in place: no new infrastructure dependency; the same design applies to local and Cloud projects, with bucket creation/policies gated as any migration.
- PostgreSQL stores only references; no base64/blob columns, no schema growth per photo.
- Re-compressed or differently angled photos of the same product are *not* treated as duplicates — exact-content matching only, avoiding fragile visual-matching logic.
- Lazy deletion may briefly leave unreferenced objects; a later, separately approved cleanup pass can remove them.
- Because serving checks the owner session per-object (with caching mitigating repeat hits), photo traffic cannot be offloaded to a public CDN without redesigning privacy.

## Alternatives considered

- **Vercel Blob**: a new vendor + cloud provisioning outside the approved boundary; slower path to local proof.
- **PostgreSQL bytea / base64 in rows**: bloats the database and duplicates backup/restore cost, directly against the stated requirement.
- **Server filesystem**: breaks once the app deploys (Vercel), incompatible with the confirmed target.
