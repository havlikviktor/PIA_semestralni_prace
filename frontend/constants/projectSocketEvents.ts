export enum ProjectSocketEvent {
  ProjectsListRequest = 'projects:list',
  ProjectGetRequest = 'projects:get',
  ProjectSubscribeRequest = 'projects:subscribe',
  ProjectUnsubscribeRequest = 'projects:unsubscribe',
  ProjectUpdateStateRequest = 'projects:updateState',

  ProjectListItemCreated = 'projects:listItemCreated',
  ProjectListItemUpdated = 'projects:listItemUpdated',
  ProjectStateChanged = 'projects:stateChanged',
  ProjectDetailUpdated = 'projects:detailUpdated',

  Unauthorized = 'projects:unauthorized',
  Error = 'projects:error',
}

export type ProjectListItem = {
  ProjectId: number;
  languageCode: string;
  state: string;
  fileName: string;
  createdAt: string;
  hasTranslatedFile?: boolean;
  feedback?: { text: string; createdAt: string } | null;
};

export type ProjectDetail = ProjectListItem & {
  customer: { id: number; name: string; email: string } | null;
  translator: { id: number; name: string; email: string } | null;
};

export type ProjectStateChangedPayload = {
  projectId: number;
  oldState: string;
  newState: string;
  listItem: ProjectListItem;
};
