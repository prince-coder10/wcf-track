"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckInMethod, PersonStatus, PERSON_STATUS_CONFIG, PERSON_STATUSES } from "@/lib/status";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";

interface LogCheckInClientProps {
  person: {
    _id: string;
    fullName: string;
    hall: string;
    phone: string;
    status: PersonStatus;
    checkInCount: number;
  };
}

const METHODS: { id: CheckInMethod; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Call" },
  { id: "visit", label: "Visit" },
];

const REACHED_OPTIONS = [
  { id: "responded_warmly", label: "Responded warmly" },
  { id: "contact_later", label: "Contact me later" },
  { id: "attended_service", label: "Attended service" },
  { id: "not_interested", label: "Not interested now" },
  { id: "other", label: "None applies (specify)" },
];

const NO_ANSWER_OPTIONS = [
  { id: "switched_off", label: "Switched off" },
  { id: "ringing_no_answer", label: "Ringing no answer" },
  { id: "line_busy", label: "Line busy" },
  { id: "wrong_number", label: "Wrong number" },
  { id: "other", label: "None applies (specify)" },
];

export default function LogCheckInClient({ person }: LogCheckInClientProps) {
  const router = useRouter();

  const [method, setMethod] = useState<CheckInMethod>("whatsapp");
  const [reached, setReached] = useState<boolean>(true);
  const [outcome, setOutcome] = useState<string>("responded_warmly");
  const [customOutcome, setCustomOutcome] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState<string>(() => {
    // Default to +7 days from now
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [newStatus, setNewStatus] = useState<PersonStatus>(person.status);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentOutcomeOptions = reached ? REACHED_OPTIONS : NO_ANSWER_OPTIONS;
  const isCustomOutcome = outcome === "other";

  const handleReachedToggle = (val: boolean) => {
    setReached(val);
    // Switch to first default outcome of the new state
    setOutcome(val ? "responded_warmly" : "switched_off");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isCustomOutcome && !customOutcome.trim()) {
      setErrorMessage("Please specify the custom outcome.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/people/${person._id}/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          reached,
          outcome,
          customOutcome: isCustomOutcome ? customOutcome.trim() : undefined,
          notes: notes.trim() || undefined,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
          newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save check-in");
      }

      router.push(`/dashboard/people/${person._id}`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/people/${person._id}`}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-300 shadow-sm"
          title="Back to person"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5 text-slate-800 stroke-[2.5]" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Log check-in
        </h1>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* Context badge: Name, Hall, Check-in number */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            {person.fullName}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {person.hall} · check-in {person.checkInCount + 1}
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* How did you reach out? */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              How did you reach out?
            </label>
            <div className="flex flex-wrap gap-2.5">
              {METHODS.map((m) => {
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                        : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Did you reach them? */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Did you reach them?
            </label>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => handleReachedToggle(true)}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                  reached
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleReachedToggle(false)}
                className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                  !reached
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                No answer
              </button>
            </div>
          </div>

          {/* Outcome Pills */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Outcome
            </label>
            <div className="flex flex-wrap gap-2">
              {currentOutcomeOptions.map((opt) => {
                const isSelected = outcome === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOutcome(opt.id)}
                    className={`px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom outcome input when 'None applies (specify)' is selected */}
            {isCustomOutcome && (
              <div className="pt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customOutcome}
                  onChange={(e) => setCustomOutcome(e.target.value)}
                  placeholder="Please specify outcome..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Note
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was discussed or observed during this check-in..."
              className="w-full px-4 py-3 rounded-2xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm resize-none"
            />
          </div>

          {/* Next follow-up date */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Next follow-up date
            </label>
            <input
              type="date"
              value={nextFollowUpAt}
              onChange={(e) => setNextFollowUpAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
            />
          </div>

          {/* Update status */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Update status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as PersonStatus)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition cursor-pointer shadow-sm capitalize"
            >
              <option value={person.status}>
                Keep as {PERSON_STATUS_CONFIG[person.status]?.label || person.status}
              </option>
              {PERSON_STATUSES.filter((s) => s !== person.status).map((s) => (
                <option key={s} value={s} className="capitalize">
                  Change to {PERSON_STATUS_CONFIG[s]?.label || s}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold bg-[#c83226] text-white hover:bg-[#b02b20] transition active:scale-[0.99] disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving check-in...</span>
                </>
              ) : (
                <span>Save check-in</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
