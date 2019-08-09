import { MapperFunction } from '@appsemble/utils';

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
  pictures: MapperFunction;
  description: MapperFunction;
  author: MapperFunction;
  content: MapperFunction;
  latitude: MapperFunction;
  longitude: MapperFunction;
}

export interface BlockParameters {
  buttonLabel?: string;
  reply?: Reply;
  pictureBase: string;
  listen?: string;
  title: string;
  subtitle: string;
  heading: string;
  picture: string;
  pictures: string[];
  description: string;
  author: string;
  content: string;
  latitude: number;
  longitude: number;
}

export interface BlockActions {
  onAvatarClick: any;
  onButtonClick: any;
  onSubmitReply: any;
  onLoad: any;
  onLoadReply: any;
}
