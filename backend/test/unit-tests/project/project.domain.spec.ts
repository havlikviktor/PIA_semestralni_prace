import { UserDomain } from 'src/domain-entites/user.domain';
import { ProjectDomain } from '../../../src/domain-entites/project.domain';
import { ProjectState } from '../../../src/modules/project/entities/project.entity';

describe('ProjectDomain', () => {
  it('planStateUpdate for COMPLETED deletes feedback only', () => {
    const domain = new ProjectDomain({
      state: ProjectState.APPROVED,
      translator: new UserDomain(),
    } as any);

    expect(domain.planStateUpdate(ProjectState.COMPLETED)).toEqual({
      deleteFeedback: true,
      deleteTranslatedFile: false,
      findNewTranslator: false,
    });
  });

  it('planStateUpdate for ASSIGNED deletes translated file + feedback and keeps translator', () => {
    const domain = new ProjectDomain({ translator: new UserDomain() } as any);

    expect(domain.planStateUpdate(ProjectState.ASSIGNED)).toEqual({
      deleteFeedback: true,
      deleteTranslatedFile: true,
      findNewTranslator: false,
    });
  });

  it('planStateUpdate for APPROVED does nothing', () => {
    const domain = new ProjectDomain({
      state: ProjectState.COMPLETED,
      translator: new UserDomain(),
    } as any);

    expect(domain.planStateUpdate(ProjectState.APPROVED)).toEqual({
      deleteFeedback: false,
      deleteTranslatedFile: false,
      findNewTranslator: false,
    });
  });
});
