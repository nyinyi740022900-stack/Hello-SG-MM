"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import {
  loadPassportDraft,
  savePassportDraft,
  EMPTY_PASSPORT_DRAFT,
  type PassportDraftData,
  type WorkerType,
} from "@/lib/formDrafts";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { INPUT_CLASS } from "@/components/ui/FormField";

type FieldSpec = {
  key: keyof PassportDraftData;
  label: string;
  hint?: string;
  required?: boolean;
  type?: "text" | "date" | "select";
  options?: string[];
};

const STAY_TYPE_OPTIONS = ["Work Permit (WP)", "S Pass", "Employment Pass (EP)", "PR", "Student Pass", "Visit Pass"];
const GENDER_OPTIONS = ["Male", "Female"];

/**
 * Step field groups mirror the real Myanmar Embassy Singapore passport
 * renewal forms — see src/lib/formDrafts.ts for the source PDFs.
 */
function useSteps(workerType: WorkerType): FieldSpec[][] {
  return useMemo(() => {
    const steps: FieldSpec[][] = [
      [
        { key: "fullName", label: "Name (Myanmar) / အမည်", required: true },
        { key: "nrcNumber", label: "NRC / National ID Card No. / မှတ်ပုံတင်အမှတ်", required: true },
        { key: "fatherName", label: "Father's Name / အဘအမည်", required: true },
        { key: "motherName", label: "Mother's Name / အမိအမည်", required: true },
        { key: "spouseName", label: "Husband / Wife's Name / ခင်ပွန်း-ဇနီးအမည် (optional)" },
        { key: "dateOfBirth", label: "Date of Birth / မွေးသက္ကရာဇ်", required: true, type: "date" },
        { key: "placeOfBirth", label: "Place of Birth / မွေးဖွားရာဒေသ", required: true },
        { key: "gender", label: "Gender / ကျား-မ", type: "select", options: GENDER_OPTIONS },
      ],
      [
        { key: "occupation", label: "Occupation / အလုပ်အကိုင်", required: true },
        { key: "salary", label: "Salary / လစာ" },
        {
          key: "employerCompany",
          label:
            workerType === "maid" ? "Employer / Company / အလုပ်ရှင်" : "Company / Organization / ကုမ္ပဏီ",
        },
        { key: "stayType", label: "Stay Type / Pass အမျိုးအစား", type: "select", options: STAY_TYPE_OPTIONS },
        { key: "finNumber", label: "FIN No. / FIN နံပါတ်" },
      ],
      [
        { key: "heightFeet", label: "Height — Feet / အရပ် (ပေ)" },
        { key: "heightInches", label: "Height — Inches / လက်မ" },
        { key: "eyeColor", label: "Eye Color / မျက်လုံးအရောင်" },
        { key: "specialPeculiarities", label: "Special Peculiarities / ထင်ရှားသည့်အမှတ်အသား (optional)" },
        { key: "raceReligion", label: "Race & Religion / လူမျိုးနှင့်ဘာသာ" },
      ],
      [
        { key: "currentPassportNumber", label: "Current Passport No. / လက်ရှိပတ်စပို့နံပါတ်", required: true },
        { key: "currentPassportIssuedDate", label: "Issued Date / ထုတ်ပေးသည့်ရက်စွဲ", type: "date" },
        { key: "currentPassportIssuedPlace", label: "Issued Place / ထုတ်ပေးသည့်နေရာ" },
        { key: "addressMyanmar", label: "Resident Address in Myanmar / မြန်မာနိုင်ငံရှိလိပ်စာ" },
        { key: "addressSingapore", label: "Resident Address in Singapore / စင်္ကာပူလိပ်စာ" },
        { key: "phoneSingapore", label: "Phone (Singapore) / ဖုန်းနံပါတ်" },
        { key: "emailSingapore", label: "Email / အီးမေးလ်" },
      ],
    ];

    if (workerType === "maid") {
      steps.push([
        { key: "maidAgencySingapore", label: "Maid Agency — Name & Address (Singapore) / အေဂျင်စီ (စင်္ကာပူ)" },
        { key: "maidAgencyMyanmar", label: "Maid Agency — Name & Address (Myanmar) / အေဂျင်စီ (မြန်မာ)" },
      ]);
    }

    return steps;
  }, [workerType]);
}

export default function PassportWizardForm() {
  const t = useTranslations("wizard");
  const { user, isConfigured, isLoading } = useAuth();
  const [draft, setDraft] = useState<PassportDraftData>(EMPTY_PASSPORT_DRAFT);
  const [stepIndex, setStepIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isHydratingDraft, setIsHydratingDraft] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedCloudDraftRef = useRef(false);

  const fieldSteps = useSteps(draft.workerType);
  const totalSteps = fieldSteps.length + 2; // +1 worker-type step, +1 review step
  const isWorkerTypeStep = stepIndex === 0;
  const isReviewStep = stepIndex === totalSteps - 1;
  const currentFields = isWorkerTypeStep || isReviewStep ? [] : fieldSteps[stepIndex - 1];

  const setField = (key: keyof PassportDraftData, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Hydrate draft from cloud
  useEffect(() => {
    if (!isConfigured || isLoading) return;
    if (!user) {
      hasLoadedCloudDraftRef.current = false;
      return;
    }
    if (hasLoadedCloudDraftRef.current) return;

    let isMounted = true;
    queueMicrotask(async () => {
      setIsHydratingDraft(true);
      setLoadError(null);
      const { data, error } = await loadPassportDraft(user.id);
      if (!isMounted) return;
      if (error) {
        setLoadError(error);
      } else if (data) {
        setDraft(data);
      }
      hasLoadedCloudDraftRef.current = true;
      setIsHydratingDraft(false);
    });
    return () => {
      isMounted = false;
    };
  }, [isConfigured, isLoading, user]);

  // Autosave draft (debounced)
  useEffect(() => {
    if (!isConfigured || isLoading || isHydratingDraft || !user) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveError(null);
      setIsSaving(true);
      const { error } = await savePassportDraft(user.id, draft);
      if (error) {
        setSaveError(error);
        setIsSaving(false);
        return;
      }
      setLastSavedAt(new Date().toLocaleTimeString());
      setIsSaving(false);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, isConfigured, isHydratingDraft, isLoading, user]);

  const canGoNext = isWorkerTypeStep
    ? true
    : currentFields.every((f) => !f.required || draft[f.key]?.trim());

  const draftStatus = !isConfigured
    ? t("draftNotConfigured")
    : !user
      ? t("draftLocalOnly")
      : isHydratingDraft
        ? t("draftLoading")
        : loadError
          ? `${t("draftLoadError")}: ${loadError}`
          : saveError
            ? `${t("draftSaveError")}: ${saveError}`
            : isSaving
              ? t("draftSaving")
              : lastSavedAt
                ? `${t("draftSaved")} ${lastSavedAt}`
                : t("draftEmpty");

  return (
    <Card className="space-y-5">
      {/* Progress */}
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-xs text-ink-subtle">
          {t("stepOf", { current: stepIndex + 1, total: totalSteps })}
        </p>
      </div>

      {isWorkerTypeStep ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-ink">{t("workerTypeTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["maid", "general"] as WorkerType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setField("workerType", option)}
                className={[
                  "rounded-xl border-2 p-4 text-left transition",
                  draft.workerType === option
                    ? "border-brand bg-brand-soft"
                    : "border-border bg-surface hover:border-brand-soft-border",
                ].join(" ")}
              >
                <p className="font-semibold text-ink">
                  {option === "maid" ? t("workerTypeMaid") : t("workerTypeGeneral")}
                </p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {option === "maid" ? t("workerTypeMaidHint") : t("workerTypeGeneralHint")}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : isReviewStep ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-ink">{t("reviewTitle")}</h3>
          <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-2">
            {fieldSteps.flat().map((f) => (
              <div key={f.key}>
                <p className="text-xs text-ink-subtle">{f.label}</p>
                <p className="text-sm font-medium text-ink">{draft[f.key] || "-"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-subtle">{draftStatus}</p>

          <div className="space-y-2 rounded-xl border border-brand-soft-border bg-brand-soft p-4">
            <p className="text-sm font-medium text-ink">{t("downloadTitle")}</p>
            <p className="text-xs text-ink-subtle">{t("downloadHint")}</p>
            <a
              href={PASSPORT_FORM_DOWNLOAD_PATHS[draft.workerType]}
              download
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-ink-on-brand shadow-sm transition hover:bg-brand-strong sm:w-auto"
            >
              {t("downloadButton")}
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {currentFields.map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="text-sm font-medium text-ink-muted">
                {f.label}
                {f.required ? <span className="text-danger"> *</span> : null}
              </span>
              {f.type === "select" ? (
                <select
                  className={INPUT_CLASS}
                  value={draft[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                >
                  <option value="">—</option>
                  {f.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "date" ? "date" : "text"}
                  className={INPUT_CLASS}
                  value={draft[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          {t("back")}
        </Button>
        {!isReviewStep ? (
          <Button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(totalSteps - 1, i + 1))}
            disabled={!canGoNext}
          >
            {t("next")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
