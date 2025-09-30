export interface SubscriptionPlan {
  /**
   * The name of the Subscription plan.
   */
  name: string;

  /**
   * The price of the Subscription plan.
   */
  price: string;

  /**
   * Amount of apps the user can publish.
   */
  appLimit: number;

  /**
   * How many notifications we allow organizations on this plan to send daily
   * from our SMTP server. Unlimited with their custom server.
   */
  dailyNotifications: number | 'unlimited';

  /**
   * How many GB of data we allow the organization to store on our servers.
   */
  persistentStorage: number;

  /**
   * Whether we allow the organizations to use custom containers.
   */
  customContainers: boolean;

  /**
   * Service level agreement associated with this plan.
   */
  sla: string;

  /**
   * Level of block support included in the plan.
   */
  blocks: string;

  /**
   * Type of backend support included in the plan.
   */
  backend: string;
}

export const freePlan: SubscriptionPlan = {
  name: 'free',
  blocks: 'Appsemble supported basic blocks',
  backend: 'Standard Appsemble backend',
  price: '0',
  appLimit: 3,
  dailyNotifications: 50,
  persistentStorage: 1,
  customContainers: false,
  sla: 'none',
};

export const basicPlan: SubscriptionPlan = {
  name: 'basic',
  blocks: 'Appsemble supported basic blocks',
  backend: 'Standard Appsemble backend',
  price: '5',
  appLimit: Number.POSITIVE_INFINITY,
  dailyNotifications: 50,
  persistentStorage: 1,
  customContainers: false,
  sla: 'basic',
};

export const standardPlan: SubscriptionPlan = {
  name: 'standard',
  blocks: 'Appsemble supported basic blocks',
  backend: 'Standard Appsemble backend',
  price: '25',
  appLimit: Number.POSITIVE_INFINITY,
  dailyNotifications: 5000,
  persistentStorage: 50,
  customContainers: false,
  sla: 'standard',
};

export const extensivePlan: SubscriptionPlan = {
  name: 'extensive',
  blocks: '3rd party building blocks',
  backend: 'Standard Appsemble backend',
  price: '50',
  appLimit: Number.POSITIVE_INFINITY,
  dailyNotifications: Number.POSITIVE_INFINITY,
  persistentStorage: 200,
  customContainers: true,
  sla: 'extensive',
};

export const enterprisePlan: SubscriptionPlan = {
  name: 'enterprise',
  blocks: '3rd party building blocks',
  backend: 'Hosting of custom backends',
  price: '100',
  appLimit: Number.POSITIVE_INFINITY,
  dailyNotifications: Number.POSITIVE_INFINITY,
  persistentStorage: 500,
  customContainers: true,
  sla: 'enterprise',
};

export function getSubscriptionPlanByName(name: string): SubscriptionPlan {
  if (basicPlan.name === name) {
    return basicPlan;
  }
  if (standardPlan.name === name) {
    return standardPlan;
  }
  if (extensivePlan.name === name) {
    return extensivePlan;
  }
  if (enterprisePlan.name === name) {
    return enterprisePlan;
  }
  return freePlan;
}
