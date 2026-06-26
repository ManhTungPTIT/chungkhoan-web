import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const fetchMarket = async () => {
    const {data} = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/homepage/market-depth`
    )
   
    return data
}

export default function useMarket(){
    return useQuery({
        queryKey:["market"],
        queryFn: () => fetchMarket(),
    })
}