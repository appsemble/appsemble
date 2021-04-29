export interface Resource {
  id: number;
  $clonable: boolean;
  $created: string;
  $updated: string;
  $author?: ResourceAuthor;
  [key: string]: unknown;
}

export interface ResourceAuthor {
  id: string;
  name: string;
}
