Migration 0.29.0 has a significant chance to fail due too a large amount of new constraints. The
migration however will now be rolled back in case of a failure and log the appriopriate actions to
take to clean the database.
