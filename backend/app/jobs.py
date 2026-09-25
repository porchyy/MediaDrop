import json
import shutil
import time
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


@dataclass
class Job:
    job_id: str
    file_id: str
    url: str
    format: str
    quality: str
    status: str = "queued"  # queued, downloading, processing, ready, failed, cancelled, expired
    progress: float | None = None
    downloaded_bytes: int = 0
    total_bytes: int | None = None
    file_size: int | None = None
    filename: str | None = None
    file_path: str | None = None
    created_at: float = 0.0
    error: str | None = None
    error_code: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Job":
        return cls(**data)


class JobManager:
    def __init__(self, storage_dir: Path | str | None = None):
        if storage_dir is None:
            self.storage_dir = Path(__file__).resolve().parent.parent / "storage" / "jobs"
        else:
            self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._jobs: dict[str, Job] = {}
        self._file_id_map: dict[str, str] = {}  # file_id -> job_id
        self._cancellation_tokens: dict[str, bool] = {}  # job_id -> is_cancelled

    def create_job(self, url: str, format: str, quality: str) -> Job:
        job_id = uuid.uuid4().hex[:12]
        file_id = uuid.uuid4().hex
        job = Job(
            job_id=job_id,
            file_id=file_id,
            url=url,
            format=format,
            quality=quality,
            status="queued",
            created_at=time.time(),
        )
        self._jobs[job_id] = job
        self._file_id_map[file_id] = job_id
        self._save_metadata(job)
        return job

    def get_job(self, job_id: str) -> Job | None:
        if job_id in self._jobs:
            return self._jobs[job_id]
        # Attempt to load from disk if present
        meta_file = self.storage_dir / job_id / "metadata.json"
        if meta_file.exists():
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                job = Job.from_dict(data)
                self._jobs[job_id] = job
                self._file_id_map[job.file_id] = job_id
                return job
            except Exception:
                pass
        return None

    def get_job_by_file_id(self, file_id: str) -> Job | None:
        job_id = self._file_id_map.get(file_id)
        if job_id:
            return self.get_job(job_id)
        # Search metadata files if not cached in memory
        for meta_file in self.storage_dir.glob("*/metadata.json"):
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                if data.get("file_id") == file_id:
                    job = Job.from_dict(data)
                    self._jobs[job.job_id] = job
                    self._file_id_map[file_id] = job.job_id
                    return job
            except Exception:
                continue
        return None

    def update_job(self, job_id: str, **kwargs: Any) -> Job | None:
        job = self.get_job(job_id)
        if not job:
            return None
        for key, value in kwargs.items():
            if hasattr(job, key):
                setattr(job, key, value)
        self._save_metadata(job)
        return job

    def cancel_job(self, job_id: str) -> bool:
        job = self.get_job(job_id)
        if not job:
            return False
        self._cancellation_tokens[job_id] = True
        job.status = "cancelled"
        self._save_metadata(job)

        # Remove any partial or downloaded files in job directory
        job_dir = self.storage_dir / job_id
        if job_dir.exists():
            for item in job_dir.iterdir():
                if item.name != "metadata.json":
                    try:
                        if item.is_file():
                            item.unlink()
                        elif item.is_dir():
                            shutil.rmtree(item)
                    except Exception:
                        pass
        return True

    def is_cancelled(self, job_id: str) -> bool:
        return self._cancellation_tokens.get(job_id, False)

    def cleanup_expired_jobs(self, ttl_seconds: float = 1800.0) -> int:
        now = time.time()
        removed_count = 0
        if not self.storage_dir.exists():
            return 0

        for job_dir in list(self.storage_dir.iterdir()):
            if not job_dir.is_dir():
                continue
            meta_file = job_dir / "metadata.json"
            expired = False
            job_id = job_dir.name
            if meta_file.exists():
                try:
                    data = json.loads(meta_file.read_text(encoding="utf-8"))
                    created_at = data.get("created_at", 0)
                    if now - created_at > ttl_seconds:
                        expired = True
                        file_id = data.get("file_id")
                        if file_id and file_id in self._file_id_map:
                            del self._file_id_map[file_id]
                except Exception:
                    expired = True
            else:
                # Directory without metadata older than TTL
                try:
                    if now - job_dir.stat().st_mtime > ttl_seconds:
                        expired = True
                except Exception:
                    pass

            if expired:
                try:
                    shutil.rmtree(job_dir, ignore_errors=True)
                    if job_id in self._jobs:
                        del self._jobs[job_id]
                    if job_id in self._cancellation_tokens:
                        del self._cancellation_tokens[job_id]
                    removed_count += 1
                except Exception:
                    pass
        return removed_count

    def _save_metadata(self, job: Job) -> None:
        job_dir = self.storage_dir / job.job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        meta_file = job_dir / "metadata.json"
        meta_file.write_text(json.dumps(job.to_dict(), indent=2), encoding="utf-8")


job_manager = JobManager()
