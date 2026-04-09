import { post } from '../utils/request';

export const checkinApi = {
  // Ping the server to reset survival clock
  ping(data) {
    return post('/checkin/ping', data);
  }
};
