import axios from "axios";

export const LoginApi = (username: string, password: string): any => {
  return axios.post("/auth/admin", { username, password });
};

export const TwoFactorLoginApi = (twoFactorKey: string): any => {
  return axios.post("/auth/admin/two-factor", { two_factor_key: twoFactorKey });
};

export const UserInfoApi = ():any =>{
  return axios.get("/user/info")
}