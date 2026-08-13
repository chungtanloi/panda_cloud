/**
 * Workspace resource tables — the list screens under /dashboard, /sales,
 * /manager and /admin.
 *
 * These ten screens all render the same thing: a titled table of records the
 * signed-in role may see. Rather than ten bespoke endpoints with ten schemas
 * invented ahead of their designs, the backend returns the **table itself** —
 * its columns and its rows.
 *
 * That choice is deliberate:
 *   - Column sets differ per resource and will keep changing while the product
 *     is young. A server-driven table absorbs that without a frontend deploy.
 *   - It stops the frontend inventing field names the backend never agreed to.
 *
 * When a resource earns a real design with real interactions, promote it to its
 * own typed model and endpoint. This is the shape for list-and-read, not for
 * anything the user edits.
 */

export type WorkspaceResourceKind =
  // Customer workspace
  | "projects"
  | "clusters"
  | "transactions"
  // Sales workspace
  | "leads"
  | "quotes"
  | "tasks"
  | "customers"
  // Manager workspace
  | "team"
  | "approvals"
  // Admin workspace
  | "users"
  | "audit";

/** How a cell should render. Anything unrecognised falls back to plain text. */
export type ResourceColumnType = "text" | "status" | "link" | "number";

export interface ResourceColumn {
  /** Key into the row object. */
  key: string;
  /** Human label for the header. */
  label: string;
  type?: ResourceColumnType;
  /**
   * For `type: "link"` — a path template with `{id}` substituted from the row,
   * e.g. "/sales/leads/{id}". Absent means render as text.
   */
  href?: string;
}

/** A row is free-form apart from `id`, which the table uses as its key. */
export type ResourceRow = { id: string } & Record<string, string | number>;

export interface ResourceTable {
  kind: WorkspaceResourceKind;
  columns: ResourceColumn[];
  rows: ResourceRow[];
  /** Total matching records, when the backend paginates. */
  total?: number;
}
