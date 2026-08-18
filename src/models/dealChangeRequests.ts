export type DealChangeRequestType = "mark_won" | "mark_lost" | "archive";
export type DealChangeRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface DealChangeRequestActor {
  userId: string;
  fullName: string | null;
}

export interface DealChangeRequest {
  requestId: string;
  dealId: string;
  dealTitle: string | null;
  organizationName: string | null;
  ownerName: string | null;
  currentStage: string | null;
  requestedBy: DealChangeRequestActor;
  reviewedBy: DealChangeRequestActor | null;
  requestType: DealChangeRequestType;
  status: DealChangeRequestStatus;
  reason: string;
  expectedDealRevision: number;
  currentDealRevision: number | null;
  decisionComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface DealChangeRequestPage {
  items: DealChangeRequest[];
  nextCursor: string | null;
  isDone: boolean;
}

export interface DealChangeRequestCreate {
  requestType: DealChangeRequestType;
  reason: string;
  expectedDealRevision: number;
  idempotencyKey: string;
}

export interface DealChangeRequestDecision {
  decision: "approve" | "reject";
  expectedRequestRevision: number;
  comment?: string;
}
