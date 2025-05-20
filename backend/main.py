from __future__ import annotations

import concurrent.futures as fut
import json, os, uuid, threading, logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from flask import Flask, Response, jsonify, request, url_for
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Local import for emotion detection
from emotion_detector import EmotionDetector, EmotionDetectorSettings

"""
Video Emotion Analysis Backend
------------------------------
Flask-based REST API for handling video uploads and emotion analysis requests.
Provides endpoints for file upload, analysis submission, and result retrieval.

Created for Bachelor Thesis at CTU FEL
Author: Jan Sadílek
"""

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("emotion-backend")

@dataclass(frozen=True)
class BackendSettings:
    upload_dir: Path = Path("temp_uploads")
    allowed_ext: tuple[str, ...] = ("mp4", "mov", "avi", "webm")
    frame_interval: int = 10
    workers: int = os.cpu_count() or 2

# Initialize server settings
backend_settings = BackendSettings()
backend_settings.upload_dir.mkdir(parents=True, exist_ok=True)

# Initialize the emotion detector
detector = EmotionDetector()

# Job management
_job_pool = fut.ThreadPoolExecutor(max_workers=backend_settings.workers)
_job_lock = threading.Lock()
_job_results: Dict[str, Any] = {}

def _allowed_file(name: str) -> bool:
    """Validate if the file has an allowed extension."""
    return "." in name and name.rsplit(".", 1)[1].lower() in backend_settings.allowed_ext

def _run(video_path: str, interval: int, job_id: str) -> None:
    """
    Execute emotion analysis on a video in a separate thread.
    
    Args:
        video_path: Path to the video file
        interval: Frame interval for analysis
        job_id: Unique identifier for this job
    """
    try:
        # Perform the emotion analysis
        results = detector.analyze_video(video_path, interval)
        status = "done"
    except Exception as e:
        results = {"error": str(e)}
        status = "error"
        log.error(f"Job {job_id} failed: {e}")
    
    with _job_lock:
        _job_results[job_id] = {"status": status, "data": results}

# Initialize Flask application
app = Flask(__name__)
CORS(app)

@app.route("/uploadVideo", methods=["POST"])
def upload_video():
    """
    Endpoint for video file uploads.
    
    Returns:
        JSON response with the saved filename or error message
    """
    if "file" not in request.files:
        return jsonify(error="missing file"), 400
    
    f = request.files["file"]
    if f.filename == "":
        return jsonify(error="empty filename"), 400
    
    if not _allowed_file(f.filename):
        return jsonify(error="filetype not allowed"), 400
    
    # Generate unique filename and save the file
    ext = f.filename.rsplit(".", 1)[1].lower()
    name = secure_filename(f"{uuid.uuid4()}.{ext}")
    dest = backend_settings.upload_dir / name
    f.save(str(dest))

    return jsonify(filename=name), 201

@app.route("/analyzeVideo", methods=["POST"])
def analyze_video():
    """
    Endpoint to start video analysis.
    Accepts a JSON payload with the video filename and optional parameters.
    
    Returns:
        Response with job ID and status URL
    """
    if not request.is_json:
        return jsonify(error="json required"), 400
        
    data = request.get_json()
    video = data.get("video_filename")
    
    if not video:
        return jsonify(error="missing filename"), 400
        
    # Locate the video file
    path = backend_settings.upload_dir / secure_filename(video)
    if not path.is_file():
        return jsonify(error="file not found"), 404
        
    # Get frame interval parameter or use default
    interval = int(data.get("frame_interval", backend_settings.frame_interval))
    
    job_id = uuid.uuid4().hex

    with _job_lock:
        _job_results[job_id] = {"status": "queued", "data": None}
    
    _job_pool.submit(_run, str(path), interval, job_id)
    
    # Generate status URL
    url = url_for("job_status", job_id=job_id, _external=True)
    
    return Response(
        status=202,
        headers={"Location": url},
        response=json.dumps({"job_id": job_id, "status_url": url})
    )

@app.route("/jobs/<job_id>", methods=["GET"])
def job_status(job_id: str):
    """
    Endpoint to check the status of a submitted job.
    
    Args:
        job_id: Unique identifier of the job
        
    Returns:
        JSON response with job status and results if available
    """
    with _job_lock:
        info = _job_results.get(job_id)

    if not info:
        return jsonify(error="job not found"), 404
    
    return jsonify(job_id=job_id, **info)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
