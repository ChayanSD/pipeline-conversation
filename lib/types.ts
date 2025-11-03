export interface User {
  id: string;
  name: string;
  email: string;
  passCode: string;
  companyId: string;
  primaryColor: string;
  secondaryColor?: string;
  profileImageUrl?: string;
  companyRole?: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

export interface Presentation {
  id: string;
  userId: string;
  title: string;
  categories: Category[];
  tests: Test[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  presentationId: string;
  presentation: Presentation;
  questions: Question[];
  categoryScores: CategoryScore[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  categoryId: string;
  category: Category;
  options: Option[];
  answers: Answer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Option {
  id: string;
  text: string;
  questionId: string;
  question: Question;
  points: number;
  answers: Answer[];
}

export interface Test {
  id: string;
  userId: string;
  user: User;
  presentationId: string;
  presentation: Presentation;
  categoryScores: CategoryScore[];
  answers: Answer[];
  totalScore: number;
  createdAt: Date;
}

export interface CategoryScore {
  id: string;
  testId: string;
  test: Test;
  categoryId: string;
  category: Category;
  score: number;
}

export interface Answer {
  id: string;
  testId: string;
  test: Test;
  questionId: string;
  question: Question;
  optionId: string;
  option: Option;
  points: number;
}

export interface TestResults {
  totalScore: number;
  categoryScores: { [categoryId: string]: number };
  answers: Answer[];
}