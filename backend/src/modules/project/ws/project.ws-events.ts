import { ProjectState } from '../entities/project.entity';

/**
 * Socket.IO event names used in the `/projects` namespace.
 *
 * Conventions:
 * - `projects:*` are client->server requests.
 * - `projects:*` without `Request` suffix are server->client broadcasts.
 */
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

export interface ProjectListItemDto {
  ProjectId: number;
  languageCode: string;
  state: ProjectState;
  fileName: string;
  createdAt: Date;
  hasTranslatedFile?: boolean;
  feedback?: { text: string; createdAt: Date } | null;
}

export interface ProjectUserDto {
  id: number;
  name: string;
  email: string;
}

export interface ProjectDetailDto extends ProjectListItemDto {
  customer: ProjectUserDto | null;
  translator: ProjectUserDto | null;
}

export interface ProjectStateChangedPayload {
  projectId: number;
  oldState: ProjectState;
  newState: ProjectState;
  listItem: ProjectListItemDto;
}
