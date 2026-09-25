// Wizard state: the salesperson's choices, never the priced lines.
// Lines are derived from these choices with assemblePackage, so they cannot go stale.
import {
  emptyEventBasicsDraft,
  eventBasicsDraftSchema,
  type EventBasicsDraft,
} from "@/lib/schemas/event-basics";
import type { TemplateId } from "@/lib/templates/schema";

export const STEPS = [
  { id: "template", label: "Template", title: "Pick a template" },
  { id: "basics", label: "Event basics", title: "Guests and dates" },
  { id: "package", label: "Package", title: "Build the package" },
  { id: "customer", label: "Customer", title: "Customer details" },
  { id: "confirm", label: "Confirm", title: "Confirm and create" },
] as const;

export const LAST_STEP = STEPS.length - 1;

export type WizardState = {
  step: number;
  furthestStep: number;
  templateId: TemplateId | null;
  basics: EventBasicsDraft;
  showBasicsErrors: boolean;
  addedContentIds: number[];
  removedContentIds: number[];
  overrides: Record<number, number>; // content id to quantity
};

export type WizardAction =
  | { type: "selectTemplate"; templateId: TemplateId }
  | { type: "setBasicsField"; field: keyof EventBasicsDraft; value: string }
  | { type: "setQuantity"; contentId: number; quantity: number; derivedQuantity: number }
  | { type: "resetQuantity"; contentId: number }
  | { type: "addItem"; contentId: number }
  | { type: "removeItem"; contentId: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "goToStep"; step: number };

export const initialWizardState: WizardState = {
  step: 0,
  furthestStep: 0,
  templateId: null,
  basics: emptyEventBasicsDraft,
  showBasicsErrors: false,
  addedContentIds: [],
  removedContentIds: [],
  overrides: {},
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "selectTemplate":
      return selectTemplate(state, action.templateId);
    case "setBasicsField":
      return { ...state, basics: { ...state.basics, [action.field]: action.value } };
    case "setQuantity":
      return setQuantity(state, action.contentId, action.quantity, action.derivedQuantity);
    case "resetQuantity":
      return { ...state, overrides: without(state.overrides, action.contentId) };
    case "addItem":
      return addItem(state, action.contentId);
    case "removeItem":
      return removeItem(state, action.contentId);
    case "next":
      return next(state);
    case "back":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "goToStep":
      return canReach(state, action.step) ? { ...state, step: action.step } : state;
  }
}

// Whether the salesperson can move past a step with what they have entered.
export function canLeaveStep(state: WizardState, step: number) {
  if (step === 0) return state.templateId !== null;
  if (step === 1) return eventBasicsDraftSchema.safeParse(state.basics).success;
  return true;
}

// A step can be opened from the progress bar once it has been reached,
// as long as every step before it is still complete.
export function canReach(state: WizardState, step: number) {
  if (step < 0 || step > state.furthestStep) return false;
  for (let earlier = 0; earlier < step; earlier++) {
    if (!canLeaveStep(state, earlier)) return false;
  }
  return true;
}

// A new template starts a new package, so changes to the old one are dropped.
// Guests, dates and budget are kept.
function selectTemplate(state: WizardState, templateId: TemplateId): WizardState {
  if (state.templateId === templateId) return state;
  return { ...state, templateId, addedContentIds: [], removedContentIds: [], overrides: {} };
}

// Typing the suggested quantity back in is the same as a reset.
function setQuantity(
  state: WizardState,
  contentId: number,
  quantity: number,
  derivedQuantity: number,
): WizardState {
  if (!Number.isInteger(quantity) || quantity < 0) return state;
  const overrides =
    quantity === derivedQuantity
      ? without(state.overrides, contentId)
      : { ...state.overrides, [contentId]: quantity };
  return { ...state, overrides };
}

function addItem(state: WizardState, contentId: number): WizardState {
  const addedContentIds = state.addedContentIds.includes(contentId)
    ? state.addedContentIds
    : [...state.addedContentIds, contentId];
  return {
    ...state,
    addedContentIds,
    removedContentIds: state.removedContentIds.filter((id) => id !== contentId),
  };
}

function removeItem(state: WizardState, contentId: number): WizardState {
  return {
    ...state,
    addedContentIds: state.addedContentIds.filter((id) => id !== contentId),
    removedContentIds: state.removedContentIds.includes(contentId)
      ? state.removedContentIds
      : [...state.removedContentIds, contentId],
    overrides: without(state.overrides, contentId),
  };
}

function next(state: WizardState): WizardState {
  if (state.step === LAST_STEP) return state;
  if (!canLeaveStep(state, state.step)) {
    return state.step === 1 ? { ...state, showBasicsErrors: true } : state;
  }
  const step = state.step + 1;
  return { ...state, step, furthestStep: Math.max(state.furthestStep, step) };
}

function without(overrides: Record<number, number>, contentId: number) {
  const rest = { ...overrides };
  delete rest[contentId];
  return rest;
}
