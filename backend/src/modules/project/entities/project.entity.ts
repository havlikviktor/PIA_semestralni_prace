import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Entity,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Language } from '../../user/entities/translator-language.entity';

export enum ProjectState {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  CLOSED = 'closed',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  ProjectId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User, { nullable: true, cascade: false })
  @JoinColumn({ name: 'translatorId' })
  translator?: User;

  @Column()
  languageCode: Language;

  @Column({ type: 'bytea' })
  originalFile: Buffer;

  @Column({ type: 'bytea', nullable: true })
  translatedFile?: Buffer;

  @Column({ default: ProjectState.CREATED })
  state: ProjectState;

  @CreateDateColumn()
  createdAt: Date;
}
