import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../untils/axiosClient";

// Hồ sơ người dùng đang đăng nhập. Đổi path nếu backend khác /api/user/me.
const fetchMe = async () => {
  const token = localStorage.getItem("accessToken");
  const { data } = await axiosClient.get("/user/me", {
    params: { token },
  });
  console.log(data);
  // Một số backend bọc trong { data: {...} } — lấy phần lõi nếu có.
  return data?.data ?? data;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  });
}

// Cập nhật hồ sơ (họ tên, nơi cư trú, tiểu sử, email/SĐT còn thiếu, SĐT NV tư vấn).
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.patch("/user/me", payload);
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
