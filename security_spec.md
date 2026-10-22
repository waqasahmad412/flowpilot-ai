# FlowPilot AI — Firestore Security Specification

## Phase 0: Data Invariants & Threat Modeling

### Core Invariants
1. **Identity & Ownership**: A user cannot read, create, modify, or delete any resource (workspace, workflow, execution, integration, notification) belonging to another user.
2. **PII Isolation**: User profile records (`/users/{userId}`) can only be read and written by the authenticated user whose `request.auth.uid == userId`.
3. **No Blanket Reads**: All `list` operations enforce query boundary constraints (`resource.data.ownerId == request.auth.uid`). No public read access exists.
4. **Immutability of Author & Workspace**: Once created, `ownerId`, `workspaceId`, and `createdAt` are immutable across updates.
5. **Path Hardening**: All document IDs must conform to `^[a-zA-Z0-9_\-]+$` and cannot exceed 128 characters to protect against path traversal and resource poisoning attacks.
6. **Denial of Wallet Protection**: All string fields and payload arrays are strictly bounded by size limits.

---

## The "Dirty Dozen" Malicious Payloads

1. **Spoofed Owner UID on Workspace Create**:
   - `Payload: { id: "ws_hack", name: "Injected WS", ownerId: "victim_user_999", plan: "Enterprise" }`
   - *Expected Result*: `PERMISSION_DENIED` (Incoming `ownerId` does not match `request.auth.uid`).

2. **Ghost Field Injection (Shadow Update) on Workflow**:
   - `Payload: { ...existingWorkflow, isSystemSuperAdmin: true }`
   - *Expected Result*: `PERMISSION_DENIED` (Keys outside allowed schema rejected via strict key diff checks).

3. **Tampering with Terminal Workflow Execution**:
   - `Payload: Attempting to rewrite status of completed execution from "success" to "failed" after completion`
   - *Expected Result*: `PERMISSION_DENIED` (Completed execution logs are append-only/immutable).

4. **Foreign User Workflow Listing (Scraping Attack)**:
   - `Query: collection("workflows").get() without where("ownerId", "==", auth.uid)`
   - *Expected Result*: `PERMISSION_DENIED` (List rules require `resource.data.ownerId == request.auth.uid`).

5. **Cross-Tenant PII Read**:
   - `Request: getDoc(doc(db, "users", "other_user_id"))`
   - *Expected Result*: `PERMISSION_DENIED` (Only `request.auth.uid == userId` permitted).

6. **ID Injection & Poisoning Attack**:
   - `Target: /workflows/../../secrets or a 10KB string ID`
   - *Expected Result*: `PERMISSION_DENIED` (`isValidId` rejects non-alphanumeric or oversized document IDs).

7. **Arbitrary Role Escalation in User Profile**:
   - `Payload: { ...userProfile, role: "SuperAdmin" }`
   - *Expected Result*: `PERMISSION_DENIED` (User profile update rejects unauthorized privilege escalation).

8. **Tampering with Workflow Author ID on Update**:
   - `Payload: { ...existingWorkflow, ownerId: "new_attacker_id" }`
   - *Expected Result*: `PERMISSION_DENIED` (`incoming().ownerId == existing().ownerId` enforced).

9. **Unauthenticated Write**:
   - `Request: setDoc(doc(db, "workflows", "wf_anon"), { ... }) with auth == null`
   - *Expected Result*: `PERMISSION_DENIED` (`isSignedIn()` check fails immediately).

10. **Forged Execution Trigger**:
    - `Payload: { id: "exec_spoof", workflowId: "wf_victim", ownerId: "victim_user" }`
    - *Expected Result*: `PERMISSION_DENIED` (`ownerId` must equal `request.auth.uid`).

11. **Malicious Notification Hijacking**:
    - `Payload: Updating another user's notification or injecting notification to another user's inbox`
    - *Expected Result*: `PERMISSION_DENIED` (Strict owner integrity check).

12. **Denial of Wallet Oversized String Payload**:
    - `Payload: { name: "A".repeat(500000), ... }`
    - *Expected Result*: `PERMISSION_DENIED` (String length boundary checks fail).
