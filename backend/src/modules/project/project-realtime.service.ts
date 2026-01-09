import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { Role } from '../user/entities/user.entity';
import {
  ProjectDetailDto,
  ProjectListItemDto,
  ProjectSocketEvent,
  ProjectStateChangedPayload,
} from './ws/project.ws-events';

@Injectable()
export class ProjectRealtimeService {
  private readonly logger = new Logger(ProjectRealtimeService.name);
  private server: Server | null = null;

  /**
   * Binds the Socket.IO server instance used for emitting realtime events.
   */
  bindServer(server: Server): void {
    this.server = server;
    this.logger.log('Project realtime server bound');
  }

  private emitToUserIds(
    userIds: Array<number | undefined | null>,
    event: string,
    payload: unknown,
  ): void {
    if (!this.server) return;

    const uniqueIds = [
      ...new Set(userIds.filter((id): id is number => typeof id === 'number')),
    ];
    for (const userId of uniqueIds) {
      this.server.to(`user_${userId}`).emit(event, payload);
    }
  }

  /**
   * Emits an event to all users in the given role room.
   */
  private emitToRole(role: Role, event: string, payload: unknown): void {
    if (!this.server) return;
    this.server.to(`role_${role}`).emit(event, payload);
  }

  /**
   * Emits a "project created" event to relevant users and the project room.
   */
  emitProjectCreated(params: {
    listItem: ProjectListItemDto;
    detail: ProjectDetailDto;
    customerId: number;
    translatorId?: number | null;
  }): void {
    if (!this.server) return;

    this.emitToUserIds(
      [params.customerId, params.translatorId],
      ProjectSocketEvent.ProjectListItemCreated,
      params.listItem,
    );
    this.emitToRole(
      Role.ADMINISTRATOR,
      ProjectSocketEvent.ProjectListItemCreated,
      params.listItem,
    );
    this.server
      .to(`project_${params.detail.ProjectId}`)
      .emit(ProjectSocketEvent.ProjectDetailUpdated, params.detail);
  }

  /**
   * Emits a "project updated" event to relevant users and the project room.
   */
  emitProjectUpdated(params: {
    listItem: ProjectListItemDto;
    detail: ProjectDetailDto;
    customerId: number;
    translatorId?: number | null;
  }): void {
    if (!this.server) return;

    this.emitToUserIds(
      [params.customerId, params.translatorId],
      ProjectSocketEvent.ProjectListItemUpdated,
      params.listItem,
    );
    this.emitToRole(
      Role.ADMINISTRATOR,
      ProjectSocketEvent.ProjectListItemUpdated,
      params.listItem,
    );
    this.server
      .to(`project_${params.detail.ProjectId}`)
      .emit(ProjectSocketEvent.ProjectDetailUpdated, params.detail);
  }

  /**
   * Emits a "project state changed" event to relevant users and the project room.
   */
  emitProjectStateChanged(params: {
    payload: ProjectStateChangedPayload;
    detail: ProjectDetailDto;
    customerId: number;
    translatorId?: number | null;
  }): void {
    if (!this.server) return;

    this.emitToUserIds(
      [params.customerId, params.translatorId],
      ProjectSocketEvent.ProjectStateChanged,
      params.payload,
    );
    this.emitToRole(
      Role.ADMINISTRATOR,
      ProjectSocketEvent.ProjectStateChanged,
      params.payload,
    );
    this.server
      .to(`project_${params.detail.ProjectId}`)
      .emit(ProjectSocketEvent.ProjectDetailUpdated, params.detail);
  }
}
