import { useQuery } from "@tanstack/react-query";
import axios from "axios"

const fetchSector = async() => {
    const {data} = await axios.get(`${import.meta.env.VITE_PYTHON_API_URL}/sectors`)

    return Object.values(data);
}

export default function useSector(){
    return useQuery({
        queryKey: ["sector"],
        queryFn: () => fetchSector(),
    })
}