import { useTranslations } from "next-intl";
import { ProjectState } from "../constants/projectState";

export function mapStateToEnum(stateStr: string): ProjectState {
  const normalizedState = stateStr.toLowerCase();
  
  if (Object.values(ProjectState).includes(normalizedState as ProjectState)) {
    return normalizedState as ProjectState;
  }
  
  return ProjectState.CREATED;
}

interface StateMapperProps {
  state: string | ProjectState;
}

export default function StateMapper({ state }: StateMapperProps) {
  const t = useTranslations("ProjectStates");
  const mappedState = mapStateToEnum(state);

  return <>{t(mappedState)}</>;
}
