import { http } from './http.js';

export async function apiGetContactInfo() {
  return http('GET', '/settings/contact');
}
