// src/utils/request.js
// const BASE_URL = 'http://8.137.58.137:3000/api'; // Production Aliyun server
const BASE_URL = 'http://localhost:3000/api'; // Local development server

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    // Attempt to retrieve token
    const token = uni.getStorageSync('token');
    
    uni.request({
      url: `${BASE_URL}${url}`,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res) => {
         // Optionally handle 401 Unauthorized globally here
         if (res.statusCode === 401) {
             uni.removeStorageSync('token');
             // uni.navigateTo({ url: '/pages/login/login' });
         }
         if (res.statusCode >= 200 && res.statusCode < 300) {
             resolve(res.data);
         } else {
             reject(res.data || { error: 'Unknown server error.'});
         }
      },
      fail: (err) => {
         uni.showToast({
           title: '网络请求失败',
           icon: 'none'
         });
         reject(err);
      }
    });
  });
}

export const get = (url, data) => request(url, 'GET', data);
export const post = (url, data) => request(url, 'POST', data);
export const put = (url, data) => request(url, 'PUT', data);
export const del = (url, data) => request(url, 'DELETE', data);

export default request;
