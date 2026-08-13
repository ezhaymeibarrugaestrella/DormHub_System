import React, { useState, useRef, useEffect } from "react";
import {
    FaCamera,
    FaRedo,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner,
    FaUserCheck,
    FaSmile
} from "react-icons/fa";

const MODEL_URL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/models`
    : process.env.NODE_ENV === "production"
        ? "/models"
        : `http://${window.location.hostname}:5000/models`;

function FaceCamera({ mode, onSuccess, onError }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);
    const modelsLoadedRef = useRef(false);
    const [status, setStatus] = useState("initializing");
    const [statusText, setStatusText] = useState("Starting camera...");
    const [faceDetected, setFaceDetected] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;
    const startCameraRef = useRef(null);

    const getFaceAPI = async () => {
        if (typeof window !== "undefined" && window.faceapi) {
            return window.faceapi;
        }
        try {
            const mod = await import("@vladmandic/face-api");
            if (typeof window !== "undefined") {
                window.faceapi = mod;
            }
            return mod;
        } catch {
            return window.faceapi || null;
        }
    };

    useEffect(() => {
        let cancelled = false;

        const startFaceDetection = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;

            const detect = async () => {
                try {
                    const faceapi = await getFaceAPI();
                    if (!faceapi || !video || video.readyState < 2) {
                        animFrameRef.current = requestAnimationFrame(detect);
                        return;
                    }

                    const displaySize = { width: video.videoWidth, height: video.videoHeight };
                    faceapi.matchDimensions(canvas, displaySize);

                    const detections = await faceapi
                        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    if (detections.length > 0) {
                        const resized = faceapi.resizeResults(detections, displaySize);
                        faceapi.draw.drawDetections(canvas, resized);
                        faceapi.draw.drawFaceLandmarks(canvas, resized);
                        setFaceDetected(true);
                    } else {
                        setFaceDetected(false);
                    }

                    animFrameRef.current = requestAnimationFrame(detect);
                } catch (err) {
                    console.error("Detection error:", err);
                    animFrameRef.current = requestAnimationFrame(detect);
                }
            };

            animFrameRef.current = requestAnimationFrame(detect);
        };

        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Camera not available. Use HTTPS or localhost, or try fingerprint instead.");
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus("ready");
                setStatusText("Position your face in the frame");
                startFaceDetection();
            } catch (err) {
                console.error("Camera error:", err);
                setStatus("error");
                if (err.name === "NotAllowedError") {
                    setStatusText("Camera access denied. Allow camera permission in your browser settings.");
                } else if (err.name === "NotFoundError") {
                    setStatusText("No camera found on this device.");
                } else {
                    setStatusText(err.message || "Could not access camera");
                }
                if (onErrorRef.current) onErrorRef.current("Camera: " + (err.message || "access failed"));
            }
        };
        startCameraRef.current = startCamera;

        (async () => {
            try {
                const faceapi = await getFaceAPI();
                if (!faceapi || cancelled) {
                    if (!faceapi) throw new Error("Face API not available");
                    return;
                }
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                if (!cancelled) {
                    modelsLoadedRef.current = true;
                    await startCamera();
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Model load error:", err);
                    setStatus("error");
                    setStatusText("Face recognition models unavailable. Use fingerprint instead.");
                    if (onErrorRef.current) onErrorRef.current("Model load failed: " + err.message);
                }
            }
        })();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const handleCapture = async () => {
        const video = videoRef.current;
        const faceapi = await getFaceAPI();
        if (!video || !faceapi) return;

        setStatus("capturing");
        setStatusText("Detecting face...");

        try {
            const detections = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detections) {
                setStatus("ready");
                setStatusText("No face detected. Please look at the camera and try again.");
                return;
            }

            const desc = Array.from(detections.descriptor);

            const captureCanvas = document.createElement("canvas");
            captureCanvas.width = video.videoWidth;
            captureCanvas.height = video.videoHeight;
            captureCanvas.getContext("2d").drawImage(video, 0, 0);
            const imgData = captureCanvas.toDataURL("image/jpeg", 0.8);
            setCapturedImage(imgData);

            cleanup();
            setStatus("success");
            setStatusText(mode === "register" ? "Face captured successfully!" : "Face verified!");

            if (onSuccess) onSuccess(desc, imgData);
        } catch (err) {
            console.error("Capture error:", err);
            setStatus("ready");
            setStatusText("Error detecting face. Please try again.");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setStatus("ready");
        setStatusText("Position your face in the frame");
        if (startCameraRef.current) startCameraRef.current();
    };

    return (
        <div className="text-center">
            <div className="mb-2 d-flex align-items-center justify-content-center gap-2">
                <FaUserCheck size={20} className="text-primary" />
                <h6 className="fw-bold mb-0">
                    {mode === "register" ? "Face Registration" : "Face Verification"}
                </h6>
            </div>

            <div className="position-relative rounded overflow-hidden border mx-auto mb-3"
                style={{ maxWidth: "400px", aspectRatio: "4/3", backgroundColor: "#000" }}>
                {status !== "success" && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: status === "ready" || status === "capturing" ? "block" : "none"
                        }}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    className="position-absolute top-0 start-0"
                    style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                />

                {capturedImage && (
                    <img src={capturedImage} alt="Captured face"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}

                {status === "initializing" && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                        <FaSpinner className="text-white mb-2" size={28} />
                        <span className="text-white small">Loading face recognition...</span>
                    </div>
                )}

                {status === "error" && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                        <FaExclamationTriangle className="text-warning mb-2" size={36} />
                        <span className="text-white small px-3 text-center">{statusText}</span>
                    </div>
                )}

                {status === "ready" && faceDetected && (
                    <div className="position-absolute bottom-0 start-0 w-100 py-1 text-center"
                        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                        <span className="text-white small d-flex align-items-center justify-content-center gap-1">
                            <FaSmile className="text-success" /> Face detected
                        </span>
                    </div>
                )}

                {status === "capturing" && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                        <FaSpinner className="text-white" size={32} />
                    </div>
                )}
            </div>

            <p className="small text-muted mb-2">{statusText}</p>

            <div className="d-flex justify-content-center gap-2 flex-wrap">
                {status === "success" ? (
                    <>
                        <span className="text-success d-flex align-items-center gap-1 small fw-bold">
                            <FaCheckCircle /> {mode === "register" ? "Face Registered" : "Face Verified"}
                        </span>
                        <button className="btn btn-outline-secondary btn-sm" onClick={handleRetake}>
                            <FaRedo className="me-1" /> Retake
                        </button>
                    </>
                ) : status === "error" ? (
                    <button className="btn btn-primary btn-sm" onClick={handleRetake}>
                        <FaRedo className="me-1" /> Try Again
                    </button>
                ) : (
                    <button className="btn btn-primary btn-sm px-4"
                        onClick={handleCapture}
                        disabled={status === "capturing" || !faceDetected}>
                        {status === "capturing" ? (
                            <><FaSpinner className="me-1" /> Capturing...</>
                        ) : (
                            <><FaCamera className="me-1" /> Capture Face</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

export default FaceCamera;
