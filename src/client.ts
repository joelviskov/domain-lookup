import axios from 'axios'
import { Domain, DomainStatus } from './types';

const instance = axios.create({
  baseURL: 'https://1ztlll6rcl.execute-api.eu-north-1.amazonaws.com',
  timeout: 3000,
});

const API = {
  getDomains: async () => {
    return instance.get<Domain[]>("/domains")
  },
  getAvailability: async (name: string, tld: Domain) => {
    return instance.get<DomainStatus>(`/availability?domain=${name}.${tld.name}`)
  }
}

export default API