import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

@Injectable()
export class NutritionRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}
}
