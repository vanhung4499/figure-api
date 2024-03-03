import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasOneRepositoryFactory,
  repository,
  HasManyRepositoryFactory,
} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {User, UserCredentials, UserRelations, Figure} from '../models';
import {UserCredentialsRepository} from './user-credentials.repository';
import {FigureRepository} from './figure.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;

  public readonly figures: HasManyRepositoryFactory<
    Figure,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
    @repository.getter('FigureRepository')
    protected figureRepositoryGetter: Getter<FigureRepository>,
  ) {
    super(User, dataSource);
    this.figures = this.createHasManyRepositoryFactoryFor(
      'figures',
      figureRepositoryGetter,
    );
    this.registerInclusionResolver('figures', this.figures.inclusionResolver);
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );
    this.registerInclusionResolver(
      'userCredentials',
      this.userCredentials.inclusionResolver,
    );
  }

  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
