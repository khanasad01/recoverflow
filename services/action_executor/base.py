from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from database.models import RevenueOpportunity, Intervention


class ActionAdapter(ABC):
    """Abstract base class for all recovery action adapters."""

    @abstractmethod
    def execute(
        self,
        opportunity: RevenueOpportunity,
        intervention: Intervention,
        db: Session
    ) -> Dict[str, Any]:
        """
        Execute the action for the given opportunity and intervention.
        Must return a dict with format:
        {'success': bool, 'external_ref': Optional[str], 'payload': dict}
        """
        pass
