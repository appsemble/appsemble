import { useEffect, useRef, useState } from 'preact/hooks';
import WordCloud from 'wordcloud'

const WordcloudLogic = (props: any) => { 
    const [canvasWidth] = useState(1170)
    const [canvasHeight] = useState(760)
    const canvasRef: any = useRef(null)
    const wordList: any[] = []

    if(!WordCloud.isSupported)
        return (<p>Your browser does not support the Wordcloud block!</p>)

    useEffect(() => {
        canvasRef.current.focus();

        const optionsList = {
            ...props.options, 
            ...{list: wordList}, 
            ...{shape: props.shape}
        }
        console.log(optionsList)

        if(canvasRef.current != null) {
            WordCloud(canvasRef.current, optionsList)
        }
        mapObjectToWordcloudItem(props.words)
    }, [])
    
    const mapObjectToWordcloudItem = (obj: string[]) => 
    {
        const kvPair: any = {}
        if(wordList.length > 0) return;

        obj.forEach((word) => {
            kvPair[word] = (kvPair[word] || 0) + 1
        })

        const keys = Object.keys(kvPair)
        
        for(let i = 0; i < keys.length; i++) {
            wordList.push(
                [
                    keys[i], kvPair[keys[i]]
                ]
            )
        }
    }

    return (
        <div className='canvasContainer'>
            <canvas 
                ref={canvasRef} 
                width={canvasWidth}
                height={canvasHeight}
                style={{
                    margin: 'auto',
                    padding: 0,
                    display: 'flex'
                }}
            />
        </div>
    )
}
export default WordcloudLogic