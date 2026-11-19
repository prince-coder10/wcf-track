"use client";

import Link from "next/link";
import { PersonItem } from "../types";
import { PERSON_STATUS_CONFIG, PersonStatus } from "@/lib/status";
import { Check } from "lucide-react";

interface PeopleTableProps {
  people: PersonItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  canManageAssignment: boolean;
}

export default function PeopleTable({
  people,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  canManageAssignment,
}: PeopleTableProps) {
  const isAllSelected =
    people.length > 0 && people.every((p) => selectedIds.includes(p._id));
  const isSomeSelected =
    people.some((p) => selectedIds.includes(p._id)) && !isAllSelected;

  return (
    <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {canManageAssignment && (
                <th scope="col" className="w-12 pl-4 pr-2 py-3.5">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={onToggleSelectAll}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isAllSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isSomeSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {(isAllSelected || isSomeSelected) && (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                  </label>
                </th>
              )}
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                Name
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                Hall
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                Evangelist
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                Assigned to
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 text-center">
                Check-ins
              </th>
              <th scope="col" className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200 text-right">
                Last contact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {people.map((person) => {
              const isSelected = selectedIds.includes(person._id);
              const statusCfg =
                PERSON_STATUS_CONFIG[person.status as PersonStatus] ||
                PERSON_STATUS_CONFIG.new;

              const isUnassigned = !person.assignedTo;

              return (
                <tr
                  key={person._id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  {canManageAssignment && (
                    <td className="w-12 pl-4 pr-2 py-4">
                      <label className="relative flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(person._id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </label>
                    </td>
                  )}

                  {/* Name + Details */}
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/people/${person._id}`}
                      prefetch={false}
                      className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition block"
                    >
                      {person.fullName}
                    </Link>
                    <div className="text-xs text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                      {person.phone}
                    </div>
                  </td>

                  {/* Hall */}
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {person.hall}
                  </td>

                  {/* Evangelist */}
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {person.evangelist?.fullName || "—"}
                  </td>

                  {/* Assigned to */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isUnassigned ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                        Unassigned
                      </span>
                    ) : (
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {person.assignedTo?.fullName}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Check-ins */}
                  <td className="px-4 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                    {person.checkInCount}
                  </td>

                  {/* Last Contact */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {person.lastContactDays === null || person.lastContactDays === undefined ? (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">
                        Not yet
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-semibold ${
                          person.lastContactDays >= 7
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {person.lastContactDays === 0
                          ? "Today"
                          : `${person.lastContactDays} ${
                              person.lastContactDays === 1 ? "day" : "days"
                            }`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
