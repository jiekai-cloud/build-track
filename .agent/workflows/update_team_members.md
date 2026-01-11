---
description: Update Team Members Mock Data
---

# Update Team Members Mock Data

This workflow updates the `MOCK_TEAM_MEMBERS` in `constants.ts` to remove specific personnel and establish separate lists for the First and Third Engineering Departments.

## Steps

1.  **Modify `constants.ts`**:
    -   Locate `MOCK_TEAM_MEMBERS`.
    -   Remove the entries for "李大維", "張家銘", "陳小美", "王雪芬".
    -   Add new entries for "First Engineering Department" (Department ID: `DEPT-4`) and "Third Engineering Department" (Department ID: `DEPT-8`).
    -   Ensure the new members are assigned to the correct `departmentId` and `departmentIds`.

## Logic

The change ensures that when the application loads the mock data, there are distinct team members for both engineering departments, satisfying the requirement to separate their personnel lists.
