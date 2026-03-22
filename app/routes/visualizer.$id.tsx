import { useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "~/lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "~/ui/Button";
import {createProject, getProjectById} from "~/lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>()

    const state = location.state as VisualizerLocationState;

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    const handleBack = () => navigate('/');
    const handleExport = () => {
        if (!currentImage) return;

        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `roomify-${id || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const runGeneration = async (item: DesignItem) => {
        if(!id || !item.sourceImage) {
            console.warn('runGeneration aborted: missing id or sourceImage', { id, sourceImage: !!item.sourceImage });
            return;
        }

        try {
            console.log('runGeneration started for item:', item.id);
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: item.sourceImage });
            console.log('generate3DView result:', { hasRenderedImage: !!result.renderedImage });

            if(result.renderedImage) {
                console.log('Generation success, updating state...');
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                console.log('Saving project to Puter...', updatedItem);
                const saved = await createProject({ item: updatedItem, visibility: "private" })

                if(saved) {
                    console.log('Project saved successfully:', saved);
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                } else {
                    console.warn('Project save returned null, using generated image in UI.');
                }
            } else {
                console.warn('Generation returned no image.');
                alert('Generation failed: No image was returned by the AI.');
            }
        } catch (error) {
            console.error('Generation failed: ', error)
            alert(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                console.warn('loadProject: no id provided');
                setIsProjectLoading(false);
                return;
            }

            console.log('loadProject: fetching project by id', id);
            setIsProjectLoading(true);

            let fetchedProject = await getProjectById({ id });
            console.log('loadProject: fetchedProject', fetchedProject);

            if (!fetchedProject && state?.initialImage) {
                console.log('loadProject: project not found on server, using location state');
                fetchedProject = {
                    id: id as string,
                    name: state.name || `Residence ${id}`,
                    sourceImage: state.initialImage,
                    renderedImage: state.initialRender || null,
                    timestamp: Date.now(),
                    ownerId: state.ownerId || userId || null,
                };
            }

            if (!isMounted) {
                console.log('loadProject: component unmounted, ignoring result');
                return;
            }

            setProject(fetchedProject);
            setCurrentImage(fetchedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;

            if (!fetchedProject) {
                console.warn('loadProject: no project found and no state available');
                alert('Project not found. Please try uploading again.');
                navigate('/');
            }
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        console.log('Effect [project, isProjectLoading] triggered:', { 
            isProjectLoading, 
            hasInitialGenerated: hasInitialGenerated.current, 
            hasSourceImage: !!project?.sourceImage,
            hasRenderedImage: !!project?.renderedImage
        });
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            console.log('Project already has rendered image, skipping generation.');
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        console.log('Triggering runGeneration...');
        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />

                    <span className="name">Roomify</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            {!currentImage && !isProcessing && (
                                <Button
                                    size="sm"
                                    onClick={() => project && runGeneration(project)}
                                    className="retry"
                                >
                                    <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing': ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {project?.sourceImage && currentImage ? (
                            <ReactCompareSlider
                                defaultValue={50}
                                style={{ width: '100%', height: 'auto' }}
                                itemOne={
                                    <ReactCompareSliderImage src={project?.sourceImage} alt="before" className="compare-img" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={currentImage || project?.renderedImage} alt="after" className="compare-img" />
                                }
                            />
                        ) : (
                            <div className="compare-fallback">
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt="Before" className="compare-img" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
export default VisualizerId