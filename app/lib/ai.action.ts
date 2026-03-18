import puter from "@heyputer/puter.js";
import { PUTER_WORKER_URL, ROOMIFY_RENDER_PROMPT } from "~/lib/constants";

export const generate3DView = async ({ sourceImage, projectId = null }: Generate3DViewParams): Promise<RenderCompletePayload> => {
    if(!PUTER_WORKER_URL) {
        throw new Error("Missing VITE_PUTER_WORKER_URL");
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/ai/render`, {
            method: 'POST',
            body: JSON.stringify({
                image: sourceImage,
                prompt: ROOMIFY_RENDER_PROMPT,
                projectId
            })
        });

        if(!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to generate 3D view: ${errorText}`);
        }

        const data = await response.json();
        return {
            renderedImage: data.renderedImage,
            renderedPath: data.renderedPath
        };
    } catch (error) {
        console.error("Error in generate3DView:", error);
        throw error;
    }
}
