<template>
  <view class="container">
    <view class="glass-card fade-in">
      <view class="header">
        <text class="title">AliveCheck</text>
        <text class="subtitle">登录您的守护终端</text>
      </view>
      
      <view class="tab-container">
        <view class="tab" :class="{ active: loginMode === 'password' }" @tap="loginMode = 'password'">隐秘登录</view>
        <view class="tab" :class="{ active: loginMode === 'sms' }" @tap="loginMode = 'sms'">信标验证</view>
      </view>

      <view class="form-container">
        <!-- PASSWORD MODE -->
        <view v-if="loginMode === 'password'">
          <view class="input-group">
            <text class="label">账户</text>
            <input 
              class="input-field" 
              placeholder="请输入用户名" 
              placeholder-class="placeholder-style"
              v-model="formData.username"
            />
          </view>
          
          <view class="input-group" style="margin-top: 40rpx;">
            <text class="label">安全密码</text>
            <input 
              class="input-field" 
              type="password" 
              placeholder="请输入您的密码" 
              placeholder-class="placeholder-style"
              v-model="formData.password"
            />
          </view>
        </view>

        <!-- SMS MODE -->
        <view v-if="loginMode === 'sms'">
          <view class="input-group">
            <text class="label">绑定手机号</text>
            <input 
              class="input-field" 
              placeholder="必填" 
              placeholder-class="placeholder-style"
              v-model="formData.phone"
            />
          </view>
          
          <view class="input-group code-group" style="margin-top: 40rpx;">
            <text class="label">动态指令</text>
            <view class="code-row">
              <input 
                class="input-field" 
                placeholder="6位验证码" 
                placeholder-class="placeholder-style"
                v-model="formData.code"
              />
              <button class="code-btn" @tap="sendCode" :disabled="countdown > 0">{{ countdown > 0 ? countdown + 's冷却' : '获取指令' }}</button>
            </view>
          </view>
        </view>
        
        <button class="primary-btn pulse-hover" @tap="handleLogin" :disabled="loading">
          <text v-if="!loading">连接终端</text>
          <text v-else>正在验证身份...</text>
        </button>
        
        <view class="footer-links">
          <text class="link-text" @tap="goToRegister">暂无通行证？申请加入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { authApi } from '@/api/auth';

const loginMode = ref('password'); // 'password' or 'sms'
const loading = ref(false);
const formData = reactive({
  username: '',
  password: '',
  phone: '',
  code: ''
});

const countdown = ref(0);
let timer = null;

const sendCode = async () => {
  if (!formData.phone || formData.phone.length < 11) {
    return uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
  }
  
  try {
    await authApi.sendCode(formData.phone);
    uni.showToast({ title: '指令已发送', icon: 'success' });
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (e) {
    uni.showToast({ title: '发送受阻', icon: 'none' });
  }
};

const handleLogin = async () => {
  if (loginMode.value === 'password') {
    if (!formData.username || !formData.password) {
      return uni.showToast({ title: '请输入完整信息', icon: 'none' });
    }
  } else {
    if (!formData.phone || !formData.code) {
      return uni.showToast({ title: '指令参数缺失', icon: 'none' });
    }
  }

  loading.value = true;
  try {
    let res;
    if (loginMode.value === 'password') {
       res = await authApi.login({ username: formData.username, password: formData.password });
    } else {
       res = await authApi.loginSms({ phone: formData.phone, code: formData.code });
    }
    
    // Safety check just in case res has different shape
    const rootData = res.data || res;
    
    if (rootData && rootData.token) {
      uni.setStorageSync('token', rootData.token);
      if (rootData.user) {
         uni.setStorageSync('user', JSON.stringify(rootData.user));
      }
      
      uni.showToast({ title: '连接成功', icon: 'success' });
      // Redirect to index
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index',
          fail: (err) => {
              console.error('Launch failed:', err);
              uni.showToast({ title: '跳转失败: ' + err.errMsg, icon: 'none' });
          }
        });
      }, 500);
    } else {
      uni.showToast({ title: '服务器返回异常：Token 丢失', icon: 'none' });
      console.log('Login res:', res);
    }
  } catch (error) {
    console.error('Login Exception:', error);
    uni.showToast({ 
      title: error.error || error.message || '连接被拒绝，系统异常', 
      icon: 'none',
      duration: 3000
    });
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  uni.navigateTo({ url: '/pages/register/register' });
};
</script>

<style>
page {
  background-color: #0b0c10;
  min-height: 100vh;
  width: 100vw;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
  box-sizing: border-box;
  background: radial-gradient(circle at 50% -20%, #1a1c29, #0b0c10);
}

.glass-card {
  width: 100%;
  max-width: 600rpx;
  padding: 60rpx 40rpx;
  border-radius: 40rpx;
  box-sizing: border-box;
  background: rgba(30, 32, 44, 0.4);
  box-shadow: 0 16rpx 40rpx rgba(0,0,0,0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  color: #eeeeee;
  letter-spacing: 2rpx;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #66fcf1;
  opacity: 0.8;
  letter-spacing: 4rpx;
}

.tab-container {
  display: flex;
  margin-bottom: 40rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 40rpx;
  padding: 8rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #888;
  border-radius: 32rpx;
  transition: all 0.3s;
}

.tab.active {
  background: rgba(102, 252, 241, 0.1);
  color: #66fcf1;
  font-weight: bold;
}

.form-container {
  display: flex;
  flex-direction: column;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 24rpx;
  color: #aaaaaa;
  margin-bottom: 12rpx;
  margin-left: 12rpx;
  letter-spacing: 2rpx;
}

.input-field {
  height: 88rpx;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(102, 252, 241, 0.2);
  border-radius: 24rpx;
  padding: 0 30rpx;
  color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #66fcf1;
  box-shadow: 0 0 12rpx rgba(102, 252, 241, 0.3);
}

.code-row {
  display: flex;
  gap: 16rpx;
}
.code-row .input-field {
  flex: 1;
}
.code-btn {
  height: 88rpx;
  width: 200rpx;
  background: rgba(102, 252, 241, 0.1);
  color: #66fcf1;
  border: 1px solid rgba(102, 252, 241, 0.3);
  border-radius: 24rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.code-btn[disabled] {
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  border-color: rgba(255, 255, 255, 0.1);
}

.placeholder-style {
  color: #444444;
}

.primary-btn {
  height: 96rpx;
  background: linear-gradient(135deg, #45a29e, #1f2833);
  color: #ffffff;
  font-weight: 600;
  font-size: 30rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  border: 1px solid rgba(102, 252, 241, 0.4);
  box-shadow: 0 8rpx 24rpx rgba(31, 40, 51, 0.6);
  transition: transform 0.2s, box-shadow 0.2s;
}

.primary-btn::after {
  border: none;
}

.pulse-hover:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 12rpx rgba(31, 40, 51, 0.4);
}

.footer-links {
  margin-top: 30rpx;
  text-align: center;
}

.link-text {
  font-size: 24rpx;
  color: #45a29e;
}

/* Animations */
.fade-in {
  animation: fadeIn 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(20rpx);
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
