export interface LoginCodeResponse {
  isAllowed: boolean;
  appName?: string;
  code: string;
}
