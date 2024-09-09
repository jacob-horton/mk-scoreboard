import axios from "axios";

const ax = axios.create({
  baseURL: import.meta.env.VITE_SERVERADDR,
});

export default ax;
