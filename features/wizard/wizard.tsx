"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { ArrowLeftIcon, ArrowRightIcon, CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogItem } from "@/lib/catalog/schema";
import { assemblePackage, capacityIssues, summarize } from "@/lib/package";
import { customerDetailsDraftSchema } from "@/lib/schemas/customer";
import { eventBasicsDraftSchema } from "@/lib/schemas/event-basics";
import { getTemplate } from "@/lib/templates";
import { DoneScreen } from "./done-screen";
import { RecentDrafts } from "@/features/drafts/recent-drafts";
import {
  BasicsStep,
  ConfirmStep,
  CustomerStep,
  PackageStep,
  TemplateStep,
  basicsFieldIds,
  customerFieldIds,
} from "./steps";
import { fieldErrors } from "./steps/field-errors";
import { MobileSummaryBar, Summary, SummarySkeleton, type SummaryProps } from "./summary";
import { useCatalog } from "@/features/catalog/use-catalog";
import { useCreateDraft } from "@/features/drafts/use-create-draft";
import { ProgressSteps } from "./progress-steps";
import {
  LAST_STEP,
  STEPS,
  canReach,
  initialWizardState,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from "./reducer";

export function Wizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const catalogQuery = useCatalog();
  const catalog = catalogQuery.data;
  const priced = usePricedPackage(state, catalog);
  const headingRef = useStepFocus(state.step);
  const createMutation = useCreateDraft();
  // Set before the first render after a click, so a fast second click or the
  // toast's retry cannot send the same draft twice.
  const creatingRef = useRef(false);
  // The toast outlives this render, so its retry calls the latest createDraft
  // and sends what the salesperson has entered since the failure.
  const latestCreateDraft = useRef<() => void>(() => {});
  useEffect(() => {
    latestCreateDraft.current = createDraft;
  });

  // Repeat clicks while a request is on its way are ignored. On failure every
  // entered value stays, and the toast offers to try again.
  function createDraft() {
    if (creatingRef.current || !state.templateId || !priced) return;
    creatingRef.current = true;
    const request = {
      templateId: state.templateId,
      basics: priced.basics,
      addedContentIds: state.addedContentIds,
      removedContentIds: state.removedContentIds,
      overrides: state.overrides,
      customer: state.customer,
    };
    createMutation.mutate(request, {
      onSettled: () => {
        creatingRef.current = false;
      },
      onError: (error) =>
        toast.error("Could not create the draft proposal", {
          description: error.message,
          action: { label: "Try again", onClick: () => latestCreateDraft.current() },
        }),
    });
  }

  function startOver() {
    createMutation.reset();
    dispatch({ type: "reset" });
  }

  if (createMutation.isSuccess) {
    return <DoneScreen proposal={createMutation.data} onStartOver={startOver} />;
  }

  const summaryProps: SummaryProps = {
    lines: priced?.lines ?? [],
    summary: priced?.summary ?? null,
    budgetOre: priced?.budgetOre ?? null,
  };

  return (
    <div className="flex flex-col gap-8 pb-24 lg:pb-0">
      <ProgressSteps
        current={state.step}
        isReachable={(step) => canReach(state, step)}
        onSelect={(step) => dispatch({ type: "goToStep", step })}
      />

      {/* grid-cols-1 is minmax(0, 1fr): long, cut-off text cannot widen the page on phones. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-labelledby="step-heading" className="flex flex-col gap-6">
          <h2
            id="step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold tracking-tight outline-none"
          >
            {STEPS[state.step].title}
          </h2>

          {catalogQuery.isPending ? (
            <StepSkeleton />
          ) : catalogQuery.isError ? (
            <CatalogErrorCard
              message={catalogQuery.error.message}
              retrying={catalogQuery.isFetching}
              onRetry={() => catalogQuery.refetch()}
            />
          ) : (
            <>
              <CurrentStep
                state={state}
                catalog={catalog!}
                priced={priced}
                dispatch={dispatch}
                creating={createMutation.isPending}
                onCreate={createDraft}
              />
              <StepButtons state={state} dispatch={dispatch} />
            </>
          )}
        </section>

        <aside aria-label="Package summary" className="hidden lg:sticky lg:top-6 lg:block">
          {catalogQuery.isPending ? (
            <Card>
              <CardContent>
                <SummarySkeleton />
              </CardContent>
            </Card>
          ) : (
            <Summary {...summaryProps} />
          )}
        </aside>
      </div>

      <MobileSummaryBar {...summaryProps} />
    </div>
  );
}

type PricedPackage = NonNullable<ReturnType<typeof usePricedPackage>>;

// Derives the priced lines from the wizard choices. Null until there is a
// catalog, a template and valid guests and dates.
function usePricedPackage(state: WizardState, catalog: CatalogItem[] | undefined) {
  const { templateId, basics: draft, addedContentIds, removedContentIds, overrides } = state;

  return useMemo(() => {
    const template = templateId ? getTemplate(templateId) : null;
    const parsed = eventBasicsDraftSchema.safeParse(draft);
    if (!catalog || !template || !parsed.success) return null;

    const { basics, budgetOre } = parsed.data;
    const choices = { addedContentIds, removedContentIds, overrides };
    const lines = assemblePackage(template, basics, catalog, choices);
    return {
      basics,
      budgetOre,
      lines,
      summary: summarize(lines, basics, budgetOre),
      capacityIssues: capacityIssues(lines, basics.guests),
    };
  }, [catalog, templateId, draft, addedContentIds, removedContentIds, overrides]);
}

// Moves focus to the step heading when the step changes, but not on first load,
// so keyboard and screen reader users start at the top of the new step.
function useStepFocus(step: number) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  return headingRef;
}

type CurrentStepProps = {
  state: WizardState;
  catalog: CatalogItem[];
  priced: PricedPackage | null;
  dispatch: React.Dispatch<WizardAction>;
  creating: boolean;
  onCreate: () => void;
};

function CurrentStep({ state, catalog, priced, dispatch, creating, onCreate }: CurrentStepProps) {
  switch (STEPS[state.step].id) {
    case "template":
      return (
        <>
          <TemplateStep
            catalog={catalog}
            selected={state.templateId}
            onSelect={(templateId) => dispatch({ type: "selectTemplate", templateId })}
          />
          <RecentDrafts />
        </>
      );
    case "basics":
      return (
        <BasicsStep
          draft={state.basics}
          showAllErrors={state.showBasicsErrors}
          onChange={(field, value) => dispatch({ type: "setBasicsField", field, value })}
        />
      );
    case "package":
      // The reducer only opens this step with a template and valid basics.
      if (!priced) return null;
      return (
        <PackageStep
          lines={priced.lines}
          catalog={catalog}
          guests={priced.basics.guests}
          capacityIssues={priced.capacityIssues}
          onQuantityChange={(line, quantity) =>
            dispatch({
              type: "setQuantity",
              contentId: line.contentId,
              quantity,
              derivedQuantity: line.derivedQuantity,
            })
          }
          onReset={(contentId) => dispatch({ type: "resetQuantity", contentId })}
          onRemove={(contentId) => dispatch({ type: "removeItem", contentId })}
          onAdd={(contentId) => dispatch({ type: "addItem", contentId })}
        />
      );
    case "customer":
      return (
        <CustomerStep
          draft={state.customer}
          showAllErrors={state.showCustomerErrors}
          onChange={(field, value) => dispatch({ type: "setCustomerField", field, value })}
        />
      );
    case "confirm": {
      // The reducer only opens this step once every earlier step is complete.
      const customer = customerDetailsDraftSchema.safeParse(state.customer);
      const template = state.templateId ? getTemplate(state.templateId) : undefined;
      if (!priced || !customer.success || !template) return null;
      return (
        <ConfirmStep
          template={template}
          basics={priced.basics}
          budgetOre={priced.budgetOre}
          lines={priced.lines}
          summary={priced.summary}
          capacityIssues={priced.capacityIssues}
          customer={customer.data}
          pending={creating}
          onEdit={(step) => dispatch({ type: "goToStep", step })}
          onCreate={onCreate}
        />
      );
    }
  }
}

function StepButtons({
  state,
  dispatch,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}) {
  const needsTemplate = state.step === 0 && state.templateId === null;

  // When the step has errors, they are shown first and then the first invalid
  // field gets focus, so screen readers read its error with it.
  function goNext() {
    const invalidFieldId = firstInvalidFieldId(state);
    flushSync(() => dispatch({ type: "next" }));
    if (invalidFieldId) document.getElementById(invalidFieldId)?.focus();
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t pt-4">
      <Button
        variant="outline"
        onClick={() => dispatch({ type: "back" })}
        disabled={state.step === 0}
      >
        <ArrowLeftIcon aria-hidden />
        Back
      </Button>
      {state.step < LAST_STEP && (
        <div className="flex items-center gap-3">
          {needsTemplate && (
            <span className="text-sm text-muted-foreground">Pick a template to continue.</span>
          )}
          <Button onClick={goNext} disabled={needsTemplate}>
            Next
            <ArrowRightIcon aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}

// The id of the first field with an error on the current step, or null.
function firstInvalidFieldId(state: WizardState) {
  if (state.step === 1) {
    return firstWithError(fieldErrors(eventBasicsDraftSchema, state.basics), basicsFieldIds);
  }
  if (state.step === 3) {
    return firstWithError(fieldErrors(customerDetailsDraftSchema, state.customer), customerFieldIds);
  }
  return null;
}

// Field ids are listed in form order.
function firstWithError<Field extends string>(
  errors: Partial<Record<Field, string>>,
  ids: Record<Field, string>,
) {
  const field = (Object.keys(ids) as Field[]).find((name) => errors[name]);
  return field ? ids[field] : null;
}

function StepSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy aria-label="Loading the catalog">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-44 rounded-xl" />
      ))}
    </div>
  );
}

type CatalogErrorCardProps = { message: string; retrying: boolean; onRetry: () => void };

function CatalogErrorCard({ message, retrying, onRetry }: CatalogErrorCardProps) {
  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleAlertIcon aria-hidden className="size-5 text-destructive" />
          Could not load the catalog
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} disabled={retrying}>
          {retrying ? "Trying again…" : "Try again"}
        </Button>
      </CardContent>
    </Card>
  );
}
