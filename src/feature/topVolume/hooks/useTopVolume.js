import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Chart khối lượng khớp lệnh cao nhất — API /top-volume-board trả { data:[...] }.
// rows: [{symbol, price, change_pct, value, volume}] — volume: số cổ phiếu.
const fetchTopVolume = async () => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/top-volume-board`,
    );
    return {
        generated_at: data?.generated_at ?? null,
        rows: Array.isArray(data?.data) ? data.data : [],
    };
};

export function useTopVolume() {
    return useQuery({
        queryKey: ["top-volume-board"],
        queryFn: fetchTopVolume,
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}