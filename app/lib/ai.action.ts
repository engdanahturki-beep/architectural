import puter from "@heyputer/puter.js";
import {ROOMIFY_RENDER_PROMPT} from "./constants";

export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
    const dataUrl = sourceImage.startsWith('data:')
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    const base64Data = dataUrl.split(',')[1];
    const mimeType = dataUrl.split(';')[0].split(':')[1];

    if(!mimeType || !base64Data) throw new Error('Invalid source image payload');

    console.log('Generating 3D view with OpenAI...', { mimeType, base64Length: base64Data.length });
    let response;
    try {
        response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
            provider: "openai",
            model: "dall-e-3",
            input_image: base64Data,
            input_image_mime_type: mimeType,
        });
        console.log('Puter AI response received:', response);
    } catch (err) {
        console.error('Puter SDK txt2img error:', err);
        throw err;
    }

    let rawImageUrl: string | null = null;
    if (response instanceof HTMLImageElement) {
        rawImageUrl = response.src;
    } else if (typeof response === 'object' && response !== null && 'src' in response) {
        rawImageUrl = (response as any).src;
    } else if (typeof response === 'string') {
        rawImageUrl = response;
    }

    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    const renderedImage = rawImageUrl.startsWith('data:')
        ? rawImageUrl : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}