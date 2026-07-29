import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart top tăng giá mạnh nhất toàn thị trường — API /top-advance-board trả
// { data:[...] }. rows: [{symbol, price, change_pct, value, volume}].
const fetchTopAdvance = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/top-advance-board`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.data) ? data.data : [],
    };
};

export function useTopAdvance() {
    return useQuery({
        queryKey: ["top-advance-board"],
        queryFn: fetchTopAdvance,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}
