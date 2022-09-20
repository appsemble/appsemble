declare module '@appsemble/sdk' {
  interface EventListeners {
    /**
     * This event can be used to receive incoming data to display.
     */
    data: never;
  }

  interface Parameters {
    /**
      Shape of the wordcloud.
      @default 'circle'
    */
    shape: 'circle' 
          | 'cardioid' 
          | 'diamond' 
          | 'square' 
          | 'triangle-forward' 
          | 'triangle' 
          | 'pentagon' 
          | 'star'
    /**
     * A list of fields to render out in a table.
     */
    fields: string[];  

    /**
     *  List of options for rendering the wordcloud.
     */
    options: Options;
  }

  
  export interface Options {

    /**
     *  The font the wordcloud words use.
     */
    font?: string | undefined

    /**
      The color of the wordcloud words.
      @default '#000000'
    */
    color?: string | undefined

    /**
     *  The background color for the wordcloud.
     */
    backgroundColor?: string | undefined

    /**
      Probability for the word to rotate. Set the number to 1 to always rotate.
      @default 0
    */
    rotateRatio?: number | undefined

    /**
      Number to multiply the word size by.
    */
    weightFactor?: number | undefined
  }
}

export {};
