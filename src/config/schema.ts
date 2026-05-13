import { z } from "zod";

export const targetSelectorSchema = z
  .object({
    targetId: z.string().min(1).optional(),
    workspaceAlias: z.string().min(1).optional(),
    workspacePath: z.string().min(1).optional(),
    titleContains: z.string().min(1).optional(),
    port: z.number().int().min(1).max(65535).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.targetId || value.workspaceAlias || value.workspacePath || value.titleContains),
    "target selector must include one of targetId, workspaceAlias, workspacePath, or titleContains",
  );

const aliasEntrySchema = z
  .object({
    workspacePath: z.string().min(1),
    titleContains: z.string().min(1).optional(),
  })
  .strict();

export const bridgeConfigSchema = z
  .object({
    defaultPort: z.number().int().min(1).max(65535).default(9222),
    aliases: z.record(z.string(), aliasEntrySchema).default({}),
    safety: z
      .object({
        allowSelfControl: z.boolean().default(false),
        confirmationActions: z
          .object({
            allowAcceptForLowRisk: z.boolean().default(true),
            allowAcceptForMediumRisk: z.boolean().default(false),
            allowAcceptForHighRisk: z.boolean().default(false),
          })
          .default({
            allowAcceptForLowRisk: true,
            allowAcceptForMediumRisk: false,
            allowAcceptForHighRisk: false,
          }),
      })
      .default({
        allowSelfControl: false,
        confirmationActions: {
          allowAcceptForLowRisk: true,
          allowAcceptForMediumRisk: false,
          allowAcceptForHighRisk: false,
        },
      }),
  })
  .default({
    defaultPort: 9222,
    aliases: {},
    safety: {
      allowSelfControl: false,
      confirmationActions: {
        allowAcceptForLowRisk: true,
        allowAcceptForMediumRisk: false,
        allowAcceptForHighRisk: false,
      },
    },
  });

export type TargetSelectorInput = z.infer<typeof targetSelectorSchema>;
export type BridgeConfig = z.infer<typeof bridgeConfigSchema>;
