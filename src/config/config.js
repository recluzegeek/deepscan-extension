export const CONFIG = {
  API_BASE_URL: "http://localhost:8000",
  API_PATH: "/api",
  get FULL_API_URL() {
    return `${this.API_BASE_URL}${this.API_PATH}`;
  },
  get WEB_URL() {
    return this.API_BASE_URL;
  }
}; 