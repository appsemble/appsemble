export interface FormValues {
  googleAnalyticsID: string;
  sentryDsn: string;
  icon: File | string;
  maskableIcon?: File;
  iconBackground: string;
  path: string;
  private: boolean;
  domain: string;
  locked: boolean;
  longDescription: string;
}
