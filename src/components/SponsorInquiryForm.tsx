"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitSponsorInquiry } from "@/lib/monetization";

/**
 * Validation schema for sponsor inquiry form
 */
const sponsorInquirySchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  organization: z.string().min(2, "Please enter your organization name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  message: z
    .string()
    .min(10, "Please tell us more about your interest (at least 10 characters).")
    .max(1000, "Message is too long (max 1000 characters)."),
});

type SponsorInquiryFormValues = z.infer<typeof sponsorInquirySchema>;

/**
 * SponsorInquiryForm Component
 *
 * A form for businesses and organizations to express interest in
 * sponsoring or advertising on the platform.
 *
 * Features:
 * - Client-side validation with zod
 * - Accessible form fields with proper labels
 * - Success/error state handling
 * - Form reset on successful submission
 */
export default function SponsorInquiryForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SponsorInquiryFormValues>({
    resolver: zodResolver(sponsorInquirySchema),
    defaultValues: {
      name: "",
      organization: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = async (values: SponsorInquiryFormValues) => {
    setStatus("idle");
    setStatusMessage(null);

    const { error } = await submitSponsorInquiry({
      name: values.name,
      organization: values.organization,
      email: values.email,
      phone: values.phone || undefined,
      message: values.message,
    });

    if (error) {
      setStatus("error");
      setStatusMessage(`Submission failed: ${error}`);
      return;
    }

    setStatus("success");
    setStatusMessage(
      "Thank you for your interest! We will contact you within 2-3 business days.",
    );
    reset();
  };

  return (
    <form
      className="space-y-4 rounded-lg border border-border bg-surface p-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-ink">Become a Sponsor</h3>
        <p className="text-sm text-ink-muted">
          Interested in reaching Myanmar migrant workers in Singapore? Fill out the form
          below and our team will get back to you.
        </p>
      </div>

      {/* Name field */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-muted">
          Your Name <span className="text-danger">*</span>
        </span>
        <input
          type="text"
          className="w-full rounded border border-border-strong px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="John Doe"
          {...register("name")}
        />
        {errors.name ? (
          <span className="text-sm text-danger">{errors.name.message}</span>
        ) : null}
      </label>

      {/* Organization field */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-muted">
          Organization / Company <span className="text-danger">*</span>
        </span>
        <input
          type="text"
          className="w-full rounded border border-border-strong px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="ABC Remittance Pte Ltd"
          {...register("organization")}
        />
        {errors.organization ? (
          <span className="text-sm text-danger">{errors.organization.message}</span>
        ) : null}
      </label>

      {/* Email field */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-muted">
          Email Address <span className="text-danger">*</span>
        </span>
        <input
          type="email"
          className="w-full rounded border border-border-strong px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="contact@example.com"
          {...register("email")}
        />
        {errors.email ? (
          <span className="text-sm text-danger">{errors.email.message}</span>
        ) : null}
      </label>

      {/* Phone field (optional) */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-muted">Phone Number (optional)</span>
        <input
          type="tel"
          className="w-full rounded border border-border-strong px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="+65 9123 4567"
          {...register("phone")}
        />
      </label>

      {/* Message field */}
      <label className="block space-y-1">
        <span className="text-sm font-medium text-ink-muted">
          Message <span className="text-danger">*</span>
        </span>
        <textarea
          className="w-full rounded border border-border-strong px-3 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder="Tell us about your organization and what kind of sponsorship you're interested in..."
          {...register("message")}
        />
        {errors.message ? (
          <span className="text-sm text-danger">{errors.message.message}</span>
        ) : null}
      </label>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-brand-soft-border"
      >
        {isSubmitting ? "Submitting..." : "Submit Inquiry"}
      </button>

      {/* Status message */}
      {statusMessage ? (
        <div
          className={`rounded p-3 text-sm ${
            status === "success"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
    </form>
  );
}
