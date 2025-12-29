import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, file: Express.Multer.File) {
    const project = new Project();
    project.customer = { id: createProjectDto.customerId } as User;
    if (createProjectDto.translatorId) {
      project.translator = { id: createProjectDto.translatorId } as User;
    }
    project.languageCode = createProjectDto.languageCode;
    if (file) {
      project.originalFile = file.buffer;
    }

    return this.projectRepository.save(project);
  }

  findAll() {
    return this.projectRepository.find({
      relations: ['customer', 'translator'],
    });
  }

  findOne(id: number) {
    return this.projectRepository.findOne({
      where: { ProjectId: id },
      relations: ['customer', 'translator'],
    });
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return this.projectRepository.update(id, updateProjectDto);
  }

  remove(id: number) {
    return this.projectRepository.delete(id);
  }
}
