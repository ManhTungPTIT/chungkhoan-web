import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchSectorFlowSurge = async (avgWindow) => {
    const { data } = await axios.get(
        `${import.meta.env.VITE_PYTHON_API_URL}/sector-flow-surge`,
        { params: { avg_window: avgWindow } },
    );
    return {
        generated_at: data?.generated_at ?? null,
        avg_window: data?.avg_window ?? avgWindow,
        rows: Array.isArray(data?.rows) ? data.rows : [],
    };
};

export function useSectorFlowSurge(avgWindow = 20) {
    return useQuery({
        queryKey: ["sector-flow-surge", avgWindow],
        queryFn: () => fetchSectorFlowSurge(avgWindow),
        refetchInterval: 30 * 1000,
        staleTime: 20 * 1000,
    });
}