import { useTranslations } from "next-intl";
import { ProjectState } from "@/constants/projectState";
import { mapStateToEnum } from "@/utils/StateMapper";

export function useStateTranslation() {
  const t = useTranslations("ProjectStates");
  return (state: string | ProjectState) => {
    const mappedState = mapStateToEnum(state);
    return t(mappedState);
  };
}
