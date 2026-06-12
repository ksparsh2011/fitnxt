import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DATABASE_TOKEN } from '../../../libs/database/database.module';
import { Database } from '../../../libs/database/database.types';

@Injectable()
export class NutritionRepository {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>) {}

  async sumTodayMealLogs(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
    const row = await this.db
      .selectFrom('meal_logs')
      .select((eb) => [
        eb.fn.sum('calories').as('totalCalories'),
        eb.fn.sum('protein_g').as('totalProtein'),
        eb.fn.sum('carbs_g').as('totalCarbs'),
        eb.fn.sum('fat_g').as('totalFat'),
      ])
      .where('user_id', '=', userId)
      .where('logged_at', '>=', from)
      .where('logged_at', '<', to)
      .executeTakeFirst();

    return {
      calories: Number(row?.totalCalories ?? 0),
      protein: Number(row?.totalProtein ?? 0),
      carbs: Number(row?.totalCarbs ?? 0),
      fat: Number(row?.totalFat ?? 0),
    };
  }

  async findNutritionTargets(
    userId: string,
  ): Promise<{ calories: number; protein: number; carbs: number; fat: number } | null> {
    const row = await this.db
      .selectFrom('nutrition_targets')
      .select(['calories', 'protein_g', 'carbs_g', 'fat_g'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;
    return {
      calories: row.calories,
      protein: row.protein_g,
      carbs: row.carbs_g,
      fat: row.fat_g,
    };
  }
}
