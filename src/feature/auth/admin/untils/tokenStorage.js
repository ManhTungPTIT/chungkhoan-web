const ACCESS_KEY = "accessToken";

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_KEY, token);

// Refresh token now lives in an httpOnly cookie — only the access token is
// stored client-side. Any refreshToken passed in is intentionally ignored.
export const setTokens = ({ accessToken }) => {
  localStorage.setItem(ACCESS_KEY, accessToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
};
