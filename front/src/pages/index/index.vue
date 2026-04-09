<template>
  <view class="container">
    <!-- Header -->
    <view class="top-nav">
      <text class="brand">AliveCheck</text>
      <view class="user-info" v-if="profile">
         <text class="username">{{ profile.username }}</text>
         <view class="status-indicator" :class="profile.status"></view>
      </view>
    </view>

    <!-- Main Dashboard -->
    <view class="dashboard panel">
      <view v-if="loading" class="loading-state">
         <text>同步系统时钟中...</text>
      </view>
      
      <view v-else-if="profile?.status === 'paused'" class="paused-state fade-in">
        <view class="icon-moon">🌙</view>
        <text class="status-title">系统休眠中</text>
        <text class="status-desc">倒计时已冻结。将在预定时间自动恢复。在这期间系统不会打扰任何人。</text>
      </view>

      <view v-else class="active-state fade-in">
        <text class="countdown-label">距系统激活预警程序还剩</text>
        
        <!-- Timer Ring / Core Display -->
        <view class="timer-core" :class="{ 'warning-glow': isWarning, 'danger-glow': isDanger }">
           <view class="timer-text">
             <text class="time-block">{{ hours < 10 ? '0'+hours : hours }}</text>
             <text class="colon">:</text>
             <text class="time-block">{{ minutes < 10 ? '0'+minutes : minutes }}</text>
             <text class="colon">:</text>
             <text class="time-block">{{ seconds < 10 ? '0'+seconds : seconds }}</text>
           </view>
        </view>

        <!-- Check-in Button -->
        <button class="checkin-btn pulse-button" @tap="handleCheckin" :disabled="isCheckingIn">
          <text v-if="!isCheckingIn" class="btn-text">我还活着</text>
          <text v-else class="btn-text">同步坐标中...</text>
        </button>

        <!-- Optional Diary / Mood -->
        <view class="diary-input-area">
           <input 
             class="diary-input" 
             placeholder="同时留一句随记 (选填)" 
             placeholder-class="ph-style"
             v-model="diaryText"
             maxlength="50"
           />
        </view>

      </view>
    </view>

    <!-- Navigation Bar Mock (for navigating to settings etc later) -->
    <view class="bottom-tabbar">
       <view class="tab-item active">首页</view>
       <view class="tab-item" @tap="goToSettings">配置</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { authApi } from '@/api/auth';
import { checkinApi } from '@/api/checkin';

const profile = ref(null);
const loading = ref(true);
const isCheckingIn = ref(false);
const diaryText = ref('');

// Timer states
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0);
const isWarning = ref(false); // < 12 hours
const isDanger = ref(false); //  < 6 hours or 0

let timerInterval = null;

// Fetch initial status
const loadStatus = async () => {
    loading.value = true;
    try {
        const token = uni.getStorageSync('token');
        if (!token) throw new Error('Unauthenticated (No Token)');
        
        const res = await authApi.getMe();
        
        // Safety grab
        profile.value = res.data || res;
        
        if (profile.value && profile.value.status === 'active') {
            startTimer(profile.value.lastActiveTime || profile.value.last_active_time);
        }
    } catch (e) {
        uni.showToast({ title: '拉取状态失败: ' + (e.error || e.message), icon: 'none', duration: 3000 });
        setTimeout(() => {
           // Redirect to login
           uni.reLaunch({ url: '/pages/login/login' });
        }, 3000);
    } finally {
        loading.value = false;
    }
};

onShow(() => {
    loadStatus();
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
});

const startTimer = (lastActiveIsoStr) => {
    if (timerInterval) clearInterval(timerInterval);
    
    // 48 hours = 48 * 60 * 60 * 1000
    const LIMIT_MS = 48 * 60 * 60 * 1000;
    const lastActive = new Date(lastActiveIsoStr).getTime();
    const expiryTime = lastActive + LIMIT_MS;

    const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, expiryTime - now);
        
        // Calculate chunks
        const totalSeconds = Math.floor(diff / 1000);
        hours.value = Math.floor(totalSeconds / 3600);
        minutes.value = Math.floor((totalSeconds % 3600) / 60);
        seconds.value = totalSeconds % 60;

        // Visual warnings
        isWarning.value = hours.value <= 12 && hours.value > 6;
        isDanger.value = hours.value <= 6;
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
};

const executeCheckin = async (lat = null, lon = null) => {
    isCheckingIn.value = true;
    try {
        await checkinApi.ping({
            diaryText: diaryText.value,
            latitude: lat,
            longitude: lon
        });
        
        diaryText.value = ''; // clear
        uni.showToast({ title: '安全报备成功', icon: 'success' });
        
        // Refresh timer
        await loadStatus();
    } catch (e) {
        uni.showToast({ title: '发生系统错误', icon: 'none' });
    } finally {
        isCheckingIn.value = false;
    }
};

const handleCheckin = () => {
    isCheckingIn.value = true;

    // Call device location
    uni.getLocation({
        type: 'wgs84',
        success: function (res) {
            executeCheckin(res.latitude, res.longitude);
        },
        fail: function () {
            isCheckingIn.value = false;
            // 宽容模式：弹窗询问是否在此情况下继续
            uni.showModal({
                title: '获取位置失败',
                content: '无法定位将导致预警时联系人只收到默认提示信。是否继续无定位打卡？',
                confirmText: '无定位打卡',
                success: function (modRes) {
                    if (modRes.confirm) {
                        executeCheckin(null, null);
                    }
                }
            });
        }
    });
};

const goToSettings = () => {
  uni.reLaunch({ url: '/pages/settings/settings' });
};

</script>

<style>
page {
  background-color: #0b0c10;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #eeeeee;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: space-between;
}

.top-nav {
  padding: 80rpx 40rpx 40rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(11, 12, 16, 0.9);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.brand {
  font-size: 36rpx;
  font-weight: 800;
  color: #66fcf1;
  letter-spacing: 2rpx;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.username {
  font-size: 28rpx;
  color: #c5c6c7;
}

.status-indicator {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background-color: #45a29e;
  box-shadow: 0 0 10rpx #45a29e;
}
.status-indicator.paused {
  background-color: #f39c12;
  box-shadow: 0 0 10rpx #f39c12;
}

/* Main Dashboard Panel */
.dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: radial-gradient(circle at 50% 50%, #1f2833 0%, #0b0c10 70%);
}

.loading-state, .paused-state {
  text-align: center;
}

.icon-moon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.status-title {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #f39c12;
  margin-bottom: 20rpx;
}

.status-desc {
  font-size: 26rpx;
  color: #888;
  padding: 0 40rpx;
}

/* Active State layout */
.active-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.countdown-label {
  font-size: 28rpx;
  color: #c5c6c7;
  opacity: 0.8;
  margin-bottom: 60rpx;
  letter-spacing: 4rpx;
}

/* Circular Timer Simulation */
.timer-core {
  width: 460rpx;
  height: 460rpx;
  border-radius: 50%;
  border: 8rpx solid #45a29e;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 80rpx;
  box-shadow: 0 0 40rpx inset rgba(69, 162, 158, 0.2), 0 0 40rpx rgba(69, 162, 158, 0.4);
  background: rgba(31, 40, 51, 0.6);
  transition: all 0.5s ease;
}

.warning-glow {
  border-color: #f39c12;
  box-shadow: 0 0 60rpx inset rgba(243, 156, 18, 0.3), 0 0 60rpx rgba(243, 156, 18, 0.5);
}

.danger-glow {
  border-color: #e74c3c;
  box-shadow: 0 0 80rpx inset rgba(231, 76, 60, 0.4), 0 0 80rpx rgba(231, 76, 60, 0.6);
  animation: dangerPulse 2s infinite;
}

@keyframes dangerPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 0 100rpx inset rgba(231, 76, 60, 0.6), 0 0 100rpx rgba(231, 76, 60, 0.8); }
  100% { transform: scale(1); }
}

.timer-text {
  display: flex;
  align-items: baseline;
  font-family: 'Courier New', Courier, monospace;
}

.time-block {
  font-size: 80rpx;
  font-weight: 700;
  color: #ffffff;
}

.colon {
  font-size: 60rpx;
  font-weight: 400;
  color: #888;
  margin: 0 10rpx;
  transform: translateY(-8rpx);
}

/* Button & Inputs */
.checkin-btn {
  width: 460rpx;
  height: 110rpx;
  border-radius: 55rpx;
  background: linear-gradient(135deg, #66fcf1, #45a29e);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10rpx 30rpx rgba(69, 162, 158, 0.4);
}

.btn-text {
  font-size: 34rpx;
  font-weight: 800;
  color: #0b0c10;
  letter-spacing: 4rpx;
}

.pulse-button:active {
  transform: scale(0.95);
}

.diary-input-area {
  margin-top: 40rpx;
  width: 460rpx;
}

.diary-input {
  width: 100%;
  height: 80rpx;
  background: rgba(31, 40, 51, 0.5);
  border-radius: 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #fff;
  border: 1px solid rgba(197, 198, 199, 0.1);
}

.ph-style {
  color: #666;
}

/* Animations */
.fade-in {
  animation: fadeIn 1s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Bottom Tabbar Mock */
.bottom-tabbar {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0 50rpx 0;
  background: rgba(11, 12, 16, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-item {
  color: #888;
  font-size: 24rpx;
  font-weight: 500;
  padding: 20rpx 40rpx;
  border-radius: 40rpx;
}

.tab-item.active {
  color: #66fcf1;
  background: rgba(102, 252, 241, 0.1);
}
</style>
