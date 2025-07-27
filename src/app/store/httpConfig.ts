import axios from "axios";
import { BASE_URL } from "../configs/constant";

//Base axios instance
export const AxiosInstance = axios.create({
  baseURL: BASE_URL,
});
