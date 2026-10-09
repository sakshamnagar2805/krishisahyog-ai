# Phase 6 — Review and Publication Workflow

## Implemented
- `server/db/migrations/0005_review_publication.sql`: immutable publication event history and one-pending-review-per-record constraint.
- `server/review/workflow.ts`: transactional submission, approval, rejection, and withdrawal service across scheme versions, policy versions and eligibility rule versions. Server-side role validation, independent approval, approved source/evidence prerequisites, row locks and audit event logging.
- `tests/phase6_review.test.mjs`: eight positive and negative validation tests.

## Safety boundaries
- No public review endpoint was added. Hook into a server-authenticated administration API only after robust session authentication and DB-backed permission enforcement exist.
- No demo or fabricated government records were added. Existing public views remain untouched.
- Approval of a policy/scheme version requires source permission and a stored source document. Approval of an eligibility rule requires an approved policy clause evidence link.
- Withdraw transitions to SUPERSEDED and retains audit trail; no destructive rollback of historical records.

## Outstanding
- Run database migration on actual PostgreSQL and test transaction rollback, concurrent approvals and referential integrity.
- Build an authenticated review queue UI and an API with explicit RBAC; not implemented in this phase.
- Build side-by-side content diff; only linked policy version relations from Phase 5 exist so far.
- Full dependency-based TypeScript/Vite build not run.
- End-to-end publication to live government catalog not established.

## Verification
- `node --experimental-strip-types --test tests/phase6_review.test.mjs`: 8 passed, 0 failed.
