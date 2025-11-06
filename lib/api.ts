import axios from 'axios';
import { Presentation, Category, Question, CategoryScore } from './types';
import { AuditCreateData } from '@/validation/audit.validation';

const api = axios.create({
  baseURL: '/api',
});

// Audit APIS
export const auditApi = {
  getAll: async (): Promise<Presentation[]> => {
    const response = await api.get('/audit');
    return response.data.data;
  },

  create: async (data: AuditCreateData)=> {
    const response = await api.post('/audit', data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/presentation/${id}`);
  },
};

// Presentation APIs
export const presentationApi = {
  getAll: async (): Promise<Presentation[]> => {
    const response = await api.get('/presentation');
    return response.data.presentations;
  },

  getById: async (id: string): Promise<Presentation> => {
    const response = await api.get(`/presentation/${id}`);
    return response.data.presentation;
  },

  create: async (data: { userId: string; title: string }): Promise<Presentation> => {
    const response = await api.post('/presentation', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ title: string }>): Promise<Presentation> => {
    const response = await api.patch(`/presentation/${id}`, data);
    return response.data.presentation;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/presentation/${id}`);
  },
};

// Category APIs
export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/category');
    return response.data.categories;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/category/${id}`);
    return response.data.category;
  },

  create: async (data: { presentationId: string; name: string }): Promise<Category> => {
    const response = await api.post('/category', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string }>): Promise<Category> => {
    const response = await api.patch(`/category/${id}`, data);
    return response.data.category;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/category/${id}`);
  },
};

// Question APIs
export const questionApi = {
  getAll: async (): Promise<Question[]> => {
    const response = await api.get('/question');
    return response.data.data;
  },

  getById: async (id: string): Promise<Question> => {
    const response = await api.get(`/question/${id}`);
    return response.data.question;
  },

  create: async (data: {
    text: string;
    categoryId: string;
    options: { text: string; points: number }[];
  }): Promise<Question> => {
    const response = await api.post('/question', data);
    return response.data.question;
  },

  update: async (id: string, data: Partial<{
    text: string;
    categoryId: string;
    options: { id?: string; text: string; points: number }[];
  }>): Promise<Question> => {
    const response = await api.patch(`/question/${id}`, data);
    return response.data.question;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/question/${id}`);
  },
};

// Test APIs
export const testApi = {
  getQuestionsForPresentation: async (presentationId: string): Promise<Question[]> => {
    const response = await api.get(`/test/questions/${presentationId}`);
    return response.data.questions;
  },

  submit: async (data: {
    userId: string;
    presentationId: string;
    answers: { questionId: string; optionId: string }[];
  }): Promise<{ testId: string; totalScore: number; categoryScores: CategoryScore[] }> => {
    const response = await api.post('/test/submit', data);
    return response.data.data;
  },
};