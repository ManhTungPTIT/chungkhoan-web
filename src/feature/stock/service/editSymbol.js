import {useVn100} from "../../chart/hooks/useVn100"

export function symbolAll(){
    const { data: dataPanel = [] } = useVn100();
}

export function editSymbol(listSymbol = []){
    const listChangeSymbol = listSymbol.map((symbol,index) => {
        return true;
})
}