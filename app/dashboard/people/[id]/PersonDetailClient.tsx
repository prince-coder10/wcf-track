"use client";

import Link from "next/link";
import { PersonDetailData, CheckInItem, ActivityHistoryItem } from "./types";
import { Role } from "@/lib/permissions";
import { PERSON_STATUS_CONFIG, PersonStatus } from "@/lib/status";
import {
  ChevronLeft,
  MessageSquare,
  Phone,
  Share2,
} from "lucide-react";

interface PersonDetailClientProps {
  person: PersonDetailData;
  checkIns: CheckInItem[];
  activityLogs?: ActivityHistoryItem[];
  canLogCheckIn: boolean;
  canReassign: boolean;
  userRole: Role;
}

export default function PersonDetailClient({
  person,
  checkIns,
  activityLogs = [],
  canLogCheckIn,
  canReassign,
  userRole,
}: PersonDetailClientProps) {
  const currentPerson = person;
  const statusCfg =
    PERSON_STATUS_CONFIG[currentPerson.status as PersonStatus] ||
    PERSON_STATUS_CONFIG.new;

  const getWhatsAppUrl = (rawPhone: string) => {
    const clean = rawPhone.replace(/[^\d]/g, "");
    const formatted = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;
    return `https://wa.me/${formatted}`;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/people"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-300 shadow-sm"
          title="Back to people list"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5 text-slate-800 stroke-[2.5]" />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Person
        </h1>
      </div>

      {/* 1. Header Profile Card (Mockup 2) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {currentPerson.fullName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {currentPerson.hall} · <span className="font-mono">{currentPerson.phone}</span>
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {currentPerson.checkInCount} check-in{currentPerson.checkInCount === 1 ? "" : "s"}
              {" · "}
              {currentPerson.lastContactDays === null || currentPerson.lastContactDays === undefined
                ? "not contacted yet"
                : currentPerson.lastContactDays === 0
                ? "last contact today"
                : `last contact ${currentPerson.lastContactDays} days ago`}
            </p>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Action Buttons: Message on WhatsApp, Call, Log Check-in */}
        <div className="space-y-2.5 pt-2">
          <a
            href={getWhatsAppUrl(currentPerson.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm sm:text-base font-bold bg-[#15803d] text-white hover:bg-[#166534] transition active:scale-[0.98] shadow-sm"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Message on WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${currentPerson.phone}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-50 transition active:scale-[0.98] shadow-sm"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span>Call</span>
            </a>

            {canLogCheckIn ? (
              <Link
                href={`/dashboard/people/${currentPerson._id}/check-in`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-bold bg-[#c83226] hover:bg-[#b02b20] text-white transition active:scale-[0.98] shadow-sm"
              >
                <span>Log check-in</span>
              </Link>
            ) : (
              <div className="inline-flex items-center justify-center px-4 py-3 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-400">
                <span>Not assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. From the Evangelist Card (Mockup 2) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          From the evangelist
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Evangelized {formatDate(currentPerson.evangelizedAt)} by{" "}
          <strong className="text-slate-900 font-semibold">
            {currentPerson.evangelist?.fullName || "Team Member"}
          </strong>{" "}
          · Response:{" "}
          <span className="capitalize font-semibold text-slate-800">
            {currentPerson.response.replace("_", " ")}
          </span>
        </p>

        {currentPerson.prayerRequest && (
          <div className="text-xs sm:text-sm text-slate-700">
            <strong className="font-bold text-slate-900">Prayer need: </strong>
            <span>{currentPerson.prayerRequest}</span>
          </div>
        )}

        {currentPerson.handoffNote && (
          <div className="text-xs sm:text-sm text-slate-700">
            <strong className="font-bold text-slate-900">Handoff note: </strong>
            <span>{currentPerson.handoffNote}</span>
          </div>
        )}
      </div>

      {/* 3. Assignment Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium">Assigned to</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            {currentPerson.assignedTo?.fullName || "Unassigned"}
          </p>
        </div>

        {canReassign && (
          <Link
            href="/dashboard/people"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-50 transition active:scale-95 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Reassign</span>
          </Link>
        )}
      </div>

      {/* 4. Check-in History Timeline (Mockup 2) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Check-in history
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {checkIns.map((item) => (
            <div key={item._id} className="relative space-y-1">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-white" />

              <div className="text-xs text-slate-500 font-medium">
                {formatDate(item.createdAt)} · <span className="capitalize">{item.method}</span>
                {item.userName && (
                  <span className="text-slate-500 font-normal"> · Followed up by <strong className="font-semibold text-slate-700">{item.userName}</strong></span>
                )}
              </div>

              <div className="text-sm font-bold text-slate-900">
                {item.reached ? (
                  item.outcome ? item.outcome.replace(/_/g, " ") : "Reached"
                ) : (
                  <span className="text-rose-600">No answer ({item.outcome?.replace(/_/g, " ") || "attempted"})</span>
                )}
                {item.customOutcome && ` - ${item.customOutcome}`}
              </div>

              {item.notes && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  {item.notes}
                </p>
              )}
            </div>
          ))}

          {/* Initial handover item */}
          <div className="relative space-y-1">
            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
            <div className="text-xs text-slate-500 font-medium">
              {formatDate(currentPerson.evangelizedAt || currentPerson.createdAt)} · Handed over
            </div>
            <div className="text-sm font-bold text-slate-900">
              Evangelist to follow-up
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Recorded by {currentPerson.evangelist?.fullName || "Evangelist"}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Record Activity Card (Only visible to unit_head, strictly secluded from follow_up) */}
      {userRole === "unit_head" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-2.5 text-xs text-slate-600">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Record activity
          </h3>

          {activityLogs.length > 0 ? (
            activityLogs.map((log, idx) => (
              <p key={idx} className="font-medium text-slate-700">
                {log.action === "viewed" ? (
                  <>
                    Viewed by <strong className="text-slate-900">{log.userName}</strong> · {formatDate(log.createdAt)}
                  </>
                ) : log.action === "reassigned" ? (
                  <>
                    Reassigned ({log.details}) by <strong className="text-slate-900">{log.userName}</strong> · {formatDate(log.createdAt)}
                  </>
                ) : log.action === "created" ? (
                  <>
                    Created by <strong className="text-slate-900">{log.userName}</strong> · {formatDate(log.createdAt)}
                  </>
                ) : (
                  <>
                    <span className="capitalize font-semibold text-slate-900">{log.action.replace(/_/g, " ")}</span> by {log.userName} · {log.details} · {formatDate(log.createdAt)}
                  </>
                )}
              </p>
            ))
          ) : (
            <>
              {currentPerson.assignmentHistory?.map((h, i) => (
                <p key={i} className="font-medium text-slate-700">
                  Assigned to <strong className="text-slate-900">{h.toName}</strong> by {h.byName} · {formatDate(h.at)}
                </p>
              ))}
              <p className="font-medium text-slate-700">
                Created by <strong className="text-slate-900">{currentPerson.createdBy || "Evangelist"}</strong> · {formatDate(currentPerson.createdAt)}
              </p>
            </>
          )}

          <div className="pt-2 text-[11px] text-slate-400 italic border-t border-slate-100">
            Immutable audit logs · Unit head view
          </div>
        </div>
      )}
    </div>
  );
}
