<template>
  <view class="container">
    <view class="glass-card slide-up">
      <view class="header">
        <text class="title">身份登记</text>
        <text class="subtitle">获取您的专属守护权限</text>
      </view>
      
      <view class="form-container">
        <view class="input-group">
          <text class="label">设定账户名</text>
          <input 
            class="input-field" 
            placeholder="必填：长度不小于3" 
            placeholder-class="placeholder-style"
            v-model="formData.username"
          />
        </view>
        
        <view class="input-group">
          <text class="label">安全识别码 (密码)</text>
          <input 
            class="input-field" 
            type="password" 
            placeholder="必填：最小长度为6" 
            placeholder-class="placeholder-style"
            v-model="formData.password"
          />
        </view>
        
        <view class="input-group">
          <text class="label">手机号码</text>
          <input 
            class="input-field" 
            placeholder="必填：绑定手机号" 
            placeholder-class="placeholder-style"
            v-model="formData.phone"
          />
        </view>
        
        <view class="input-group code-group">
          <text class="label">短信验证码</text>
          <view class="code-row">
            <input 
              class="input-field" 
              placeholder="必填" 
              placeholder-class="placeholder-style"
              v-model="formData.code"
            />
            <button class="code-btn" @tap="sendCode" :disabled="countdown > 0">{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</button>
          </view>
        </view>

        <view class="input-group">
          <text class="label">应急通知邮箱 (可选)</text>
          <input 
            class="input-field" 
            placeholder="用于接收最终预警通知" 
            placeholder-class="placeholder-style"
            v-model="formData.email"
          />
        </view>
        
        <button class="primary-btn pulse-hover" @tap="handleRegister" :disabled="loading">
          <text v-if="!loading">提交凭证并初始化</text>
          <text v-else>正在为您建立档案...</text>
        </button>
        
        <view class="footer-links">
          <text class="link-text" @tap="goToLogin">已有守护终端？返回连接</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { authApi } from '@/api/auth';

const loading = ref(false);
const formData = reactive({
  username: '',
  password: '',
  email: '',
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
    uni.showToast({ title: '验证码已发送', icon: 'success' });
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (e) {
    uni.showToast({ title: '发送失败', icon: 'none' });
  }
};

const handleRegister = async () => {
  if (!formData.username || !formData.password || !formData.phone || !formData.code) {
    return uni.showToast({ title: '标星必填信息不完整', icon: 'none' });
  }

  if (formData.password.length < 6) {
    return uni.showToast({ title: '安全识别码不足6位', icon: 'none' });
  }

  loading.value = true;
  try {
    const res = await authApi.register(formData);
    uni.showToast({ title: '身份备案成功，请登录', icon: 'success' });
    
    // Redirect to login
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
      
  } catch (error) {
    const errorMsg = error.message || error.error || '由于系统原因注册失败';
    uni.showToast({ 
      title: errorMsg, 
      icon: 'none',
      duration: 2500
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  uni.navigateBack();
};
</script>

<style>
/* Page Level Settings */
page {
  background-color: #0b0c10;
  min-height: 100vh;
  display: flex;
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
  background: rgba(30, 32, 44, 0.4);
  box-shadow: 0 16rpx 40rpx rgba(0,0,0,0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
}

.header {
  text-align: center;
  margin-bottom: 50rpx;
}

.title {
  display: block;
  font-size: 50rpx;
  font-weight: 800;
  color: #eeeeee;
  letter-spacing: 2rpx;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 24rpx;
  color: #45a29e;
  opacity: 0.9;
  letter-spacing: 4rpx;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 24rpx;
  color: #aaaaaa;
  margin-bottom: 10rpx;
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
  margin-top: 10rpx;
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
  margin-top: 24rpx;
  text-align: center;
}

.link-text {
  font-size: 24rpx;
  color: #66fcf1;
  opacity: 0.8;
}

/* Animations */
.slide-up {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(40rpx);
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
