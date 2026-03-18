import React, { useRef, useState } from "react";
import { Upload as UploadIcon, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Button from "../../ui/Button";

const Upload: React.FC<UploadProps> = ({ onComplete, className = "" }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG)');
            setStatus('error');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size should be less than 10MB');
            setStatus('error');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setStatus('idle');

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setPreview(null);
        setStatus('idle');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!preview) return;

        setStatus('uploading');
        try {
            const success = await onComplete(preview);
            if (success !== false) {
                setStatus('success');
            } else {
                setStatus('error');
                setError('Failed to process image');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setError('An error occurred during upload');
        }
    };

    return (
        <div 
            className={`upload-container ${className}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
            />

            {!preview ? (
                <div 
                    className="upload-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="upload-icon-wrapper">
                        <UploadIcon className="icon" />
                    </div>
                    <p className="upload-text">
                        Click to upload or drag and drop
                    </p>
                    <p className="upload-hint">
                        PNG, JPG up to 10MB
                    </p>
                </div>
            ) : (
                <div className="upload-preview-container">
                    <div className="preview-image-wrapper">
                        <img src={preview} alt="Preview" className="preview-image" />
                        {status !== 'uploading' && (
                            <button className="remove-btn" onClick={handleRemove}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="upload-actions">
                        {status === 'idle' && (
                            <Button onClick={handleUpload} fullWidth>
                                Process Image
                            </Button>
                        )}
                        
                        {status === 'uploading' && (
                            <Button disabled fullWidth>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Processing...
                            </Button>
                        )}

                        {status === 'success' && (
                            <div className="status-message success">
                                <CheckCircle2 size={18} />
                                <span>Uploaded successfully!</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="error-container">
                                <div className="status-message error">
                                    <AlertCircle size={18} />
                                    <span>{error || 'Upload failed'}</span>
                                </div>
                                <Button onClick={handleUpload} variant="outline" size="sm">
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;
