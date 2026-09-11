// Shared widget listing types — unified for app/widgets/page.tsx and _shared

export type WidgetCategory = 'chat' | 'alert' | 'counter' | 'progress' | 'info' | 'minimal';

export type WidgetItem = {
  id: string;
  title: string;
  desc: string;
  category: WidgetCategory;
  tags: string[];
  layout: string;
  params: string;
  preview: 'chat' | 'gift' | 'pinned' | 'like' | 'counter' | 'goal' | 'ticker' | 'clock' | 'social' | 'minimal' | 'full' | 'media' | 'lyrics' | 'poll';
  recommended?: boolean;
  w: number;
  h: number;
};
