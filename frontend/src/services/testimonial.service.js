import { http } from './http.js';

export async function apiGetTestimonials() {
  return http('GET', '/testimonials');
}

export async function apiSubmitTestimonial({ content, rating, eventId = null }) {
  return http('POST', '/testimonials', { content, rating, eventId });
}

export async function apiDeleteTestimonial(id) {
  return http('DELETE', `/testimonials/${id}`);
}
