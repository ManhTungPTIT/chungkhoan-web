import { useQuery } from "@tanstack/react-query"
import axios from "axios"

const fetchTopVolumn = async () => {
    const {data} = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/homepage/top-volume`
    )

    return Object.values(data.data)
}

export default function useTopVolumn(){
    return useQuery({
        queryKey: ["topVolumn"],
        queryFn: () => fetchTopVolumn(),
    })
}