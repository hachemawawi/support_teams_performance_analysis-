import axios from 'axios';

const baseURL = 'http://localhost:5000';

const api = {
  requests: {
    delete: async (id: number) => {
      const response = await axios.delete(`${baseURL}/api/requests/${id}`);
      return response.data;
    }
  }
};

export { api }; 