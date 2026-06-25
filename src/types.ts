export type ProfileId = string;
export type DraftId = string;

export interface Profile {
  id: ProfileId;
  avatarDataUrl: string; // resized to 200x200
  username: string;      // without "@", max 30 chars
  verified: boolean;
}

export interface Slide {
  dataUrl: string;
  w: number;
  h: number;
}

export interface VisibleComment {
  user: string; // max 30
  text: string; // max 200
}

export interface PostContent {
  caption: string;
  likes: string;          // free-form: "1.234", "1k"
  commentsCount: string;  // free-form
  visibleComments: VisibleComment[]; // up to 3
  timeAgo: string;        // "Há 2 horas"
  sponsored: boolean;
  location: string;       // "" hides
}

export interface CarouselState {
  sourceImage: HTMLImageElement | null;
  slides: Slide[];
  cuts: number[]; // x-positions of cut lines (px), length = slides.length - 1
  activeSlide: number;
  independentCuts: boolean;
}

export interface ThemeState {
  app: "light" | "dark";
  igFrame: "light" | "dark";
  device: "mobile" | "desktop";
}

export interface Draft {
  id: DraftId;
  createdAt: number;
  thumbnailDataUrl: string; // 80px wide
  carouselSlides: Slide[];
  carouselCuts: number[];
  post: PostContent;
}

export interface AppState {
  profiles: Profile[];          // up to 5
  activeProfileId: ProfileId | null;
  theme: ThemeState;
  drafts: Draft[];              // up to 5, FIFO
  carousel: CarouselState;
  post: PostContent;
}

export const EMPTY_POST: PostContent = {
  caption: "",
  likes: "0",
  commentsCount: "0",
  visibleComments: [],
  timeAgo: "Agora",
  sponsored: false,
  location: "",
};

export const EMPTY_CAROUSEL: CarouselState = {
  sourceImage: null,
  slides: [],
  cuts: [],
  activeSlide: 0,
  independentCuts: false,
};

export const DEFAULT_THEME: ThemeState = {
  app: "dark",
  igFrame: "light",
  device: "mobile",
};
