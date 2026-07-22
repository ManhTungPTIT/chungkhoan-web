import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchForeignSell = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/foreign-trading`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.sell) ? data.sell : [],
    };
};

export function useForeignSell() {
    return useQuery({
        queryKey: ["foreign-trading", "sell"],
        queryFn: fetchForeignSell,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}