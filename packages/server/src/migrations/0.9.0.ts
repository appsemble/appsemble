function error(): void {
  throw new Error(
    'In version 0.9.0 Appsemble migrated from MySQL to PostgreSQL. This migration needs to be applied manually.',
  );
}

export const key = '0.9.0';

export const up = error;

export const down = error;
