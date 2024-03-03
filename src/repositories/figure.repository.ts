import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {Figure, FigureRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class FigureRepository extends DefaultCrudRepository<
  Figure,
  typeof Figure.prototype.id,
  FigureRelations
> {
  public readonly user: BelongsToAccessor<User, typeof Figure.prototype.id>;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('UserRepository')
    userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Figure, dataSource);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
