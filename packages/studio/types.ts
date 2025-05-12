import {
  type OAuth2Provider,
  type PaymentProvider,
  type PredefinedOrganizationRole,
  type UserInfo,
} from '@appsemble/types';
import { type OAuth2State } from '@appsemble/web-utils';

export interface OrganizationMember {
  id: string;
  name?: string;
  primaryEmail?: string;
  role: PredefinedOrganizationRole;
}

export interface Organization {
  id: string;
  name: string;
  role: PredefinedOrganizationRole;
  description: string;
  website: string;
  email: string;
  iconUrl: string;
  preferredPaymentProvider: PaymentProvider;
  vatIdNumber: string;
  streetName: string;
  houseNumber: string;
  city: string;
  zipCode: string;
  countryCode: string;
  invoiceReference: string;
}

export interface Block {
  type: string;
  parent: number;
  subParent: number;
  block: number;
}

export interface Page {
  name: string;
  type: string;
  index: number;
}

/**
 * This extended state is stored in `sessionStorage` during the login process with OAuth2.
 */
export interface ExtendedOAuth2State extends OAuth2State {
  id: string;
  appRequest?: string;
  userinfo?: UserInfo & { profile: string };
}

declare global {
  interface Window {
    /**
     * This boolean indicates if Appsemble has loaded normally.
     *
     * If this is not been set, this means Appsemble didn’t load, probably because it doesn’t
     * recognize newer JavaScript features.
     */
    appsembleHasLoaded: boolean;

    settings: {
      enableRegistration: boolean;
      logins: OAuth2Provider[];
      sentryDsn: string;
      sentryEnvironment: string;
      customDomainAppCollection?: {
        id: number;
        realHost: string;
      };
    };
  }
}
