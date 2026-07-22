import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart mua ròng độc lập — API /foreign-trading trả { buy:[...], sell:[...] },
// hook này chỉ lấy phần buy.
// rows: [{symbol, price, change_pct, net_value}] — net_value: VND, dương.
const fetchForeignBuy = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/foreign-trading`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.buy) ? data.buy : [],
    };
};

export function useForeignBuy() {
    return useQuery({
        queryKey: ["foreign-trading", "buy"],
        queryFn: fetchForeignBuy,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}