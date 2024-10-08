export interface CreateSamlResponseOptions {
  statusCode?: string;
  subject?: { nameId?: string; loginId?: string };
  digest?: string;
}
