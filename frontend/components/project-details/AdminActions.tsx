import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProjectState } from "@/constants/projectState";
import { Role } from "@/constants/role";
import { useStateTranslation } from "@/hooks/useStateTranslation";
import { ProjectStyleMapper } from "@/utils/ProjectStyleMapper";

interface AdminActionsProps {
  userRole: Role | undefined;
  projectState: ProjectState;
  onUpdateState: (newState: ProjectState) => void;
}

export default function AdminActions({
  userRole,
  projectState,
  onUpdateState,
}: AdminActionsProps) {
  const t = useTranslations("ProjectDetails");
  const translateState = useStateTranslation();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [newState, setNewState] = useState<ProjectState | null>(null);

  if (userRole !== Role.ADMINISTRATOR) {
    return null;
  }

  const allStates = Object.values(ProjectState);

  const handleStateChange = (state: ProjectState) => {
    if (!state) return;
    if (state === projectState) return;
    onUpdateState(state);
    setShowMoreOptions(false);
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">{t("adminActions")}</h2>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${
              newState
                ? ProjectStyleMapper.getStyle(newState)
                : "border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {newState ? translateState(newState) : (projectState === ProjectState.APPROVED || projectState === ProjectState.REJECTED) ? t("moreOptions") : t("changeState")}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform ${
                showMoreOptions ? "rotate-180" : ""
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {showMoreOptions && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1 max-h-64 overflow-y-auto">
              {allStates.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setNewState(state);
                    setShowMoreOptions(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                    state === projectState ? "bg-blue-50 text-blue-600" : ""
                  }`}
                  disabled={state === newState}
                >
                  <span>{translateState(state)}</span>
                  {state === newState && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
              <button
                  onClick={() => {
                    setNewState(null);
                    setShowMoreOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-rose-600 font-medium border-b border-gray-100"
                >
                  {t("none")}
                </button>
              </div>
          )}
        </div>
        {(projectState === ProjectState.APPROVED ||
          projectState === ProjectState.REJECTED ||
          newState) && (
          <button
            onClick={() => handleStateChange(newState ?? ProjectState.CLOSED)}
            className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700
            font-medium transition-colors"
            id="SubmitButton"
          >
            {newState ? t("changeState") : t("closeProject")}
          </button>
        )}
      </div>
    </div>
  );
}
