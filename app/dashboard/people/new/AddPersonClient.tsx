"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { PersonResponse, ContactMethod } from "@/lib/status";
import AddPersonHeader from "./components/AddPersonHeader";
import PhoneInputWithDuplicateCheck from "./components/PhoneInputWithDuplicateCheck";
import HallSelect from "./components/HallSelect";
import ResponsePillSelector from "./components/ResponsePillSelector";
import ContactMethodSelector from "./components/ContactMethodSelector";
import SuccessModal from "./components/SuccessModal";
import { UserOption } from "../types";
import { AlertCircle, Loader2, Check } from "lucide-react";

interface AddPersonClientProps {
  userRole: Role;
  userId: string;
  evangelistUsers: UserOption[];
}

export default function AddPersonClient({
  userRole,
  evangelistUsers,
}: AddPersonClientProps) {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [hall, setHall] = useState("");
  const [customHall, setCustomHall] = useState("");
  const [evangelizedAt, setEvangelizedAt] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [response, setResponse] = useState<PersonResponse | "">("");
  const [evangelistId, setEvangelistId] = useState("");

  // Optional Helps Follow-up
  const [preferredContact, setPreferredContact] = useState<ContactMethod | "">("");
  const [currentChurch, setCurrentChurch] = useState("");
  const [roomOrLocation, setRoomOrLocation] = useState("");
  const [level, setLevel] = useState("");
  const [course, setCourse] = useState("");
  const [prayerRequest, setPrayerRequest] = useState("");
  const [handoffNote, setHandoffNote] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  // Status & modal states
  const [isDuplicateAcknowledged, setIsDuplicateAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedPersonName, setSavedPersonName] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const canSelectEvangelist = userRole === "unit_head" || userRole === "executive";

  const handleResetForm = () => {
    setFullName("");
    setPhone("");
    setHall("");
    setCustomHall("");
    setResponse("");
    setPreferredContact("");
    setCurrentChurch("");
    setRoomOrLocation("");
    setLevel("");
    setCourse("");
    setPrayerRequest("");
    setHandoffNote("");
    setConsentConfirmed(true);
    setIsDuplicateAcknowledged(false);
    setErrorMessage(null);
    setIsSuccessModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const resolvedHall = hall === "Other (specify below)" ? customHall.trim() : hall.trim();

    if (!fullName.trim()) {
      setErrorMessage("Please enter the person's full name");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Please enter a valid phone number");
      return;
    }
    if (!resolvedHall) {
      setErrorMessage("Please choose or specify their hall of residence");
      return;
    }
    if (!response) {
      setErrorMessage("Please choose their spiritual response");
      return;
    }
    if (!consentConfirmed) {
      setErrorMessage("Consent to be contacted is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          hall: resolvedHall,
          evangelizedAt: evangelizedAt ? new Date(evangelizedAt).toISOString() : undefined,
          response,
          evangelistId: canSelectEvangelist && evangelistId ? evangelistId : undefined,
          roomOrLocation: roomOrLocation.trim() || undefined,
          level: level.trim() || undefined,
          course: course.trim() || undefined,
          preferredContact: preferredContact || undefined,
          currentChurch: currentChurch.trim() || undefined,
          prayerRequest: prayerRequest.trim() || undefined,
          handoffNote: handoffNote.trim() || undefined,
          consentConfirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save person");
      }

      setSavedPersonName(fullName.trim());
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <AddPersonHeader />

      {/* Main Form Container Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-800 text-xs sm:text-sm animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Full Name */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Full name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Tunde Adeyemi"
              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
            />
          </div>

          {/* Phone Number with Duplicate Checker */}
          <PhoneInputWithDuplicateCheck
            phone={phone}
            onPhoneChange={setPhone}
            onDuplicateAcknowledged={setIsDuplicateAcknowledged}
            isDuplicateAcknowledged={isDuplicateAcknowledged}
          />

          {/* Hall of Residence Dropdown */}
          <HallSelect
            hall={hall}
            onHallChange={setHall}
            customHall={customHall}
            onCustomHallChange={setCustomHall}
          />

          {/* Date Evangelized */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-900">
              Date evangelized <span className="text-rose-600">*</span>
            </label>
            <input
              type="date"
              value={evangelizedAt}
              onChange={(e) => setEvangelizedAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
            />
          </div>

          {/* Evangelist Selector (Leadership Only) */}
          {canSelectEvangelist && evangelistUsers.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                Evangelist (attribution)
              </label>
              <select
                value={evangelistId}
                onChange={(e) => setEvangelistId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition cursor-pointer shadow-sm"
              >
                <option value="">Myself (current user)</option>
                {evangelistUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} ({u.role.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Their Response Pills */}
          <ResponsePillSelector value={response} onChange={setResponse} />

          {/* --- Helps follow-up (optional) Section --- */}
          <div className="pt-6 border-t-2 border-slate-100 space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Helps follow-up (optional)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Additional context to support the follow-up team.
              </p>
            </div>

            {/* Best way to reach them */}
            <ContactMethodSelector
              value={preferredContact}
              onChange={setPreferredContact}
            />

            {/* Already attends a church? */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                Already attends a church?
              </label>
              <input
                type="text"
                value={currentChurch}
                onChange={(e) => setCurrentChurch(e.target.value)}
                placeholder="e.g. Baptist, None, etc."
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
              />
            </div>

            {/* Room / Location */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                Room or location
              </label>
              <input
                type="text"
                value={roomOrLocation}
                onChange={(e) => setRoomOrLocation(e.target.value)}
                placeholder="e.g. Room B12, Block A"
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
              />
            </div>

            {/* Level & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  Level
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="e.g. 100L"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-900">
                  Course of study
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Medicine, Law"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm"
                />
              </div>
            </div>

            {/* Prayer Request */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                Prayer request or need shared
              </label>
              <textarea
                rows={3}
                value={prayerRequest}
                onChange={(e) => setPrayerRequest(e.target.value)}
                placeholder="Any specific prayer points or spiritual questions..."
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm resize-none"
              />
            </div>

            {/* Handoff Note */}
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-900">
                Handoff note for follow-up
              </label>
              <textarea
                rows={3}
                value={handoffNote}
                onChange={(e) => setHandoffNote(e.target.value)}
                placeholder="Private context or notes for the follow-up team member..."
                className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm resize-none"
              />
            </div>
          </div>

          {/* Consent Confirmation */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200 cursor-pointer hover:bg-slate-100/60 transition">
              <div className="relative flex items-center pt-0.5">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    consentConfirmed
                      ? "bg-[#c83226] border-[#c83226] text-white"
                      : "border-slate-400 bg-white"
                  }`}
                >
                  {consentConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div className="text-xs text-slate-800">
                <span className="font-bold text-slate-900">
                  Consent confirmed
                </span>
                <p className="mt-0.5 text-slate-600 font-medium">
                  The person agreed to be contacted for fellowship follow-up.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold bg-[#c83226] text-white hover:bg-[#b02b20] transition active:scale-[0.99] disabled:opacity-50 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving person...</span>
                </>
              ) : (
                <span>Save person</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal Toast */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        personName={savedPersonName || "Person"}
        onAddAnother={handleResetForm}
        onGoToPeople={() => router.push("/dashboard/people")}
      />
    </div>
  );
}
