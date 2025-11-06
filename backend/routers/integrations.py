from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
import logging

from backend.models.knowledge import (
    Knowledges,
    KnowledgeForm,
    KnowledgeResponse,
    KnowledgeUserResponse,
)
from backend.models.files import Files, FileModel, FileMetadataResponse
from backend.retrieval.vector.factory import VECTOR_DB_CLIENT
from backend.routers.retrieval import (
    process_file,
    ProcessFileForm,
    process_files_batch,
    BatchProcessFilesForm,
)
from backend.storage.provider import Storage

from backend.constants import ERROR_MESSAGES
from backend.utils.auth import get_verified_user
from backend.utils.access_control import has_access, has_permission


from backend.env import SRC_LOG_LEVELS
from backend.config import BYPASS_ADMIN_ACCESS_CONTROL
from backend.models.models import Models, ModelForm


log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["INTEGRATIONS"])

router = APIRouter()