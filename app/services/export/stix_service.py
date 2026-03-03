"""
STIX 2.1 Export Service
Translates Aegis-G Threat Intelligence into the OASIS STIX 2.1 International Standard
for NCIJTF, Splunk, Sentinel, and federal SIEM interoperability.
"""
import hashlib
from datetime import datetime
from stix2 import Bundle, Indicator, Sighting, Report, Identity


class STIXService:
    """
    Translates Aegis-G Threat Intelligence into the
    OASIS STIX 2.1 International Standard.
    """

    @staticmethod
    def generate_threat_bundle(threat, aegis_report) -> str:
        # 1. Define the Identity (Aegis-G System)
        aegis_identity = Identity(
            name="Aegis-G Defense Grid",
            identity_class="system",
            description="Automated Cognitive Defense Platform"
        )

        # 2. Resolve content hash (STIX pattern requires valid 64-char SHA-256 hex)
        content_hash = threat.content_hash
        if not content_hash or len(str(content_hash)) != 64:
            if threat.content:
                content_hash = hashlib.sha256(threat.content.encode()).hexdigest()
            else:
                content_hash = hashlib.sha256(f"{threat.id}{threat.timestamp or ''}".encode()).hexdigest()

        # 3. Normalize timestamps for STIX (library accepts datetime)
        valid_from = threat.timestamp or datetime.utcnow()

        # 4. Create an Indicator (The "What" to look for)
        indicator = Indicator(
            name=f"Malign AI Content: {threat.id}",
            description=f"AI-Generated Narrative detected via {threat.detected_by or 'gemini'}",
            indicator_types=["malicious-activity"],
            pattern=f"[file:hashes.'SHA-256' = '{content_hash}']",
            pattern_type="stix",
            valid_from=valid_from,
            confidence=min(100, max(0, int((threat.risk_score or 0) * 100)))
        )

        # 5. Create a Sighting (The "Where" it was seen)
        last_seen = threat.timestamp or datetime.utcnow()

        sighting = Sighting(
            sighting_of_ref=indicator.id,
            where_sighted_refs=[aegis_identity.id],
            last_seen=last_seen,
            description=f"Detected on platform: {threat.source_platform or 'unknown'}"
        )

        # 6. Create the Final Report
        report_summary = "No summary available"
        if aegis_report and aegis_report.gemini_summary:
            report_summary = aegis_report.gemini_summary

        stix_report = Report(
            name=f"Intelligence Brief: {threat.id}",
            description=report_summary,
            published=datetime.utcnow(),
            object_refs=[indicator.id, sighting.id, aegis_identity.id],
            labels=["disinformation", "llm-misuse"]
        )

        # 7. Package everything into a Bundle
        bundle = Bundle(objects=[aegis_identity, indicator, sighting, stix_report])
        return bundle.serialize(pretty=True)


stix_service = STIXService()
