import tempfile
import time
import unittest
from pathlib import Path

from app.jobs import JobManager


class JobsTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.storage_path = Path(self.temp_dir.name)
        self.manager = JobManager(storage_dir=self.storage_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_create_and_get_job(self):
        job = self.manager.create_job(url="https://example.com/video.mp4", format="video", quality="Best")
        self.assertIsNotNone(job.job_id)
        self.assertIsNotNone(job.file_id)
        self.assertEqual(job.status, "queued")

        fetched = self.manager.get_job(job.job_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.job_id, job.job_id)
        self.assertEqual(fetched.file_id, job.file_id)

    def test_get_by_file_id(self):
        job = self.manager.create_job(url="https://example.com/audio.mp3", format="audio", quality="192 kbps")
        fetched = self.manager.get_job_by_file_id(job.file_id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.job_id, job.job_id)

    def test_update_job_status_and_metadata(self):
        job = self.manager.create_job(url="https://example.com/test.jpg", format="image", quality="Original")
        self.manager.update_job(job.job_id, status="ready", file_size=1024, filename="test.jpg")

        updated = self.manager.get_job(job.job_id)
        self.assertEqual(updated.status, "ready")
        self.assertEqual(updated.file_size, 1024)
        self.assertEqual(updated.filename, "test.jpg")

        # Verify metadata.json was saved on disk
        meta_path = self.storage_path / job.job_id / "metadata.json"
        self.assertTrue(meta_path.exists())

    def test_cancel_job(self):
        job = self.manager.create_job(url="https://example.com/test.mp4", format="video", quality="720p")
        success = self.manager.cancel_job(job.job_id)
        self.assertTrue(success)

        cancelled = self.manager.get_job(job.job_id)
        self.assertEqual(cancelled.status, "cancelled")

    def test_cleanup_expired_jobs(self):
        job = self.manager.create_job(url="https://example.com/test.mp4", format="video", quality="720p")
        # Artificially age the job
        job_dir = self.storage_path / job.job_id
        job.created_at = time.time() - 3600  # 1 hour ago
        self.manager._save_metadata(job)

        removed_count = self.manager.cleanup_expired_jobs(ttl_seconds=1800)  # 30 mins TTL
        self.assertEqual(removed_count, 1)
        self.assertFalse(job_dir.exists())
        self.assertIsNone(self.manager.get_job(job.job_id))


if __name__ == "__main__":
    unittest.main()
