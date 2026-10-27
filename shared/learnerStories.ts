import { z } from "zod";

const learnerStoryFieldsSchema = z.object({
  learningLanguage: z.enum(["amharic", "swahili"]),
  displayNameZh: z.string().trim().min(1).max(100),
  displayNameEn: z.string().trim().min(1).max(100),
  quoteZh: z.string().trim().min(1).max(3000),
  quoteEn: z.string().trim().min(1).max(3000),
  contextZh: z.string().trim().max(200),
  contextEn: z.string().trim().max(200),
  privateContact: z.string().trim().max(500),
  consentRecord: z.string().trim().max(3000),
  consentGranted: z.boolean(),
  approved: z.boolean(),
  published: z.boolean(),
}).strict();

function validatePublication(story: z.infer<typeof learnerStoryFieldsSchema>, ctx: z.RefinementCtx) {
  if (story.approved && (!story.consentGranted || !story.consentRecord)) {
    ctx.addIssue({ code: "custom", path: ["approved"], message: "Approval requires recorded permission for both translations and public attribution." });
  }
  if (story.published && !story.approved) {
    ctx.addIssue({ code: "custom", path: ["published"], message: "Only approved stories can be published." });
  }
}

export const learnerStoryInputSchema = learnerStoryFieldsSchema.superRefine(validatePublication);
export const learnerStoryUpdateSchema = learnerStoryFieldsSchema.extend({
  updatedAt: z.string().datetime(),
}).superRefine(validatePublication);

export type LearnerStoryInput = z.infer<typeof learnerStoryInputSchema>;
export type PublicLearnerStory = Pick<LearnerStoryInput,
  "learningLanguage" | "displayNameZh" | "displayNameEn" | "quoteZh" | "quoteEn" | "contextZh" | "contextEn"
> & { id: string };
export type AdminLearnerStory = LearnerStoryInput & { id: string; updatedAt: string };
