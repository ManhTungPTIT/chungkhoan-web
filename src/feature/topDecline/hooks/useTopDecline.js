import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart top giảm giá mạnh nhất toàn thị trường — API /top-decline-board trả
// { data:[...] }. rows: [{symbol, price, change_pct, value, volume}].
const fetchTopDecline = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/top-decline-board`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.data) ? data.data : [],
    };
};

export function useTopDecline() {
    return useQuery({
        queryKey: ["top-decline-board"],
        queryFn: fetchTopDecline,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}