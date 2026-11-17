import {
  type OAuth2Provider,
  type PredefinedOrganizationRole,
  type TrainingStatus,
  type UserInfo,
} from '@appsemble/types';
import { type OAuth2State } from '@appsemble/web-utils';
import { type ComponentType } from 'react';

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
  locale: string;
  iconUrl: string;
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

/**
 * Training chapter after it's been processed. This gets used in the training tree itself.
 */
export interface TrainingChapter {
  /**
   * ID of the chapter.
   */
  id: string;

  /**
   * Title of the chapter
   */
  title: string;

  /**
   * List of trainings that make up this chapter.
   */
  trainings: Training[];

  /**
   * The ID of the chapter that has to be completed before this one can be accessed. Can also be an
   * array if multiple chapters block this one.
   */
  blockedBy?: string[] | string;

  /**
   * The status of the chapter
   */
  status: TrainingStatus;
}

/**
 * Properties of an individual training module.
 */
export interface Training {
  /**
   * Id of the training.
   */
  id: string;

  /**
   * Title of the training
   */
  title: string;

  /**
   * The path of the training page to route to.
   */
  path: string;

  /**
   * The content of the training to render.
   */
  content?: ComponentType;

  /**
   * The status of the training
   */
  status: TrainingStatus;
}
