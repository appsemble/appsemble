import { MapperFunction } from '@appsemble/utils';

interface Reply {
  parentId?: string;
  author?: string;
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

declare module '@appsemble/sdk' {
  interface Parameters {
    buttonLabel?: string;
    reply?: Reply;
    pictureBase?: string;
    title?: string;
    subtitle?: string;
    heading?: string;
    picture?: string;
    pictures?: string[];
    description?: string;
    latitude?: string;
    longitude?: string;
  }

  interface Actions {
    onAvatarClick: any;
    onButtonClick: any;
    onSubmitReply: any;
    onLoadReply: any;
  }

  interface EventListeners {
    data: {};
  }
}
