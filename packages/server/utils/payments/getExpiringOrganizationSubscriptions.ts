import dayjs from 'dayjs';
import { OrganizationSubscription } from '../../models/index.js';

export async function getExpiringOrganizationSubscriptions(
  expiresWithin: number,
): Promise<OrganizationSubscription[]> {
  // 1 AM is required here because the docker container shifts the query back by one hour
  const expirationDate = dayjs().add(expiresWithin, 'day');

  const subscriptions = await OrganizationSubscription.findAll({
    where: {
      expirationDate: String(expirationDate),
      cancelled: false,
    },
  });

  return subscriptions;
}
