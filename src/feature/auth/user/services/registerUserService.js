import registerUserHook from "../hooks/registerUserHook";

export function RegisterUserService() {
  // Đăng ký xong không lưu token: người dùng sẽ được đưa về trang đăng nhập.
  const register = async (data) => {
    const response = await registerUserHook(data);
    console.log(response.data)
    return response.data;
  };

  return { register };
}
