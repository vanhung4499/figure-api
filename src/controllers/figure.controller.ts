import {repository} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Figure} from '../models';
import {FigureRepository} from '../repositories';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';

export class FigureController {
  constructor(
    @repository(FigureRepository)
    public figureRepository: FigureRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
  ) {}

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @post('/figures')
  @response(200, {
    description: 'Figure model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Figure, {
          title: 'New Figure',
          exclude: ['userId'],
        }),
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Figure, {
            title: 'NewFigure',
            exclude: ['id'],
          }),
        },
      },
    })
    figure: Omit<Figure, 'id'>,
  ): Promise<Figure> {
    figure.userId = this.currentUser[securityId];
    return this.figureRepository.create(figure);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['ADMIN']})
  @get('/figures/all')
  @response(200, {
    description: 'Array of Figure model instances (only for admin)',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Figure, {includeRelations: true}),
        },
      },
    },
  })
  async findAll(): Promise<Figure[]> {
    const filter = {include: ['user']};
    return this.figureRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @get('/figures')
  @response(200, {
    description: 'Array of Figure model instances (for user)',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Figure),
        },
      },
    },
  })
  async findByUserId(): Promise<Figure[]> {
    const filter = {
      where: {
        userId: this.currentUser[securityId],
      },
    };
    return this.figureRepository.find(filter);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @get('/figures/{id}')
  @response(200, {
    description: 'Figure model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Figure),
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Figure> {
    const foundFigure = await this.figureRepository.findById(id);

    if (!foundFigure) {
      throw new HttpErrors.NotFound(`Figure not found`);
    }

    if (foundFigure.userId !== this.currentUser[securityId]) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    return this.figureRepository.findById(id);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @patch('/figures/{id}')
  @response(204, {
    description: 'Figure PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Figure, {partial: true}),
        },
      },
    })
    figure: Figure,
  ): Promise<void> {
    await this.figureRepository.updateById(id, figure);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @put('/figures/{id}')
  @response(204, {
    description: 'Figure PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() figure: Figure,
  ): Promise<void> {
    const foundFigure = await this.figureRepository.findById(id);

    if (!foundFigure) {
      throw new HttpErrors.NotFound(`Figure not found`);
    }

    if (foundFigure.userId !== this.currentUser[securityId]) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    await this.figureRepository.replaceById(id, figure);
  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['USER']})
  @del('/figures/{id}')
  @response(204, {
    description: 'Figure DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    const foundFigure = await this.figureRepository.findById(id);

    if (!foundFigure) {
      throw new HttpErrors.NotFound(`Figure not found`);
    }

    if (foundFigure.userId !== this.currentUser[securityId]) {
      throw new HttpErrors.Forbidden('Access denied');
    }

    await this.figureRepository.deleteById(id);
  }
}
