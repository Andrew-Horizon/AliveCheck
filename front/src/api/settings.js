import { get, post, del } from '../utils/request';

export const settingsApi = {
  // === Pause / Resume ===
  setPause(data) {
    return post('/settings/pause', data);
  },
  resume() {
    return post('/settings/resume');
  },

  // === Contacts ===
  getContacts() {
    return get('/settings/contacts');
  },
  addContact(data) {
    return post('/settings/contacts', data);
  },
  removeContact(id) {
    return del(`/settings/contacts/${id}`);
  },

  // === SOS Message ===
  getMessage() {
    return get('/settings/message');
  },
  updateMessage(data) {
    return post('/settings/message', data);
  }
};
