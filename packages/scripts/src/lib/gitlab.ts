import axios from 'axios';

export interface Environment {
  id: number;
  name: string;
  slug: string;
  state: 'available' | 'stopped';
}

export interface AssetLink {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  link_type?: 'image' | 'other' | 'package';
  name: string;
  url: string;
}

export interface Release {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tag_name: string;
  description: string;
  assets: { links: AssetLink[] };
}

const { CI_API_V4_URL = 'https://gitlab.com/api/v4', CI_JOB_TOKEN, CI_PROJECT_ID } = process.env;

export const gitlab = axios.create({
  baseURL: `${CI_API_V4_URL}/projects/${CI_PROJECT_ID}`,
  headers: { authorization: `Bearer ${CI_JOB_TOKEN}` },
});
