import { ProjectState } from '../constants/projectState';

export function mapStateToEnum(stateStr: string | ProjectState): ProjectState {
  const normalizedState = typeof stateStr === 'string' ? stateStr.toLowerCase() : stateStr;

  if (Object.values(ProjectState).includes(normalizedState as ProjectState)) {
    return normalizedState as ProjectState;
  }

  return ProjectState.CREATED;
}
