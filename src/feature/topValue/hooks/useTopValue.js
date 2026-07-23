import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart giá trị khớp lệnh cao nhất — API /top-value-board trả { data:[...] }.
// rows: [{symbol, price, change_pct, value, volume}] — value: VND.
const fetchTopValue = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/top-value-board`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.data) ? data.data : [],
    };
};

export function useTopValue() {
    return useQuery({
        queryKey: ["top-value-board"],
        queryFn: fetchTopValue,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}
