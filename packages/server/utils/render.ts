/**
 * Create a snippet of JavaScript code to initialize Google Analytics.
 *
 * @param id The Google Analytics ID to generate the gtag code for.
 * @returns The code to initialize Google Analytics.
 */
export function createGtagCode(id: string): string[] {
  return [
    'window.dataLayer=window.dataLayer||[]',
    'function gtag(){dataLayer.push(arguments)}',
    'gtag("js",new Date)',
    `gtag("config",${JSON.stringify(id)})`,
  ];
}

/**
 * Create a snippet of JavaScript code to initialize Meta Pixel.
 *
 * @param id The Meta Pixel ID to generate the code for.
 * @returns The code to initialize Meta Pixel.
 */
export function createMetaPixelCode(id: string): string[] {
  return [
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);
t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js')`,
    `fbq('init', ${JSON.stringify(id)})`,
    "fbq('track', 'PageView')",
  ];
}

/**
 * Create a snippet of JavaScript code to initialize MS Clarity.
 *
 * @param id The MS Clarity ID to generate the code for.
 * @returns The code to initialize MS Clarity.
 */
export function createMSClarityCode(id: string): string[] {
  return [
    `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "${id}");`,
  ];
}
