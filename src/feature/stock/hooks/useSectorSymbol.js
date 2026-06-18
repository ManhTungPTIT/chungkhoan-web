import { useQuery } from "@tanstack/react-query";
import axios from "axios"

const fetchSectorSymbol = async(icb_code) => {
    const {data} = await axios.get(`${import.meta.env.VITE_PYTHON_API_URL}/sectors/symbols`, {
      params: { icb_code },
    })

    return Object.values(data);
}

export default function useSectorSymbol(sector){
    return useQuery({
        queryKey: ["symbols", sector],
        queryFn: () => fetchSectorSymbol(sector),
    })
}