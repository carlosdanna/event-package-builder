import { describe, expect, it } from "vitest";
import {
  canReach,
  initialWizardState,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from "./reducer";

function run(...actions: WizardAction[]) {
  return actions.reduce(wizardReducer, initialWizardState);
}

const validBasics: WizardAction[] = [
  { type: "setBasicsField", field: "guests", value: "40" },
  { type: "setBasicsField", field: "startDate", value: "2026-10-14" },
  { type: "setBasicsField", field: "endDate", value: "2026-10-15" },
];

const toPackageStep: WizardAction[] = [
  { type: "selectTemplate", templateId: "conference" },
  { type: "next" },
  ...validBasics,
  { type: "next" },
];

describe("wizardReducer navigation", () => {
  it("does not leave the template step without a template", () => {
    expect(run({ type: "next" }).step).toBe(0);
  });

  it("shows the basics errors instead of moving on when basics are invalid", () => {
    const state = run({ type: "selectTemplate", templateId: "wedding" }, { type: "next" }, {
      type: "next",
    });
    expect(state.step).toBe(1);
    expect(state.showBasicsErrors).toBe(true);
  });

  it("keeps every entered value when going back and forward", () => {
    const forward = run(...toPackageStep);
    const back = run(...toPackageStep, { type: "back" }, { type: "back" });
    expect(back.step).toBe(0);
    expect(back.basics).toEqual(forward.basics);
    expect(back.templateId).toBe("conference");
    expect(wizardReducer(wizardReducer(back, { type: "next" }), { type: "next" }).step).toBe(2);
  });

  it("does not go past the last step or before the first", () => {
    expect(run({ type: "back" }).step).toBe(0);
    const last: WizardState = { ...run(...toPackageStep), step: 4, furthestStep: 4 };
    expect(wizardReducer(last, { type: "next" }).step).toBe(4);
  });

  it("opens only steps already reached, with every earlier step complete", () => {
    const state = run(...toPackageStep, { type: "back" }, { type: "back" });
    expect(wizardReducer(state, { type: "goToStep", step: 2 }).step).toBe(2);
    expect(wizardReducer(state, { type: "goToStep", step: 3 }).step).toBe(0);

    const cleared = wizardReducer(state, { type: "setBasicsField", field: "guests", value: "" });
    expect(canReach(cleared, 2)).toBe(false);
    expect(canReach(cleared, 1)).toBe(true);
  });
});

describe("wizardReducer package choices", () => {
  it("stores an override and drops it when the suggested quantity is typed back", () => {
    const overridden = run({ type: "setQuantity", contentId: 4, quantity: 30, derivedQuantity: 80 });
    expect(overridden.overrides).toEqual({ 4: 30 });

    const back = wizardReducer(overridden, {
      type: "setQuantity",
      contentId: 4,
      quantity: 80,
      derivedQuantity: 80,
    });
    expect(back.overrides).toEqual({});
  });

  it("ignores quantities that are not whole numbers of zero or more", () => {
    expect(run({ type: "setQuantity", contentId: 4, quantity: -1, derivedQuantity: 8 }).overrides)
      .toEqual({});
    expect(run({ type: "setQuantity", contentId: 4, quantity: 1.5, derivedQuantity: 8 }).overrides)
      .toEqual({});
  });

  it("resets an override", () => {
    const state = run(
      { type: "setQuantity", contentId: 4, quantity: 30, derivedQuantity: 80 },
      { type: "resetQuantity", contentId: 4 },
    );
    expect(state.overrides).toEqual({});
  });

  it("removes an item with its override and adds it back", () => {
    const removed = run(
      { type: "setQuantity", contentId: 4, quantity: 30, derivedQuantity: 80 },
      { type: "addItem", contentId: 9 },
      { type: "removeItem", contentId: 4 },
      { type: "removeItem", contentId: 9 },
    );
    expect(removed.removedContentIds).toEqual([4, 9]);
    expect(removed.addedContentIds).toEqual([]);
    expect(removed.overrides).toEqual({});

    const restored = wizardReducer(removed, { type: "addItem", contentId: 4 });
    expect(restored.removedContentIds).toEqual([9]);
    expect(restored.addedContentIds).toEqual([4]);
  });

  it("clears package changes when a different template is picked, keeping basics", () => {
    const state = run(
      ...toPackageStep,
      { type: "addItem", contentId: 9 },
      { type: "setQuantity", contentId: 4, quantity: 30, derivedQuantity: 80 },
      { type: "selectTemplate", templateId: "wedding" },
    );
    expect(state.addedContentIds).toEqual([]);
    expect(state.overrides).toEqual({});
    expect(state.basics.guests).toBe("40");
  });

  it("keeps package changes when the same template is picked again", () => {
    const state = run(
      { type: "selectTemplate", templateId: "wedding" },
      { type: "addItem", contentId: 9 },
      { type: "selectTemplate", templateId: "wedding" },
    );
    expect(state.addedContentIds).toEqual([9]);
  });
});

describe("wizardReducer customer details", () => {
  const toCustomerStep: WizardAction[] = [...toPackageStep, { type: "next" }];
  const validCustomer: WizardAction[] = [
    { type: "setCustomerField", field: "company", value: "Acme AB" },
    { type: "setCustomerField", field: "contactName", value: "Anna Berg" },
    { type: "setCustomerField", field: "contactEmail", value: "anna@acme.example" },
  ];

  it("shows the customer errors instead of moving on when details are missing", () => {
    const state = run(...toCustomerStep, { type: "next" });
    expect(state.step).toBe(3);
    expect(state.showCustomerErrors).toBe(true);
  });

  it("moves to the confirm step with valid details and keeps them when going back", () => {
    const state = run(...toCustomerStep, ...validCustomer, { type: "next" });
    expect(state.step).toBe(4);
    const back = wizardReducer(wizardReducer(state, { type: "goToStep", step: 1 }), {
      type: "goToStep",
      step: 4,
    });
    expect(back.step).toBe(4);
    expect(back.customer.company).toBe("Acme AB");
  });

  it("blocks the confirm step when the customer details become invalid", () => {
    const state = run(...toCustomerStep, ...validCustomer, { type: "next" }, { type: "back" });
    const cleared = wizardReducer(state, {
      type: "setCustomerField",
      field: "contactEmail",
      value: "",
    });
    expect(canReach(cleared, 4)).toBe(false);
  });

  it("starts over on reset", () => {
    const state = run(...toCustomerStep, ...validCustomer, { type: "reset" });
    expect(state).toEqual(initialWizardState);
  });
});
