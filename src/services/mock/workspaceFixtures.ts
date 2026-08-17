import type { ResourceTable, WorkspaceResourceKind } from "@/models/workspace";

/**
 * Seed tables for the workspace list screens.
 *
 * ⚠ ILLUSTRATIVE DATA. These rows were written to exercise the layout, not to
 * describe anything real. They live here — behind the mock adapter — rather
 * than inside the component so the UI has exactly one source of data and
 * switching to the real backend needs no component change.
 *
 * Column definitions travel with the rows because the real endpoint sends them
 * too; see models/workspace.ts for why the table is server-driven.
 */
export const mockWorkspaceTables: Record<WorkspaceResourceKind, ResourceTable> = {
  projects: {
    kind: "projects",
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "region", label: "Region" },
      { key: "status", label: "Status", type: "status" },
      { key: "created", label: "Created" },
      { key: "progress", label: "Progress" },
    ],
    rows: [
      { id: "PRJ-204", name: "H100 Training Fabric", type: "GPU Renting", region: "Singapore", status: "Active", created: "Aug 02, 2026", progress: "82%" },
      { id: "PRJ-198", name: "Can Tho Site Review", type: "Land Assessment", region: "Vietnam", status: "Review", created: "Jul 24, 2026", progress: "54%" },
      { id: "PRJ-177", name: "CPT Allocation", type: "Investment", region: "Global", status: "Approved", created: "Jul 10, 2026", progress: "100%" },
    ],
  },

  clusters: {
    kind: "clusters",
    columns: [
      { key: "name", label: "Name" },
      { key: "model", label: "Model" },
      { key: "count", label: "GPUs", type: "number" },
      { key: "region", label: "Region" },
      { key: "utilization", label: "Utilization" },
      { key: "status", label: "Status", type: "status" },
      { key: "hourly", label: "Hourly" },
      { key: "monthly", label: "Monthly" },
    ],
    rows: [
      { id: "GPU-91", name: "Atlas Training", model: "NVIDIA H100 SXM", count: 64, region: "APAC Southeast", utilization: "72%", status: "Running", hourly: "$208", monthly: "$149,760" },
      { id: "GPU-76", name: "Vector Inference", model: "NVIDIA L40S", count: 16, region: "US East", utilization: "38%", status: "Running", hourly: "$24", monthly: "$17,280" },
    ],
  },

  transactions: {
    kind: "transactions",
    columns: [
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "asset", label: "Asset" },
      { key: "network", label: "Network" },
      { key: "status", label: "Status", type: "status" },
      { key: "date", label: "Date" },
    ],
    rows: [
      { id: "TX-8A91", type: "GPU Usage", amount: "$12,480", asset: "USD", network: "Panda Cloud", status: "Completed", date: "Aug 12, 2026" },
      { id: "TX-8A72", type: "Token Purchase", amount: "4,200", asset: "CPT", network: "Ethereum", status: "Processing", date: "Aug 10, 2026" },
    ],
  },

  leads: {
    kind: "leads",
    columns: [
      { key: "name", label: "Name", type: "link", href: "/sales/leads/{id}" },
      { key: "company", label: "Company" },
      { key: "interest", label: "Interest" },
      { key: "source", label: "Source" },
      { key: "owner", label: "Owner" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status", type: "status" },
      { key: "budget", label: "Budget" },
      { key: "timeline", label: "Timeline" },
      { key: "activity", label: "Last activity" },
    ],
    rows: [
      { id: "LD-182", name: "Minh Tran", company: "Northstar AI", interest: "GPU Renting", source: "Website", owner: "A. Nguyen", priority: "High", status: "Qualified", budget: "$480K", timeline: "Q4 2026", activity: "2h ago" },
      { id: "LD-179", name: "Sofia Chen", company: "Aperture Grid", interest: "Hyperscale", source: "Referral", owner: "J. Pham", priority: "Critical", status: "Proposal", budget: "$18M", timeline: "Q2 2027", activity: "Yesterday" },
    ],
  },

  quotes: {
    kind: "quotes",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status", type: "status" },
      { key: "created", label: "Created" },
      { key: "expires", label: "Expires" },
      { key: "owner", label: "Owner" },
    ],
    rows: [
      { id: "QT-2031", customer: "Northstar AI", type: "GPU Cluster", amount: "$482,000", status: "Sent", created: "Aug 10", expires: "Sep 10", owner: "A. Nguyen" },
      { id: "QT-2022", customer: "Aperture Grid", type: "Infrastructure", amount: "$4,250,000", status: "Review", created: "Aug 08", expires: "Sep 08", owner: "J. Pham" },
    ],
  },

  tasks: {
    kind: "tasks",
    columns: [
      { key: "task", label: "Task" },
      { key: "lead", label: "Lead" },
      { key: "owner", label: "Owner" },
      { key: "due", label: "Due" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "TSK-91", task: "Review H100 capacity", lead: "Northstar AI", owner: "A. Nguyen", due: "Today, 16:00", priority: "High", status: "Today" },
      { id: "TSK-88", task: "Send revised infrastructure quote", lead: "Aperture Grid", owner: "J. Pham", due: "Aug 11", priority: "Critical", status: "Overdue" },
    ],
  },

  customers: {
    kind: "customers",
    columns: [
      { key: "company", label: "Company" },
      { key: "contact", label: "Primary contact" },
      { key: "track", label: "Track" },
      { key: "deals", label: "Open deals", type: "number" },
      { key: "value", label: "Lifetime value" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "CUS-31", company: "Northstar AI", contact: "Minh Tran", track: "GPU Renting", deals: 2, value: "$612,000", status: "Active" },
      { id: "CUS-22", company: "Aperture Grid", contact: "Sofia Chen", track: "Hyperscale", deals: 1, value: "$18,400,000", status: "Active" },
    ],
  },

  team: {
    kind: "team",
    columns: [
      { key: "salesperson", label: "Salesperson" },
      { key: "assigned", label: "Assigned", type: "number" },
      { key: "open", label: "Open", type: "number" },
      { key: "won", label: "Won", type: "number" },
      { key: "pipeline", label: "Pipeline" },
      { key: "conversion", label: "Conversion" },
      { key: "performance", label: "Performance", type: "status" },
    ],
    rows: [
      { id: "USR-11", salesperson: "An Nguyen", assigned: 24, open: 11, won: 8, pipeline: "$2.4M", conversion: "31%", performance: "Strong" },
      { id: "USR-18", salesperson: "Jun Pham", assigned: 19, open: 9, won: 6, pipeline: "$8.1M", conversion: "28%", performance: "On track" },
    ],
  },

  approvals: {
    kind: "approvals",
    columns: [
      { key: "request", label: "Request" },
      { key: "customer", label: "Customer" },
      { key: "amount", label: "Amount" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status", type: "status" },
      { key: "submitted", label: "Submitted" },
    ],
    rows: [
      { id: "APR-81", request: "Large Deal", customer: "Aperture Grid", amount: "$4.25M", owner: "J. Pham", status: "Pending", submitted: "Aug 11" },
      { id: "APR-77", request: "Discount", customer: "Northstar AI", amount: "14%", owner: "A. Nguyen", status: "Changes requested", submitted: "Aug 10" },
    ],
  },

  users: {
    kind: "users",
    columns: [
      { key: "user", label: "User" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status", type: "status" },
      { key: "created", label: "Created" },
      { key: "login", label: "Last login" },
    ],
    rows: [
      { id: "USR-102", user: "Jane Cooper", email: "jane@northstar.ai", role: "USER", status: "Active", created: "Jul 02, 2026", login: "12 min ago" },
      { id: "USR-041", user: "An Nguyen", email: "an@cloudpanda.example", role: "SALES", status: "Active", created: "Mar 18, 2026", login: "1h ago" },
    ],
  },

  audit: {
    kind: "audit",
    columns: [
      { key: "timestamp", label: "Time" },
      { key: "user", label: "User" },
      { key: "role", label: "Role" },
      { key: "action", label: "Action" },
      { key: "resource", label: "Resource" },
      { key: "resourceId", label: "Resource id" },
      { key: "result", label: "Result", type: "status" },
    ],
    rows: [
      { id: "AUD-9001", timestamp: "10:32", user: "admin@cloudpanda.example", role: "ADMIN", action: "Updated User", resource: "User", resourceId: "USR-102", result: "SUCCESS" },
      { id: "AUD-8998", timestamp: "09:18", user: "manager@cloudpanda.example", role: "MANAGER", action: "Approved Quote", resource: "Quote", resourceId: "QT-2031", result: "SUCCESS" },
    ],
  },
};
