import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart giao dịch khối ngoại — API /foreign-trading-history trả
// { history:[...], current:{...} }.
// history: [{date, buy_value, sell_value, net_value, total_value}] — value: VND.
const fetchForeignTrading = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/foreign-trading-history`,
    );
    return {
        rows: Array.isArray(data?.history) ? data.history : [],
        current: data?.current ?? null,
    };
};

export function useForeignTrading() {
    return useQuery({
        queryKey: ["foreign-trading-history"],
        queryFn: fetchForeignTrading,
        refetchInterval: 60 * 1000,
        staleTime: 30 * 1000,
    });
}