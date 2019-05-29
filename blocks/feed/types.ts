import { MapperFunction } from '@appsemble/utils/remap';

interface Reply {
  parentId?: string;
  author: string;
  content?: string;
}

export interface Remappers {
  title: MapperFunction;
  subtitle: MapperFunction;
  heading: MapperFunction;
  picture: MapperFunction;
  description: MapperFunction;
  author: MapperFunction;
  content: MapperFunction;
  latitude: MapperFunction;
  longitude: MapperFunction;
}

export interface BlockParameters {
  reply?: Reply;
  pictureBase: string;
  listen?: string;
  title: string;
  subtitle: string;
  heading: string;
  picture: string;
  description: string;
  author: string;
  content: string;
  latitude: number;
  longitude: number;
}

export interface BlockActions {
  avatarClick: any;
  submitReply: any;
  load: any;
  loadReply: any;
}
