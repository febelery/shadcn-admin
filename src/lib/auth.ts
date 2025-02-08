// Token key in localStorage
const TOKEN_KEY = "admin_token";

export const auth = {
  // 获取 token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // 设置 token
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // 移除 token
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  // 检查是否已登录
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
