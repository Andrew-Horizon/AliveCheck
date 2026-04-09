import { post, get } from '../utils/request';

export const authApi = {
  // Login standard username/password
  login(data) {
    return post('/auth/login', data);
  },
  
  // Register new account
  register(data) {
    return post('/auth/register', data);
  },
  
  // SMS login
  loginSms(data) {
    return post('/auth/login-sms', data);
  },

  // Send verification code
  sendCode(phone) {
    return post('/auth/send-code', { phone });
  },

  // Get current user profile and status
  getMe() {
    return get('/auth/me');
  }
};
