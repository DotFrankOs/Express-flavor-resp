const API_BASE_URL = 'http://localhost:3000/api';
const USE_MOCK_DATA = false;

export const apiConfig = {
  baseUrl: API_BASE_URL,
  useMock: USE_MOCK_DATA,

  url(path) {
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  },
};