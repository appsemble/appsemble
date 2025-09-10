import { type AppRole } from './roles.js';

export interface AppMemberInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: string;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * The phone number of the app member.
   */
  phoneNumber?: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture?: string;

  /**
   * The end-user’s locale, represented as a BCP47 language tag.
   */
  locale?: string;

  /**
   * The end-user’s time zone.
   */
  zoneinfo?: string;

  /**
   * The role of the app member.
   */
  role: AppRole;

  /**
   * The end-user's additional properties
   */
  properties?: Record<string, any>;

  /**
   * Whether this app member is used for demonstration purposes
   */
  demo: boolean;

  /**
   * Whether this app member has been created by seeding.
   */
  $seed: boolean;

  /**
   * Whether this app member is a copy of a seed app member.
   */
  $ephemeral: boolean;
}
