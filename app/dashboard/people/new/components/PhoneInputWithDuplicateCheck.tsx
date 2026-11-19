"use client";

import { useState, useEffect, useRef } from "react";
import { DuplicatePersonInfo } from "../types";
import { AlertCircle, ExternalLink, UserCheck, Loader2 } from "lucide-react";

interface PhoneInputWithDuplicateCheckProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  onDuplicateAcknowledged: (acknowledged: boolean) => void;
  isDuplicateAcknowledged: boolean;
}

export default function PhoneInputWithDuplicateCheck({
  phone,
  onPhoneChange,
  onDuplicateAcknowledged,
  isDuplicateAcknowledged,
}: PhoneInputWithDuplicateCheckProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicatePersonInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handlePhoneInputChange = (val: string) => {
    onPhoneChange(val);
    if (isDuplicateAcknowledged) {
      onDuplicateAcknowledged(false);
    }
    if (val.trim().length < 5) {
      setDuplicateInfo(null);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const clean = phone.trim();
    if (clean.length < 5) {
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          `/api/people/check-phone?phone=${encodeURIComponent(clean)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.person) {
            setDuplicateInfo(data.person);
          } else {
            setDuplicateInfo(null);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [phone]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs sm:text-sm font-bold text-slate-900">
          Phone number <span className="text-rose-600">*</span>
        </label>
        {isChecking && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
            <span>Checking duplicate...</span>
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => handlePhoneInputChange(e.target.value)}
          placeholder="e.g. 0803 123 4567"
          className="w-full px-4 py-3 rounded-xl text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition shadow-sm font-mono tracking-wide"
        />
      </div>

      {/* Duplicate Alert Card (High Contrast Warm Colors matching mockup) */}
      {duplicateInfo && (
        <div className="p-4 rounded-xl bg-[#fef3c7] border-2 border-[#f59e0b] text-[#78350f] space-y-3 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5 stroke-[2.2]" />
            <div>
              <h4 className="font-bold text-sm text-[#78350f]">
                This number is already on file.
              </h4>
              <p className="text-xs text-[#92400e] font-medium mt-0.5 leading-relaxed">
                <strong className="text-[#78350f] font-bold">{duplicateInfo.fullName}</strong> · {duplicateInfo.hall}
                {duplicateInfo.evangelizedAt && ` · evangelized ${formatDate(duplicateInfo.evangelizedAt)}`}
                {` · assigned to `}<strong className="text-[#78350f] font-bold">{duplicateInfo.assignedToName}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons inside Card */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href={`/dashboard/people?search=${encodeURIComponent(phone.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-[#d97706] text-[#78350f] hover:bg-amber-100 transition active:scale-95 shadow-sm"
            >
              <span>View record</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#b45309]" />
            </a>

            <button
              type="button"
              onClick={() => onDuplicateAcknowledged(!isDuplicateAcknowledged)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition active:scale-95 shadow-sm ${
                isDuplicateAcknowledged
                  ? "bg-[#b45309] text-white ring-2 ring-[#78350f]/20"
                  : "bg-white border border-[#d97706] text-[#78350f] hover:bg-amber-100"
              }`}
            >
              {isDuplicateAcknowledged && <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{isDuplicateAcknowledged ? "Acknowledged" : "Different person"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
