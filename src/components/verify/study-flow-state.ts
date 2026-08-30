import type { StudyRecordStatus } from "@entros/pulse-sdk";
import type { ActiveStudyGrant } from "@/lib/population-study";

export interface StudyContinuation {
  definition: ActiveStudyGrant["definition"];
  authorization: ActiveStudyGrant["authorization"];
}

export interface StudyProgress {
  status: StudyRecordStatus;
  trialIndex: number;
  trialLimit: number;
  completionReason: "preview" | "disabled" | "exhausted" | null;
}

export interface StudyFlowState {
  definition: ActiveStudyGrant["definition"] | null;
  decision: "loading" | "pending" | "consented" | "normal" | "joined";
  grant: ActiveStudyGrant | null;
  progress: StudyProgress | null;
  continuation: StudyContinuation | null;
  tokenPending: boolean;
  tokenError: string | null;
  tokenRetryAllowed: boolean;
}

export const initialStudyFlowState: StudyFlowState = {
  definition: null,
  decision: "loading",
  grant: null,
  progress: null,
  continuation: null,
  tokenPending: false,
  tokenError: null,
  tokenRetryAllowed: true,
};

export type StudyFlowAction =
  | { type: "DEFINITION_READY"; definition: ActiveStudyGrant["definition"] }
  | { type: "STUDY_UNAVAILABLE" }
  | { type: "CONSENT_ACCEPTED" }
  | { type: "PREPARE_PENDING" }
  | { type: "PREPARE_READY"; grant: ActiveStudyGrant }
  | { type: "PREPARE_FAILED"; message: string; retryAllowed?: boolean }
  | { type: "READY"; grant: ActiveStudyGrant | null }
  | {
      type: "RECORD_STATUS";
      progress: StudyProgress;
      continuation: StudyContinuation | null;
    }
  | { type: "NEXT_PENDING" }
  | { type: "NEXT_READY"; grant: ActiveStudyGrant }
  | { type: "NEXT_FAILED"; message: string; retryAllowed?: boolean }
  | { type: "LEAVE" };

export function studyFlowReducer(
  state: StudyFlowState,
  action: StudyFlowAction,
): StudyFlowState {
  switch (action.type) {
    case "DEFINITION_READY":
      return {
        ...initialStudyFlowState,
        definition: action.definition,
        decision: "pending",
      };
    case "STUDY_UNAVAILABLE":
      return { ...initialStudyFlowState, decision: "normal" };
    case "CONSENT_ACCEPTED":
      if (!state.definition) return state;
      return {
        ...initialStudyFlowState,
        definition: state.definition,
        decision: "consented",
      };
    case "PREPARE_PENDING":
      if (state.decision !== "consented" || !state.definition) return state;
      return {
        ...state,
        tokenPending: true,
        tokenError: null,
        tokenRetryAllowed: true,
      };
    case "PREPARE_READY":
      return {
        ...initialStudyFlowState,
        decision: "joined",
        grant: action.grant,
      };
    case "PREPARE_FAILED":
      if (state.decision !== "consented") return state;
      return {
        ...state,
        tokenPending: false,
        tokenError: action.message,
        tokenRetryAllowed: action.retryAllowed ?? true,
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
        continuation:
          action.retryAllowed === false ? null : state.continuation,
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
