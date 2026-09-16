import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

interface Env {
  APPS_SCRIPT_URL: string;
  APPS_SCRIPT_SECRET: string;
}

function createServer(env: Env) {
  const server = new McpServer({
    name: "Property Outreach MCP",
    version: "1.0.0",
  });

  server.registerTool(
    "add_property_lead",
    {
      description:
        "Adds a researched property prospect to the Property Sheet Google Sheet. Use only legitimate public business contact information.",
      inputSchema: {
        country: z.string(),
        state: z.string(),
        cityArea: z.string(),
        propertyType: z.string(),
        propertyName: z.string(),
        email: z.string(),
        emailStatus: z.string(),
        instagram: z.string().optional(),
        instagramLink: z.string().optional(),
        reply: z.string().optional(),
        replyType: z.string().optional(),
        followUpStatus: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    async (data) => {
      try {
         if (!env.APPS_SCRIPT_URL) {
      throw new Error("APPS_SCRIPT_URL is missing from Cloudflare runtime");
    }

    if (!env.APPS_SCRIPT_SECRET) {
      throw new Error("APPS_SCRIPT_SECRET is missing from Cloudflare runtime");
    }

    try {
      new URL(env.APPS_SCRIPT_URL);
    } catch {
      throw new Error("APPS_SCRIPT_URL is not a valid URL");
    }

    const response = await fetch(env.APPS_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: env.APPS_SCRIPT_SECRET,
            country: data.country,
            state: data.state,
            cityArea: data.cityArea,
            propertyType: data.propertyType,
            propertyName: data.propertyName,
            email: data.email,
            emailStatus: data.emailStatus,
            instagram: data.instagram ?? "Not Found",
            instagramLink: data.instagramLink ?? "",
            reply: data.reply ?? "",
            replyType: data.replyType ?? "",
            followUpStatus: data.followUpStatus ?? "Not Contacted",
            notes: data.notes ?? "",
          }),
        });

        const result = await response.text();

        if (!response.ok) {
          throw new Error(`Apps Script returned HTTP ${response.status}`);
        }

        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to add lead: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

export default {
  fetch(request, env, ctx) {
    return createMcpHandler(() => createServer(env))(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
