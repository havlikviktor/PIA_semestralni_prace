import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ProjectService } from './project.service';
import { ProjectRealtimeService } from './project-realtime.service';
import { WsJwtAuthService, WsUser } from '../auth/ws-jwt-auth.service';
import type { ProjectDetailDto } from './dto/project-detail.dto';
import type { ProjectListItemDto } from './dto/project-list-item.dto';
import { ProjectIdDto } from './ws/dto/project-id.dto';
import { UpdateProjectStateWsDto } from './ws/dto/update-project-state.ws.dto';
import { ProjectSocketEvent } from './ws/project.ws-events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'projects',
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ProjectGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ProjectGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly projectService: ProjectService,
    private readonly realtime: ProjectRealtimeService,
    private readonly wsJwtAuth: WsJwtAuthService,
  ) {}

  /**
   * Called once when the gateway is initialized.
   * Binds the Socket.IO server to the realtime broadcaster.
   */
  afterInit(server: Server): void {
    this.realtime.bindServer(server);
    this.logger.log('Projects gateway initialized');
  }

  /**
   * Called when a client connects.
   * Authenticates the socket (JWT) and joins user/role rooms.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.wsJwtAuth.authenticate(client);
      client.data.user = user;
      client.join(`user_${user.sub}`);
      client.join(`role_${user.role}`);
      this.logger.debug(
        `Client connected ${client.id} (user=${user.sub}, role=${user.role})`,
      );
    } catch (e: unknown) {
      client.emit(ProjectSocketEvent.Unauthorized, {
        message: e instanceof Error ? e.message : 'Unauthorized',
      });
      client.disconnect(true);
    }
  }

  /**
   * Called when a client disconnects.
   */
  handleDisconnect(client: Socket): void {
    const user: WsUser | undefined = client.data?.user;
    this.logger.debug(
      `Client disconnected ${client.id}${user ? ` (user=${user.sub})` : ''}`,
    );
  }

  /**
   * Ensures `client.data.user` exists.
   *
   * This guards against a race where the client emits messages immediately
   * after connecting, before the async `handleConnection()` auth finishes.
   *
   * On authentication failure, notifies the client and disconnects.
   */
  private async ensureUser(client: Socket): Promise<WsUser> {
    const existing: WsUser | undefined = client.data?.user;
    if (existing) {
      return existing;
    }

    try {
      const user = await this.wsJwtAuth.authenticate(client);
      client.data.user = user;
      client.join(`user_${user.sub}`);
      client.join(`role_${user.role}`);
      return user;
    } catch (e: unknown) {
      client.emit(ProjectSocketEvent.Unauthorized, {
        message: e instanceof Error ? e.message : 'Unauthorized',
      });
      client.disconnect(true);
      // Throw a WS exception so Nest can handle the error without crashing the process.
      throw new WsException('Unauthorized');
    }
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectSubscribeRequest)
  /**
   * Joins the socket to a `project_<id>` room for realtime detail updates.
   */
  async handleSubscribe(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ): Promise<{ joined: boolean; projectId: number }> {
    await this.ensureUser(client);
    client.join(`project_${body.projectId}`);
    return { joined: true, projectId: body.projectId };
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectUnsubscribeRequest)
  /**
   * Leaves the socket from a `project_<id>` room.
   */
  async handleUnsubscribe(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ): Promise<{ left: boolean; projectId: number }> {
    await this.ensureUser(client);
    client.leave(`project_${body.projectId}`);
    return { left: true, projectId: body.projectId };
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectsListRequest)
  /**
   * Returns the project list visible to the authenticated user.
   */
  async handleList(
    @ConnectedSocket() client: Socket,
  ): Promise<ProjectListItemDto[]> {
    const user = await this.ensureUser(client);
    return this.projectService.findUserProjects(user.sub, user.role);
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectGetRequest)
  /**
   * Returns the project detail for a given projectId (access checked).
   */
  async handleGet(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ): Promise<ProjectDetailDto> {
    const user = await this.ensureUser(client);
    return this.projectService.findProjectDetailForUser(
      body.projectId,
      user.sub,
      user.role,
    );
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectUpdateStateRequest)
  /**
   * Updates a project's state and returns the updated detail DTO.
   */
  async handleUpdateState(
    @MessageBody() body: UpdateProjectStateWsDto,
    @ConnectedSocket() client: Socket,
  ): Promise<ProjectDetailDto> {
    const user = await this.ensureUser(client);
    const domain = await this.projectService.updateState(
      body.projectId,
      user.sub,
      user.role,
      body.state,
    );
    return this.projectService.toDetailDto(domain);
  }
}
