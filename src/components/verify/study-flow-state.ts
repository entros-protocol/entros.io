import type { StudyRecordStatus } from "@entros/pulse-sdk";
import type { ActiveStudyGrant } from "@/lib/population-study";

export interface StudyContinuation {
  invitation: string;
  definition: ActiveStudyGrant["definition"];
}

export interface StudyProgress {
  status: StudyRecordStatus;
  trialIndex: number;
  trialLimit: number;
  completionReason: "preview" | "disabled" | "exhausted" | null;
}

export interface StudyFlowState {
  invitation: string | null;
  decision: "pending" | "normal" | "joined";
  grant: ActiveStudyGrant | null;
  progress: StudyProgress | null;
  continuation: StudyContinuation | null;
  tokenPending: boolean;
  tokenError: string | null;
}

export const initialStudyFlowState: StudyFlowState = {
  invitation: null,
  decision: "pending",
  grant: null,
  progress: null,
  continuation: null,
  tokenPending: false,
  tokenError: null,
};

export type StudyFlowAction =
  | { type: "LOAD_INVITATION"; invitation: string }
  | { type: "READY"; grant: ActiveStudyGrant | null }
  | {
      type: "RECORD_STATUS";
      progress: StudyProgress;
      continuation: StudyContinuation | null;
    }
  | { type: "NEXT_PENDING" }
  | { type: "NEXT_READY"; grant: ActiveStudyGrant }
  | { type: "NEXT_FAILED"; message: string }
  | { type: "LEAVE" };

export function studyFlowReducer(
  state: StudyFlowState,
  action: StudyFlowAction,
): StudyFlowState {
  switch (action.type) {
    case "LOAD_INVITATION":
      return {
        ...initialStudyFlowState,
        invitation: action.invitation,
      };
    case "READY":
      return {
        ...initialStudyFlowState,
        decision: action.grant ? "joined" : "normal",
        grant: action.grant,
      };
    case "RECORD_STATUS":
      return {
        ...state,
        grant: null,
        progress: action.progress,
        continuation: action.continuation,
        tokenError: null,
      };
    case "NEXT_PENDING":
      return {
        ...state,
        tokenPending: true,
        tokenError: null,
      };
    case "NEXT_READY":
      return {
        ...state,
        grant: action.grant,
        continuation: null,
        tokenPending: false,
        tokenError: null,
      };
    case "NEXT_FAILED":
      return {
        ...state,
        tokenPending: false,
        tokenError: action.message,
      };
    case "LEAVE":
      return {
        ...initialStudyFlowState,
        decision: "normal",
      };
  }
}
