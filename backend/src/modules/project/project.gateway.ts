import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ProjectService } from './project.service';
import { ProjectRealtimeService } from './project-realtime.service';
import { WsJwtAuthService, WsUser } from '../auth/ws-jwt-auth.service';
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

  afterInit(server: Server): void {
    this.realtime.bindServer(server);
    this.logger.log('Projects gateway initialized');
  }

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

  handleDisconnect(client: Socket): void {
    const user: WsUser | undefined = client.data?.user;
    this.logger.debug(
      `Client disconnected ${client.id}${user ? ` (user=${user.sub})` : ''}`,
    );
  }

  private async ensureUser(client: Socket): Promise<WsUser> {
    const existing: WsUser | undefined = client.data?.user;
    if (existing) {
      return existing;
    }

    // Guard against a race: the client can emit messages right after connect,
    // before handleConnection finishes its async JWT verification.
    const user = await this.wsJwtAuth.authenticate(client);
    client.data.user = user;
    client.join(`user_${user.sub}`);
    client.join(`role_${user.role}`);
    return user;
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectSubscribeRequest)
  async handleSubscribe(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.ensureUser(client);
    client.join(`project_${body.projectId}`);
    return { joined: true, projectId: body.projectId };
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectUnsubscribeRequest)
  async handleUnsubscribe(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    await this.ensureUser(client);
    client.leave(`project_${body.projectId}`);
    return { left: true, projectId: body.projectId };
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectsListRequest)
  async handleList(@ConnectedSocket() client: Socket) {
    const user = await this.ensureUser(client);
    return this.projectService.findUserProjects(user.sub, user.role);
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectGetRequest)
  async handleGet(
    @MessageBody() body: ProjectIdDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.ensureUser(client);
    return this.projectService.findProjectDetailForUser(
      body.projectId,
      user.sub,
      user.role,
    );
  }

  @SubscribeMessage(ProjectSocketEvent.ProjectUpdateStateRequest)
  async handleUpdateState(
    @MessageBody() body: UpdateProjectStateWsDto,
    @ConnectedSocket() client: Socket,
  ) {
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
