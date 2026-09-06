"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { submitManualPayment, uploadPaymentReceipt } from "@/lib/payments";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage, { type StatusVariant } from "@/components/ui/StatusMessage";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const paymentSchema = z.object({
  method: z.enum(["kpay", "wavepay"]),
  amount: z.number().positive("Amount must be greater than 0. / ပမာဏ သုည ထက် ကြီးရမည်။"),
  currency: z.enum(["SGD", "USD"]),
  purpose: z.string().min(3, "Enter a payment purpose. / ငွေပေးချေမှု ရည်ရွယ်ချက် ထည့်ပါ။"),
  transactionReference: z
    .string()
    .min(4, "Enter your transaction reference. / ငွေလွှဲကုဒ် ထည့်ပါ။"),
  receiptPath: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().url().safeParse(value).success,
      "Enter a valid URL. / မှန်ကန်သော link ထည့်ပါ။",
    ),
  note: z.string().max(300, "Note must be 300 characters or fewer. / မှတ်ချက် ၃၀၀ လုံးသာ ခွင့်ပြုသည်။").optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "done"; path: string }
  | { phase: "error"; message: string };

type SubmitState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uploadVariant(state: UploadState): StatusVariant {
  if (state.phase === "done") return "success";
  if (state.phase === "error") return "error";
  if (state.phase === "uploading") return "loading";
  return "info";
}

function submitVariant(state: SubmitState): StatusVariant {
  if (state.phase === "success") return "success";
  if (state.phase === "error") return "error";
  if (state.phase === "submitting") return "loading";
  return "info";
}

// Shared section header for visual grouping
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
      {children}
    </h4>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ManualPaymentForm() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [uploadState, setUploadState] = useState<UploadState>({ phase: "idle" });
  const [submitState, setSubmitState] = useState<SubmitState>({ phase: "idle" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: "kpay",
      amount: 2,
      currency: "SGD",
      purpose: "passport_renewal_pdf_export",
      transactionReference: "",
      receiptPath: "",
      note: "",
    },
  });

  // ── Receipt upload ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!user || !selectedFile) {
      setUploadState({
        phase: "error",
        message: "Please log in and choose a file first. / အကောင့်ဝင်ပြီး ဖိုင်ရွေးပါ။",
      });
      return;
    }

    setUploadState({ phase: "uploading" });

    const { path, error } = await uploadPaymentReceipt(user.id, selectedFile);
    if (error ?? !path) {
      setUploadState({
        phase: "error",
        message: `Upload failed: ${error ?? "Unknown error"} / တင်ခြင်း မအောင်မြင်ပါ။`,
      });
      return;
    }

    setUploadState({ phase: "done", path });
  };

  // ── Form submit ───────────────────────────────────────────────────────────

  const onSubmit = async (values: PaymentFormValues) => {
    if (!user) {
      setSubmitState({
        phase: "error",
        message: "You must be logged in to submit a payment. / ငွေပေးချေမှု တင်ရန် အကောင့်ဝင်ပါ။",
      });
      return;
    }

    const uploadedPath = uploadState.phase === "done" ? uploadState.path : null;
    const finalReceiptPath = uploadedPath ?? values.receiptPath.trim();

    if (!finalReceiptPath) {
      setSubmitState({
        phase: "error",
        message:
          "Upload a receipt file or enter a receipt link. / ဘောင်ချာ ဖိုင် တင်ပါ (သို့) link ထည့်ပါ။",
      });
      return;
    }

    setSubmitState({ phase: "submitting" });

    const { error } = await submitManualPayment({
      userId: user.id,
      method: values.method,
      amount: values.amount,
      currency: values.currency,
      purpose: values.purpose,
      transactionReference: values.transactionReference,
      receiptPath: finalReceiptPath,
      note: values.note ?? "",
    });

    if (error) {
      setSubmitState({ phase: "error", message: `Submission failed: ${error}` });
      return;
    }

    setSubmitState({ phase: "success" });
    setToastMessage("Payment submitted successfully. Redirecting to history… / အောင်မြင်စွာ တင်ပြီး၊ မှတ်တမ်းသို့ ပြန်လည်ပို့နေသည်…");
    reset({ ...values, transactionReference: "", receiptPath: "", note: "" });
    setSelectedFile(null);
    setUploadState({ phase: "idle" });
    setTimeout(() => {
      router.push(`${pathname}#payment-history`);
    }, 1000);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form className="space-y-5 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {toastMessage ? (
        <StatusMessage variant="success">
          {toastMessage}
        </StatusMessage>
      ) : null}

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-ink">
          Manual Payment / လက်ငင်းငွေပေးချေမှု
        </h3>
        <p className="mt-0.5 text-xs text-ink-subtle">
          Submit your KBZPay or WavePay transfer details for admin review.
          {/* မြန်မာ: KBZPay သို့မဟုတ် WavePay ငွေလွှဲမှတ်တမ်းကို admin စစ်ဆေးရန် တင်ပါ။ */}
        </p>
      </div>

      {/* ── Section 1: Payment Details ──────────────────────────────────── */}
      <fieldset className="space-y-3">
        <SectionHeading>1 · Payment Details / ငွေပေးချေမှု အချက်အလက်</SectionHeading>

        {/* Method + Currency row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Method / နည်းလမ်း">
            <select className={INPUT_CLASS} {...register("method")}>
              <option value="kpay">KBZPay</option>
              <option value="wavepay">WavePay</option>
            </select>
          </FormField>

          <FormField label="Currency / ငွေကြေး">
            <select className={INPUT_CLASS} {...register("currency")}>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
            </select>
          </FormField>
        </div>

        {/* Amount */}
        <FormField
          label="Amount / ပမာဏ"
          error={errors.amount?.message}
          hint="Enter the exact transferred amount."
        >
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            className={INPUT_CLASS}
            {...register("amount", { valueAsNumber: true })}
          />
        </FormField>

        {/* Purpose */}
        <FormField
          label="Purpose / ရည်ရွယ်ချက်"
          error={errors.purpose?.message}
          hint="e.g. passport_renewal_pdf_export"
        >
          <input className={INPUT_CLASS} {...register("purpose")} />
        </FormField>

        {/* Transaction Reference */}
        <FormField
          label="Transaction Reference / ငွေလွှဲ ကုဒ်"
          error={errors.transactionReference?.message}
          hint="Copy the reference number shown in your payment app."
        >
          <input
            className={INPUT_CLASS}
            placeholder="e.g. TXN-20260905-001"
            {...register("transactionReference")}
          />
        </FormField>
      </fieldset>

      {/* ── Section 2: Receipt ──────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <SectionHeading>2 · Receipt / ဘောင်ချာ</SectionHeading>

        {/* File upload */}
        <FormField
          label="Upload screenshot or PDF / ဓာတ်ပုံ သို့ PDF တင်ရန်"
          hint="JPEG, PNG, or PDF · max 10 MB"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/*,application/pdf"
              aria-label="Select receipt file"
              className="w-full flex-1 text-sm text-ink-muted file:mr-2 file:rounded file:border file:border-border-strong file:bg-surface file:px-3 file:py-1 file:text-xs file:font-medium file:text-ink-muted"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                // Reset prior upload state when a new file is chosen
                setUploadState({ phase: "idle" });
              }}
            />
            <button
              type="button"
              disabled={!selectedFile || uploadState.phase === "uploading" || !user}
              onClick={() => void handleUpload()}
              className={[
                "shrink-0 rounded border px-3 py-2 text-xs font-medium transition-colors",
                !selectedFile || uploadState.phase === "uploading" || !user
                  ? "cursor-not-allowed border-border bg-surface-muted text-ink-subtle"
                  : "border-border-strong bg-surface text-ink-muted hover:bg-surface-muted active:bg-surface-muted",
              ].join(" ")}
            >
              {uploadState.phase === "uploading" ? "Uploading…" : "Upload / တင်ရန်"}
            </button>
          </div>
        </FormField>

        {/* Upload status feedback */}
        {uploadState.phase !== "idle" ? (
          <StatusMessage variant={uploadVariant(uploadState)}>
            {uploadState.phase === "uploading" && "Uploading receipt… / ဘောင်ချာ တင်နေသည်…"}
            {uploadState.phase === "done" && (
              <>
                Receipt uploaded. / ဘောင်ချာ တင်ပြီးပြီ။{" "}
                <span className="block text-xs opacity-70 break-all">
                  {uploadState.path}
                </span>
              </>
            )}
            {uploadState.phase === "error" && uploadState.message}
          </StatusMessage>
        ) : null}

        {/* Fallback receipt URL */}
        <FormField
          label={
            <>
              Receipt link{" "}
              <span className="font-normal text-ink-subtle">
                (optional / ချန်ထားနိုင်) / ဘောင်ချာ link
              </span>
            </>
          }
          error={errors.receiptPath?.message}
          hint="Use this only if you cannot upload a file."
        >
          <input
            className={INPUT_CLASS}
            placeholder="https://…"
            {...register("receiptPath")}
          />
        </FormField>
      </fieldset>

      {/* ── Section 3: Additional ───────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <SectionHeading>3 · Additional / အပိုသတင်းအချက်အလက်</SectionHeading>

        <FormField
          label={
            <>
              Note{" "}
              <span className="font-normal text-ink-subtle">(optional / ချန်ထားနိုင်) / မှတ်ချက်</span>
            </>
          }
          error={errors.note?.message}
          hint="Max 300 characters / ၃၀၀ လုံးထက် မပိုရ"
        >
          <textarea
            className={INPUT_CLASS}
            rows={3}
            placeholder="Any extra details for the admin…"
            {...register("note")}
          />
        </FormField>
      </fieldset>

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-1">
        <StatusMessage variant="info" className="text-xs">
          After submitting, an admin will review your payment within 1–2 business days.
          {/* မြန်မာ: တင်ပြီးနောက် admin မှ လုပ်ငန်းရက် ၁–၂ ရက်အတွင်း စစ်ဆေးပေးမည်။ */}
        </StatusMessage>

        <div className="sticky bottom-3 rounded-lg border border-border bg-surface p-2 shadow md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "w-full rounded py-2.5 px-4 text-sm font-semibold text-white transition-colors",
              isSubmitting
                ? "cursor-not-allowed bg-brand-soft-border"
                : "bg-brand hover:bg-brand-strong",
            ].join(" ")}
          >
            {isSubmitting
              ? "Submitting… / တင်နေသည်…"
              : "Submit Payment / ငွေပေးချေမှု တင်ရန်"}
          </button>
        </div>

        {/* Submission result */}
        {submitState.phase !== "idle" && submitState.phase !== "submitting" ? (
          <StatusMessage variant={submitVariant(submitState)}>
            {submitState.phase === "success" &&
              "Payment submitted! Waiting for admin approval. / ငွေပေးချေမှု တင်ပြီးပြီ။ Admin စစ်ဆေးဆဲ ဖြစ်သည်။"}
            {submitState.phase === "error" && submitState.message}
          </StatusMessage>
        ) : null}
      </div>
    </form>
  );
}
