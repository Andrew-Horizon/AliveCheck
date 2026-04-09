<template>
  <view class="container">
    <view class="header">
      <text class="page-title">系统控制中枢</text>
    </view>

    <!-- Section: SOS Message -->
    <view class="setting-card">
      <view class="card-header">
        <text class="card-title">🚨 预留求救信</text>
      </view>
      <text class="desc">当您的防线被攻破（48小时失联）时，系统将随同定位发送此信函。</text>
      <textarea 
        class="input-box area" 
        placeholder="写下最重要的话..."
        v-model="messageContent"
        maxlength="200"
      ></textarea>
      <button class="action-btn safe-btn" @tap="saveMessage" :disabled="isSavingMessage">保存留档</button>
    </view>

    <!-- Section: Contacts -->
    <view class="setting-card">
      <view class="card-header">
        <text class="card-title">👥 紧急响应组 (最多3人)</text>
      </view>
      <view class="contact-list">
         <view class="contact-item fade-in" v-for="(item, index) in contacts" :key="item.id">
            <view class="info">
               <text class="name">{{ item.name }} ({{ item.relation }})</text>
               <text class="email">{{ item.email }}</text>
            </view>
            <view class="delete-icon" @tap="removeContact(item.id)">×</view>
         </view>
      </view>

      <view v-if="contacts.length < 3" class="add-contact-form">
         <input class="input-box minor" placeholder="姓名" v-model="newContact.name" />
         <input class="input-box minor" placeholder="关系 (如父母)" v-model="newContact.relation" />
         <input class="input-box minor" placeholder="接收邮箱" v-model="newContact.email" />
         <button class="action-btn outline-btn" @tap="addContact">授权关联</button>
      </view>
    </view>

    <!-- Section: Sleep Mode -->
    <view class="setting-card danger-zone">
      <view class="card-header">
        <text class="card-title">💤 深度休眠控制 (防打扰)</text>
      </view>
      <text class="desc">若您即将步入野外长假或卧病静养，不便签到，可激活此项。</text>
      
      <picker mode="date" @change="onDateChange">
        <view class="picker-view">
           <text>选择解冻苏醒日期：</text>
           <text class="highlight-date">{{ sleepDate || '未选择' }}</text>
        </view>
      </picker>

      <view class="btn-row">
        <button class="action-btn warn-btn" @tap="activateSleep">进入休眠</button>
        <button class="action-btn danger-outline-btn" @tap="clearSleep">强行唤醒系统</button>
      </view>
    </view>

    <!-- Bottom Navigation -->
    <view class="bottom-tabbar">
       <view class="tab-item" @tap="goToIndex">首页</view>
       <view class="tab-item active">配置</view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { settingsApi } from '@/api/settings';

const messageContent = ref('');
const isSavingMessage = ref(false);

const contacts = ref([]);
const newContact = reactive({ name: '', relation: '', email: '', phone: '' });

const sleepDate = ref('');

onShow(() => {
    loadData();
});

const loadData = async () => {
    try {
        const msgRes = await settingsApi.getMessage();
        if (msgRes.data?.content) messageContent.value = msgRes.data.content;

        const contRes = await settingsApi.getContacts();
        if (contRes.data) contacts.value = contRes.data;
    } catch (e) {
        uni.showToast({ title: '参数加载异常', icon: 'none' });
    }
}

// Message handlers
const saveMessage = async () => {
    if (!messageContent.value.trim()) return uni.showToast({ title: '内容不准为空', icon: 'none' });
    isSavingMessage.value = true;
    try {
        await settingsApi.updateMessage({ content: messageContent.value, contentType: 'text' });
        uni.showToast({ title: '入库成功', icon: 'success' });
    } catch (e) {
        uni.showToast({ title: '保存失败', icon: 'none' });
    } finally {
        isSavingMessage.value = false;
    }
}

// Contact handlers
const addContact = async () => {
    if (!newContact.name || !newContact.relation || !newContact.email) {
        return uni.showToast({ title: '前置信息不完整', icon: 'none' });
    }
    try {
        await settingsApi.addContact({ ...newContact });
        uni.showToast({ title: '网络链路已打通', icon: 'success' });
        newContact.name = ''; newContact.relation = ''; newContact.email = '';
        loadData();
    } catch (e) {
        uni.showToast({ title: e.error || '添加遭拒', icon: 'none' });
    }
}

const removeContact = async (id) => {
    try {
        await settingsApi.removeContact(id);
        uni.showToast({ title: '权限已摘除', icon: 'success' });
        loadData();
    } catch (e) {
        uni.showToast({ title: '剥离失败', icon: 'none' });
    }
}

// Sleep Handlers
const onDateChange = (e) => {
    sleepDate.value = e.detail.value;
}

const activateSleep = async () => {
    if (!sleepDate.value) return uni.showToast({ title: '请界定休眠边界', icon: 'none' });
    try {
        // Construct ISO string
        const target = new Date(`${sleepDate.value}T00:00:00Z`).toISOString();
        await settingsApi.setPause({ resumeTime: target });
        uni.showToast({ title: '生体检测已被冻结', icon: 'success' });
        sleepDate.value = '';
    } catch(e) {
        uni.showToast({ title: '指令下达异常', icon: 'none' });
    }
}

const clearSleep = async () => {
    try {
        await settingsApi.resume();
        uni.showToast({ title: '侦测已重连', icon: 'success' });
    } catch(e) {
        uni.showToast({ title: '激苏系统故障', icon: 'none' });
    }
}

const goToIndex = () => {
    uni.reLaunch({ url: '/pages/index/index' });
}
</script>

<style>
page {
  background-color: #0b0c10;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, sans-serif;
  color: #eeeeee;
  padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
}

.container {
  padding: 40rpx;
  padding-bottom: 300rpx;
}

.header {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 800;
  color: #66fcf1;
}

.setting-card {
  background: rgba(31, 40, 51, 0.4);
  border: 1px solid rgba(102, 252, 241, 0.1);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.3);
}

.card-header {
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.desc {
  font-size: 24rpx;
  color: #888;
  display: block;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.input-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(102, 252, 241, 0.2);
  border-radius: 16rpx;
  padding: 0 24rpx;
  color: #fff;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 20rpx;
  height: 80rpx;
  line-height: 80rpx;
}
.input-box.area {
  height: 160rpx;
  padding: 20rpx 24rpx;
  line-height: 1.5;
}

.action-btn {
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
}

.safe-btn {
  background: linear-gradient(135deg, #45a29e, #1f2833);
  border: 1px solid rgba(102, 252, 241, 0.4);
}

.warn-btn {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  border: 1px solid #f39c12;
  flex: 1;
}

.danger-outline-btn {
  background: transparent;
  border: 1px solid #e74c3c;
  color: #e74c3c;
  flex: 1;
}

.outline-btn {
  background: transparent;
  border: 1px solid #45a29e;
  color: #66fcf1;
}

.contact-list {
  margin-bottom: 20rpx;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 20rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

.contact-item .info {
  display: flex;
  flex-direction: column;
}

.contact-item .name {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.contact-item .email {
  font-size: 24rpx;
  color: #aaa;
  margin-top: 6rpx;
}

.delete-icon {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
}

.add-contact-form {
  border-top: 1px dashed rgba(255,255,255,0.1);
  padding-top: 20rpx;
}

.danger-zone {
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.picker-view {
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.highlight-date {
  color: #f39c12;
  font-weight: bold;
}

.btn-row {
  display: flex;
  gap: 20rpx;
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0 50rpx 0;
  background: rgba(11, 12, 16, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 999;
}

.tab-item {
  color: #888;
  font-size: 24rpx;
  font-weight: 500;
  padding: 20rpx 80rpx;
  border-radius: 40rpx;
}

.tab-item.active {
  color: #66fcf1;
  background: rgba(102, 252, 241, 0.1);
}
</style>
