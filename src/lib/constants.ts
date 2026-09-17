import type {
  ContentTypeKey,
  CreatingFor,
  LengthKey,
  Platform,
  RefineActionKey,
  ToneKey,
} from "./types";

export const APP_NAME = "Ideako";
export const APP_TAGLINE = "Your AI creative partner";
export const CONTACT_URL = "https://www.linkedin.com/in/goutham-g-98a0ba253/";

/** Who makes Ideako. Details mirror the portfolio at 1goutham.space. */
export const AUTHOR = {
  name: "Goutham G",
  handle: "1Goutham",
  site: "https://1goutham.space",
  linkedin: CONTACT_URL,
  github: "https://github.com/1Goutham",
  instagram: "https://www.instagram.com/tanger.ineee/",
  email: "gouthamgopinath.tsi@gmail.com",
} as const;

export const PLATFORMS: Record<
  Platform,
  { label: string; available: boolean; maxChars: number; foldChars: number }
> = {
  linkedin: { label: "LinkedIn", available: true, maxChars: 3000, foldChars: 210 },
  x: { label: "X", available: false, maxChars: 280, foldChars: 280 },
  instagram: { label: "Instagram", available: false, maxChars: 2200, foldChars: 125 },
};

export const CREATING_FOR: { key: CreatingFor; label: string; hint: string }[] = [
  { key: "myself", label: "Myself", hint: "Personal posts under your own name and story." },
  { key: "company", label: "My company", hint: "Posts on behalf of the company you work for." },
  { key: "brand", label: "A brand / team", hint: "Content for a brand, a client or a team you run." },
];

export const TONES: { key: ToneKey; label: string; hint: string }[] = [
  { key: "professional", label: "Professional", hint: "Polished, credible, measured." },
  { key: "friendly", label: "Friendly", hint: "Warm and approachable." },
  { key: "bold", label: "Bold", hint: "Direct, opinionated, confident." },
  { key: "educational", label: "Educational", hint: "Explains clearly, teaches something." },
  { key: "conversational", label: "Conversational", hint: "Sounds like talking to a peer." },
  { key: "storytelling", label: "Storytelling", hint: "Narrative-led, with a beginning and an end." },
  { key: "technical", label: "Technical", hint: "Precise, comfortable with detail." },
  { key: "minimal", label: "Minimal", hint: "Few words, lots of white space." },
];

export const CONTENT_TYPES: { key: ContentTypeKey; label: string; guidance: string }[] = [
  {
    key: "thought-leadership",
    label: "Thought leadership",
    guidance: "Take a clear position on the topic. Share a perspective the reader wouldn't get elsewhere.",
  },
  {
    key: "educational",
    label: "Educational",
    guidance: "Teach one thing well. Make it concrete and actionable; the reader should learn something they can use.",
  },
  {
    key: "personal-story",
    label: "Personal story",
    guidance: "Tell a first-person story with a specific moment, a turn, and what it changed. Keep it honest, not performative.",
  },
  {
    key: "announcement",
    label: "Product / announcement",
    guidance: "Announce something. Lead with why it matters to the reader before what it is. Keep hype low and clarity high.",
  },
  {
    key: "hiring",
    label: "Hiring",
    guidance: "Describe the role and the team as a human would. Explain what the work is really like and who would enjoy it.",
  },
  {
    key: "case-study",
    label: "Case study",
    guidance: "Show a problem, what was done, and the outcome with specifics. Give credit and avoid overclaiming.",
  },
  {
    key: "industry-insight",
    label: "Industry insight",
    guidance: "Observe something happening in the industry and explain what it means. Connect it to a practical implication.",
  },
];

export const LENGTHS: { key: LengthKey; label: string; words: string; guidance: string }[] = [
  { key: "short", label: "Short", words: "60–100 words", guidance: "Roughly 60 to 100 words." },
  { key: "medium", label: "Medium", words: "120–180 words", guidance: "Roughly 120 to 180 words." },
  { key: "long", label: "Long", words: "200–300 words", guidance: "Roughly 200 to 300 words." },
];

export const REFINE_ACTIONS: { key: RefineActionKey; label: string; instruction: string }[] = [
  { key: "rewrite", label: "Rewrite", instruction: "Rewrite the post with a fresh angle and structure while keeping the same message, voice and approximate length." },
  { key: "shorten", label: "Shorten", instruction: "Cut the post to roughly two thirds of its length. Remove anything that doesn't earn its place. Keep the hook and the point." },
  { key: "expand", label: "Expand", instruction: "Expand the post by adding one concrete example or detail that strengthens the point. Do not pad." },
  { key: "conversational", label: "More conversational", instruction: "Make the post more conversational: shorter sentences, plainer words, as if speaking to one person." },
  { key: "professional", label: "More professional", instruction: "Make the post more professional and measured without making it stiff or corporate." },
  { key: "hook", label: "Improve the hook", instruction: "Rewrite only the opening one or two lines so they are more specific and harder to scroll past. Keep the rest as is." },
  { key: "storytelling", label: "Add storytelling", instruction: "Reshape the post around a small, specific story or moment that illustrates the point." },
  { key: "simplify", label: "Simplify", instruction: "Simplify the language and structure so a busy reader gets the point in one pass. Remove jargon." },
];

export const INDUSTRIES = [
  "Software & SaaS",
  "AI & Machine Learning",
  "Design",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Consulting",
  "E-commerce",
  "Manufacturing",
  "Media",
  "Non-profit",
  "Real estate",
  "Recruiting & HR",
];

/** Text-like files we can read in the browser without extra parsers. */
export const ACCEPTED_TEXT_FILES = ".txt,.md,.markdown,.csv,.json,text/plain,text/markdown";
export const MAX_UPLOAD_BYTES = 200 * 1024;
export const MAX_HISTORY = 100;
