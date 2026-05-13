import { z } from "zod";

export const toolTargetSelectorSchema = z
  .object({
    targetId: z.string().min(1).optional(),
    workspaceAlias: z.string().min(1).optional(),
    workspacePath: z.string().min(1).optional(),
    titleContains: z.string().min(1).optional(),
    port: z.number().int().min(1).max(65535).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.targetId || value.workspaceAlias || value.workspacePath || value.titleContains),
    "target selector must include targetId, workspaceAlias, workspacePath, or titleContains",
  );

export function jsonContent(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}
