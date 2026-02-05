"""
File Upload / Storage Service
Abstract storage layer supporting local and cloud storage
"""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Configuration
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")  # local or gcs
LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "storage")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", None)


class StorageService:
    """Abstract storage service"""
    
    def __init__(self):
        self.backend = STORAGE_BACKEND
        
        if self.backend == "local":
            # Create local storage directory
            self.storage_path = Path(LOCAL_STORAGE_PATH)
            self.storage_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"📁 Local storage initialized: {self.storage_path}")
        
        elif self.backend == "gcs":
            # Initialize Google Cloud Storage
            try:
                from google.cloud import storage as gcs_storage
                self.gcs_client = gcs_storage.Client()
                self.bucket = self.gcs_client.bucket(GCS_BUCKET_NAME)
                logger.info(f"☁️  GCS storage initialized: {GCS_BUCKET_NAME}")
            except Exception as e:
                logger.error(f"Failed to initialize GCS: {e}")
                # Fallback to local
                self.backend = "local"
                self.storage_path = Path(LOCAL_STORAGE_PATH)
                self.storage_path.mkdir(parents=True, exist_ok=True)
    
    async def upload_file(
        self,
        file: UploadFile,
        folder: str = "uploads",
        filename: Optional[str] = None
    ) -> dict:
        """
        Upload file to storage
        
        Args:
            file: FastAPI UploadFile
            folder: Subdirectory/folder name
            filename: Optional custom filename (will generate UUID if not provided)
        
        Returns:
            dict with file_id, filename, url, size
        """
        # Generate filename
        if not filename:
            extension = Path(file.filename).suffix
            filename = f"{uuid.uuid4()}{extension}"
        
        file_path = f"{folder}/{filename}"
        
        # Get file size
        contents = await file.read()
        file_size = len(contents)
        
        # Upload based on backend
        if self.backend == "local":
            url = await self._upload_local(contents, file_path)
        elif self.backend == "gcs":
            url = await self._upload_gcs(contents, file_path)
        else:
            raise ValueError(f"Unknown storage backend: {self.backend}")
        
        return {
            "file_id": filename,
            "filename": file.filename,
            "path": file_path,
            "url": url,
            "size": file_size,
            "uploaded_at": datetime.utcnow().isoformat()
        }
    
    async def _upload_local(self, contents: bytes, file_path: str) -> str:
        """Upload to local filesystem"""
        full_path = self.storage_path / file_path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, "wb") as f:
            f.write(contents)
        
        return f"/storage/{file_path}"
    
    async def _upload_gcs(self, contents: bytes, file_path: str) -> str:
        """Upload to Google Cloud Storage"""
        blob = self.bucket.blob(file_path)
        blob.upload_from_string(contents)
        return blob.public_url
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage"""
        try:
            if self.backend == "local":
                full_path = self.storage_path / file_path
                if full_path.exists():
                    full_path.unlink()
            elif self.backend == "gcs":
                blob = self.bucket.blob(file_path)
                blob.delete()
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {e}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """Get URL for accessing file"""
        if self.backend == "local":
            return f"/storage/{file_path}"
        elif self.backend == "gcs":
            blob = self.bucket.blob(file_path)
            return blob.public_url
        return ""


# Global storage instance
storage = StorageService()

