"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PersonItem } from "../types";
import { PERSON_STATUS_CONFIG, PersonStatus } from "@/lib/status";
import { Check, MessageSquare, Phone } from "lucide-react";

interface PeopleCardListProps {
  people: PersonItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  canManageAssignment: boolean;
}

export default function PeopleCardList({
  people,
  selectedIds,
  onToggleSelect,
  canManageAssignment,
}: PeopleCardListProps) {
  const router = useRouter();

  const getWhatsAppUrl = (rawPhone: string) => {
    const clean = rawPhone.replace(/[^\d]/g, "");
    const formatted = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;
    return `https://wa.me/${formatted}`;
  };

  return (
    <div className="md:hidden space-y-3.5">
      {people.map((person) => {
        const isSelected = selectedIds.includes(person._id);
        const statusCfg =
          PERSON_STATUS_CONFIG[person.status as PersonStatus] ||
          PERSON_STATUS_CONFIG.new;

        return (
          <div
            key={person._id}
            onClick={() => router.push(`/dashboard/people/${person._id}`)}
            className={`p-4 rounded-2xl bg-white border transition-all shadow-sm cursor-pointer hover:border-slate-300 active:scale-[0.99] ${
              isSelected
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
                : "border-slate-200"
            }`}
          >
            {/* Header: Checkbox + Name + Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {canManageAssignment && (
                  <label
                    className="relative flex items-center cursor-pointer pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(person._id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </label>
                )}

                <div className="min-w-0">
                  <Link
                    href={`/dashboard/people/${person._id}`}
                    prefetch={false}
                    onClick={(e) => e.stopPropagation()}
                    className="font-bold text-base text-slate-900 hover:text-blue-600 transition truncate block"
                  >
                    {person.fullName}
                  </Link>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {person.hall} · <span className="font-mono">{person.phone}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
              >
                {statusCfg.label}
              </span>
            </div>

            {/* Last contact + check-in highlight */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span
                className={`font-semibold ${
                  person.lastContactDays !== null &&
                  person.lastContactDays !== undefined &&
                  person.lastContactDays >= 7
                    ? "text-[#b91c1c]"
                    : "text-slate-600"
                }`}
              >
                {person.lastContactDays === null || person.lastContactDays === undefined
                  ? "Not contacted yet"
                  : person.lastContactDays === 0
                  ? "Last contact today"
                  : `Last contact ${person.lastContactDays}d ago`}
                {" · "}
                <span className="font-medium text-slate-500">
                  {person.checkInCount} check-in{person.checkInCount === 1 ? "" : "s"}
                </span>
              </span>
            </div>

            {/* Action Buttons: WhatsApp & Call (Matching Mockup 1) */}
            <div
              className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={getWhatsAppUrl(person.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#166534] transition active:scale-[0.98] shadow-sm"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${person.phone}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-50 transition active:scale-[0.98] shadow-sm"
              >
                <Phone className="w-4 h-4 text-slate-600" />
                <span>Call</span>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
