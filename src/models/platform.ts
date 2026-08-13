import type { IsoDateTime } from "./common";
import type { UserRole } from "./auth";

export type ProjectStatus = "Draft" | "Pending" | "Review" | "Approved" | "Provisioning" | "Active" | "Completed" | "Cancelled";
export interface Project { id: string; name: string; type: string; region: string; status: ProjectStatus; createdAt: IsoDateTime; progress: number; }
export type GPUClusterStatus = "Pending" | "Provisioning" | "Running" | "Paused" | "Stopped" | "Error";
export interface GPUCluster { id: string; name: string; gpuModel: string; gpuCount: number; region: string; utilization: number; status: GPUClusterStatus; hourlyCostUsd: number; monthlyCostUsd: number; }
export interface Portfolio { totalValueUsd: number; cptBalance: number; allocation: string; apy?: number; projectedValueUsd?: number; activeInvestments: number; }
export interface Wallet { address: string; network: string; tokenBalance: number; availableBalance: number; lockedBalance: number; }
export type TransactionStatus = "Pending" | "Processing" | "Completed" | "Failed" | "Cancelled";
export interface Transaction { id: string; type: string; amount: number; asset: string; network: string; status: TransactionStatus; date: IsoDateTime; }
export interface Lead { id: string; name: string; company: string; interest: string; source: string; owner: string; priority: string; status: string; budgetUsd?: number; timeline: string; lastActivity: IsoDateTime; }
export interface Quote { id: string; customer: string; type: string; amountUsd: number; status: "Draft" | "Review" | "Sent" | "Accepted" | "Expired" | "Rejected"; createdAt: IsoDateTime; expiresAt: IsoDateTime; owner: string; }
export interface Task { id: string; title: string; lead: string; owner: string; dueDate: string; priority: string; status: "Today" | "Upcoming" | "Overdue" | "Completed"; }
export interface Activity { id: string; title: string; detail?: string; actor: string; createdAt: IsoDateTime; }
export interface Notification { id: string; title: string; read: boolean; createdAt: IsoDateTime; }
export interface AuditLog { id: string; timestamp: IsoDateTime; user: string; role: UserRole; action: string; resource: string; resourceId: string; metadata?: string; result: "SUCCESS" | "FAILURE"; }
