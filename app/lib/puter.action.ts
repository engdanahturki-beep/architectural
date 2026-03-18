import puter from "@heyputer/puter.js";
// import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
// import {isHostedUrl} from "./utils";

import { PUTER_WORKER_URL } from "~/lib/constants";

const isHostedUrl = (url: string) => {
    if(!url) return false;
    return url.startsWith('http') || url.startsWith('https') || url.startsWith('puter://');
};

export const signIn = async () => {
    try {
        console.log("Calling puter.auth.signIn()...");
        const result = await puter.auth.signIn();
        console.log("puter.auth.signIn() result:", result);
        return result;
    } catch (e) {
        console.error("Puter sign in error in puter.action.ts:", e);
        throw e;
    }
};

export const signOut = async () => {
    try {
        console.log("Calling puter.auth.signOut()...");
        const result = await puter.auth.signOut();
        console.log("puter.auth.signOut() result:", result);
        return result;
    } catch (e) {
        console.error("Puter sign out error in puter.action.ts:", e);
    }
};

export const getCurrentUser = async () => {
    try {
        console.log("Calling puter.auth.getUser()...");
        const user = await puter.auth.getUser();
        console.log("Puter getUser response:", user);
        return user;
    } catch (e) {
        console.error("Puter getUser error in puter.action.ts:", e);
        return null;
    }
}

export const isSignedIn = () => {
    const signedIn = puter.auth.isSignedIn();
    console.log("Puter isSignedIn():", signedIn);
    return signedIn;
}

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if(!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return null;
    }
    const projectId = item.id;

    // const hosting = await getOrCreateHostingConfig();

    const hostedSource = null; // projectId ?
        // await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: 'source', }) : null;

    const hostedRender = null; // projectId && item.renderedImage ?
        // await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: 'rendered', }) : null;

    const resolvedSource = (isHostedUrl(item.sourceImage) || item.sourceImage.startsWith('data:image/')
            ? item.sourceImage
            : ''
    );

    if(!resolvedSource) {
        console.warn('Failed to host source image, skipping save.')
        return null;
    }

    const resolvedRender = (item.renderedImage && (isHostedUrl(item.renderedImage) || item.renderedImage.startsWith('data:image/')))
            ? item.renderedImage
            : undefined;

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRender,
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: 'POST',
            body: JSON.stringify({
                project: payload,
                visibility
            })
        });

        if(!response.ok) {
            console.error('failed to save the project', await response.text());
            return null;
        }

        const data = (await response.json()) as { project?: DesignItem | null }

        return data?.project ?? null;
    } catch (e) {
        console.log('Failed to save project', e)
        return null;
    }
}

export const getProjects = async () => {
    if(!PUTER_WORKER_URL) {
        console.warn('Missing VITE_PUTER_WORKER_URL; skip history fetch;');
        return []
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method: 'GET' });

        if(!response.ok) {
            console.error('Failed to fetch history', await response.text());
            return [];
        }

        const data = (await response.json()) as { projects?: DesignItem[] | null };

        return Array.isArray(data?.projects) ? data?.projects : [];
    } catch (e) {
        console.error('Failed to get projects', e);
        return [];
    }
}

export const getProjectById = async ({ id }: { id: string }) => {
    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    console.log("Fetching project with ID:", id);

    try {
        const response = await puter.workers.exec(
            `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        console.log("Fetch project response:", response);

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const data = (await response.json()) as {
            project?: DesignItem | null;
        };

        console.log("Fetched project data:", data);

        return data?.project ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};