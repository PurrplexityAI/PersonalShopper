#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/16df9b92f802a3747711da3b60f15d71841c22425e53684f7d752eef93d6e4e3/contract';
import endContract from '../../snapshots/16df9b92f802a3747711da3b60f15d71841c22425e53684f7d752eef93d6e4e3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e800deaccf0569a68b789b708a152f1beaa0859a2795404de57e431b6b4ecabb/contract';
import startContract from '../../snapshots/e800deaccf0569a68b789b708a152f1beaa0859a2795404de57e431b6b4ecabb/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'pantry_items',
        column: col('autoFrequency', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'pantry_items',
        column: col('lastPurchasedAtPrevious', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'pantry_items',
        column: col('lastSuggestedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'pantry_items',
        column: 'frequencyDays',
        options: {
          qualifiedTargetType: 'float8',
          formatTypeExpected: 'double precision',
          rawTargetTypeForLabel: 'float8',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
