/**
 * Web study intake. While it is closed, `/verify` renders no study UI and
 * requests nothing from the study routes, and both routes answer 404 before
 * they contact the study service.
 */
export const STUDY_INTAKE_OPEN: boolean = false;
