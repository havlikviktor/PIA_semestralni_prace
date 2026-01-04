import { useTranslations } from "next-intl";
import { ProjectState } from "@/constants/projectState";
import { ProjectStyleMapper } from "@/utils/ProjectStyleMapper";
import { Role } from "@/constants/role";

interface CustomerActionsProps {
  userRole: Role | undefined;
  projectState: ProjectState;
  onUpdateState: (newState: ProjectState) => void;
}

export default function CustomerActions({
  userRole,
  projectState,
  onUpdateState,
}: CustomerActionsProps) {
  const t = useTranslations("ProjectDetails");

  if (userRole !== Role.CUSTOMER || projectState !== ProjectState.COMPLETED) {
    return null;
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => onUpdateState(ProjectState.APPROVED)}
        className={`px-4 py-2 rounded hover:bg-lime-800 ${ProjectStyleMapper.getStyle(
          ProjectState.COMPLETED
        )}`}
      >
        {t("accept")}
      </button>
      <button
        onClick={() => onUpdateState(ProjectState.REJECTED)}
        className={`text-rose-100 px-4 py-2 rounded hover:bg-rose-800 ${ProjectStyleMapper.getBackgroundStyle(
          ProjectState.REJECTED
        )}`}
      >
        {t("reject")}
      </button>
    </div>
  );
}
