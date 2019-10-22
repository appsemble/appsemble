import webPush from 'web-push';

export default function generateVapidToken() {
  return webPush.generateVAPIDKeys();
}
