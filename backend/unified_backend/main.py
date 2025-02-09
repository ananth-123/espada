from fastapi import FastAPI, UploadFile, File, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import chromadb
from chromadb.utils import embedding_functions
from xgboost import XGBClassifier
import joblib
import shap
import tempfile
import logging
from datasets import load_dataset
import os
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Nuclear Plant Management API",
    description="Unified API for predictive maintenance and compliance checking in nuclear facilities",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add API router with prefix
router = APIRouter(prefix="/api")

# Constants
MODEL_NAME = "all-MiniLM-L6-v2"
MODEL_CACHE_DIR = "./model_cache"

# Load pre-trained predictive maintenance models
MODEL = joblib.load('xgb_model.pkl')
SCALER = joblib.load('scaler.pkl')
LABEL_ENCODER = joblib.load('label_encoder.pkl')
FEATURE_NAMES = joblib.load('feature_names.pkl')
explainer = shap.TreeExplainer(MODEL)

# Maintenance suggestion mapping
MAINTENANCE_SUGGESTIONS = {
    "Tool wear [min]": {
        "severity": "High",
        "action": "Immediate tool replacement recommended",
        "reason": "Excessive tool wear is the primary factor contributing to potential failure",
        "instructions": """1. Stop machine operation
2. Replace worn tooling components
3. Perform calibration check
4. Document maintenance in log"""
    },
    "Air temperature [K]": {
        "severity": "Medium",
        "action": "Cooling system inspection needed",
        "reason": "Elevated air temperature detected beyond optimal operating range",
        "instructions": """1. Check coolant levels
2. Inspect ventilation systems
3. Clean heat exchangers
4. Monitor temperature for 24 hours"""
    }
}

# Pydantic Models for Predictive Maintenance
class PredictionInput(BaseModel):
    features: List[float]
    product_id: Optional[str] = None

class PredictionResult(BaseModel):
    product_id: Optional[str]
    failure_probability: float
    criticality_rank: Optional[int]
    maintenance_suggestion: dict
    shap_values: dict

# Pydantic Models and Dataclasses for Compliance
class MaintenanceActionInput(BaseModel):
    id: str
    description: str
    component: str
    proposed_action: str
    timestamp: datetime

@dataclass
class MaintenanceAction:
    id: str
    description: str
    component: str
    proposed_action: str
    timestamp: datetime

@dataclass
class ComplianceRule:
    id: str
    regulation_text: str
    source: str
    category: str
    embeddings: np.ndarray = None

# Predictive Maintenance Functions
def generate_suggestion(shap_values: np.ndarray) -> dict:
    """Generate a personalized maintenance suggestion based on SHAP values."""
    # Get indices sorted by absolute SHAP values in descending order
    sorted_indices = np.argsort(-np.abs(shap_values))
    
    # Iterate over the features in order of importance
    for idx in sorted_indices:
        feature = FEATURE_NAMES[idx]
        if feature in MAINTENANCE_SUGGESTIONS:
            return MAINTENANCE_SUGGESTIONS[feature]
    
    # Fallback default suggestion if no matching feature is found
    return {
        "severity": "Medium",
        "action": "General maintenance inspection recommended",
        "reason": "Multiple factors contributing to potential failure",
        "instructions": "Perform comprehensive system diagnostic"
    }

def add_time_series_features(df: pd.DataFrame, window: int = 5) -> pd.DataFrame:
    """Recreate time-series features from training"""
    df['Torque_RollingMean'] = df['Torque [Nm]'].rolling(window=window, min_periods=1).mean()
    df['RotationalSpeed_Diff'] = df['Rotational speed [rpm]'].diff().fillna(0)
    df['ToolWear_RollingMean'] = df['Tool wear [min]'].rolling(window=window, min_periods=1).mean()
    return df

def validate_input_data(df: pd.DataFrame) -> None:
    """Validate input data to ensure all required columns are present"""
    required_columns = [
        "Air temperature [K]",
        "Process temperature [K]",
        "Rotational speed [rpm]",
        "Torque [Nm]",
        "Type",
        "Tool wear [min]",
        "TWF",
        "HDF",
        "PWF",
        "OSF",
        "RNF"
    ]
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing_columns}")

def process_input_data(df: pd.DataFrame) -> pd.DataFrame:
    """Process input data including feature engineering"""
    validate_input_data(df)
    df['Type'] = LABEL_ENCODER.transform(df['Type'])
    df = add_time_series_features(df)
    product_ids = df['Product ID'].copy() if 'Product ID' in df.columns else None
    if 'Product ID' in df.columns:
        df.drop('Product ID', axis=1, inplace=True)
    df = df[FEATURE_NAMES]
    scaled_data = SCALER.transform(df)
    return scaled_data, product_ids

# Compliance Classes
class NuclearKnowledgeBase:
    def __init__(self, model_name: str = MODEL_NAME):
        try:
            self.embedding_model = SentenceTransformer(model_name, cache_folder=MODEL_CACHE_DIR)
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {e}")
            logger.info("Falling back to paraphrase-MiniLM-L6-v2")
            self.embedding_model = SentenceTransformer("paraphrase-MiniLM-L6-v2", cache_folder=MODEL_CACHE_DIR)
        
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="nuclear_regulations",
            embedding_function=embedding_functions.SentenceTransformerEmbeddingFunction(model_name)
        )

    def ingest_data(self, regulations_data: pd.DataFrame):
        try:
            existing_ids = self.collection.get()['ids']
            documents = []
            metadatas = []
            ids = []
            
            for idx, row in regulations_data.iterrows():
                doc_id = f"{row['source']}_{idx}"
                if doc_id not in existing_ids:
                    documents.append(row['regulation_text'])
                    metadatas.append({
                        "source": row['source'],
                        "category": row['category']
                    })
                    ids.append(doc_id)
            
            if documents:
                self.collection.add(
                    documents=documents,
                    metadatas=metadatas,
                    ids=ids
                )
                logger.info(f"Successfully ingested {len(documents)} new regulations")
            else:
                logger.info("No new regulations to ingest")
        except Exception as e:
            logger.error(f"Error ingesting data: {str(e)}")

    def fetch_relevant_rules(self, query: str, n_results: int = 5) -> List[ComplianceRule]:
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                include=["documents", "metadatas", "embeddings"]
            )
            
            rules = []
            for i in range(len(results['ids'][0])):
                rule = ComplianceRule(
                    id=results['ids'][0][i],
                    regulation_text=results['documents'][0][i],
                    source=results['metadatas'][0][i]['source'],
                    category=results['metadatas'][0][i]['category'],
                    embeddings=np.array(results['embeddings'][0][i])
                )
                rules.append(rule)
            
            return rules
        except Exception as e:
            logger.error(f"Error fetching rules: {str(e)}")
            return []

class ComplianceReport:
    @staticmethod
    def generate_consolidated_report(actions: List[MaintenanceAction], compliance_results: List[Dict]) -> str:
        """Generate a consolidated report in the exact format"""
        report = f"""Nuclear Maintenance Compliance Report (Consolidated)
===================================
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Summary of Maintenance Actions
============================"""

        for idx, (action, result) in enumerate(zip(actions, compliance_results), 1):
            report += f"""
Action {idx}:
- ID: {action.id}
- Component: {action.component}
- Proposed Action: {action.proposed_action}
- Overall Compliance Status: {'COMPLIANT' if result['overall_compliant'] else 'NON-COMPLIANT'}"""

        report += "\n\nDetailed Compliance Analysis\n==========================="

        for idx, (action, result) in enumerate(zip(actions, compliance_results), 1):
            report += f"\n\nAction {idx} Details:\n------------------"
            if result.get('warning'):
                report += f"\nWARNING: {result['warning']}"
            
            if 'compliance_details' in result:
                for detail in result['compliance_details']:
                    report += f"""
Rule: {detail['rule_id']}
Source: {detail['source']}
Regulation Text: {detail['regulation_text']}
Similarity Score: {detail['similarity_score']:.2f}
Status: {'COMPLIANT' if detail['compliant'] else 'NON-COMPLIANT'}
---"""

        report += "\n\nRecommendations\n==============="
        for idx, (action, result) in enumerate(zip(actions, compliance_results), 1):
            report += f"\n\nAction {idx} ({action.id}):"
            if result['overall_compliant']:
                report += "\n✓ The maintenance action complies with nuclear safety regulations."
            else:
                report += """
⚠ ATTENTION: This action requires revision to ensure compliance:
  - Review and align with relevant nuclear safety standards
  - Consult with nuclear safety officers
  - Document all modifications and justifications"""

        return report

    @staticmethod
    def generate_report(action: MaintenanceAction, compliance_results: Dict) -> Dict:
        """Generate a structured compliance report for API response"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "action_details": {
                "id": action.id,
                "component": action.component,
                "proposed_action": action.proposed_action,
                "description": action.description
            },
            "compliance_status": "COMPLIANT" if compliance_results.get('overall_compliant', False) else "NON-COMPLIANT",
            "warning": compliance_results.get('warning', None),
            "details": [],
            "recommendations": []
        }

        if 'compliance_details' in compliance_results:
            for detail in compliance_results['compliance_details']:
                report["details"].append({
                    "rule_id": detail['rule_id'],
                    "source": detail['source'],
                    "regulation": detail['regulation_text'],
                    "similarity_score": detail['similarity_score'],
                    "status": "COMPLIANT" if detail['compliant'] else "NON-COMPLIANT"
                })

            if compliance_results.get('overall_compliant', False):
                report["recommendations"].append(
                    "✓ The maintenance action complies with nuclear safety regulations."
                )
            else:
                report["recommendations"].extend([
                    "⚠ ATTENTION: This action requires revision to ensure compliance:",
                    "  - Review and align with relevant nuclear safety standards",
                    "  - Consult with nuclear safety officers",
                    "  - Document all modifications and justifications"
                ])

        return report

class ComplianceChecker:
    def __init__(self, knowledge_base: NuclearKnowledgeBase):
        self.knowledge_base = knowledge_base
        self.similarity_threshold = 0.7
        self.report_generator = ComplianceReport()
        self._load_initial_data()

    def _load_initial_data(self):
        """Load initial nuclear regulations data"""
        try:
            regulations_data = []
            
            # Load NuclearQA dataset
            try:
                logger.info("Loading NuclearQA dataset...")
                nuclear_qa = load_dataset("infinite-dataset-hub/NuclearQA", split="train")
                qa_df = pd.DataFrame({
                    'regulation_text': nuclear_qa['context'],
                    'source': ['NuclearQA Reference'] * len(nuclear_qa),
                    'category': nuclear_qa['title']
                })
                regulations_data.append(qa_df)
                logger.info(f"Loaded {len(qa_df)} NuclearQA entries")
            except Exception as e:
                logger.warning(f"Could not load NuclearQA dataset: {str(e)}")

            # Load NRC regulations from Excel
            nrc_regulations_path = Path("data/laws-governing-nrc.xlsx")
            if nrc_regulations_path.exists():
                logger.info("Loading NRC regulations from Excel...")
                nrc_df = pd.read_excel(nrc_regulations_path)
                nrc_df = nrc_df.rename(columns={
                    "program citation": "regulation_text",
                    "law type": "category",
                    "program area": "source"
                })
                if "category" not in nrc_df.columns:
                    nrc_df["category"] = "Nuclear Safety"
                nrc_df["source"] = "NRC Guidelines"
                regulations_data.append(nrc_df)
                logger.info(f"Loaded {len(nrc_df)} NRC regulations")
            else:
                logger.warning("NRC regulations file not found at data/laws-governing-nrc.xlsx")

            # Load additional safety guidelines if available
            safety_guidelines_path = Path("data/nuclear_regulations.csv")
            if safety_guidelines_path.exists():
                logger.info("Loading additional safety guidelines...")
                safety_df = pd.read_csv(safety_guidelines_path)
                safety_df["source"] = "Additional Guidelines"
                regulations_data.append(safety_df)
                logger.info(f"Loaded {len(safety_df)} safety guidelines")

            # Combine all regulations
            if regulations_data:
                combined_regulations = pd.concat(regulations_data, ignore_index=True)
                # Remove duplicates and null values
                combined_regulations = combined_regulations.dropna(subset=['regulation_text'])
                combined_regulations = combined_regulations.drop_duplicates(subset=['regulation_text'])
                
                # Ingest data into knowledge base
                self.knowledge_base.ingest_data(combined_regulations)
                logger.info(f"Successfully loaded total of {len(combined_regulations)} regulations")
            else:
                raise Exception("No regulation data available")

        except Exception as e:
            logger.error(f"Error loading initial data: {str(e)}")

    def check_compliance(self, action: MaintenanceAction) -> Dict:
        """Check compliance and generate report"""
        try:
            # Get compliance results
            results = self._check_compliance_rules(action)
            
            # Generate report
            report = self.report_generator.generate_report(action, results)
            
            # Combine results and report
            return {
                **results,
                "report": report
            }
        except Exception as e:
            logger.error(f"Error in compliance check: {str(e)}")
            return {
                "action_id": action.id,
                "overall_compliant": False,
                "compliance_details": [],
                "warning": f"Error processing compliance check: {str(e)}",
                "report": None
            }

    def _check_compliance_rules(self, action: MaintenanceAction) -> Dict:
        """Internal method to check compliance against rules"""
        # Create a comprehensive query combining component and action
        query = f"""
        Component: {action.component}
        Action: {action.proposed_action}
        Description: {action.description}
        """
        
        relevant_rules = self.knowledge_base.fetch_relevant_rules(query)
        
        if not relevant_rules:
            return {
                "action_id": action.id,
                "overall_compliant": False,
                "compliance_details": [],
                "warning": "No matching regulations found. Please review against current NRC guidelines and safety standards."
            }
        
        # Encode the full action context
        action_embedding = self.knowledge_base.embedding_model.encode(query)
        
        compliance_results = []
        nrc_matches = []  # Track NRC guideline matches specifically
        nuclear_qa_matches = []  # Track NuclearQA matches
        
        for rule in relevant_rules:
            similarity = cosine_similarity(
                [action_embedding], 
                [rule.embeddings]
            )[0][0]
            
            result = {
                "rule_id": rule.id,
                "regulation_text": rule.regulation_text,
                "similarity_score": similarity,
                "compliant": similarity >= self.similarity_threshold,
                "source": rule.source,
                "category": rule.category
            }
            
            compliance_results.append(result)
            if rule.source == "NRC Guidelines":
                nrc_matches.append(result)
            elif rule.source == "NuclearQA Reference":
                nuclear_qa_matches.append(result)
        
        # Sort by similarity score
        compliance_results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Determine overall compliance with special attention to NRC guidelines
        high_confidence_matches = [r for r in compliance_results if r['similarity_score'] > 0.8]
        medium_confidence_matches = [r for r in compliance_results if 0.7 <= r['similarity_score'] <= 0.8]
        
        overall_compliant = any(r['compliant'] for r in high_confidence_matches)
        warning = None
        
        # Special handling for different regulation sources
        if not nrc_matches:
            warning = "⚠ CRITICAL: No matching NRC guidelines found. Action requires immediate review against official NRC regulations."
        elif not any(r['compliant'] for r in nrc_matches):
            warning = "⚠ WARNING: Action may not comply with NRC guidelines. Please review against official regulations."
        elif nuclear_qa_matches and not any(r['compliant'] for r in nuclear_qa_matches):
            warning = "⚠ NOTICE: Action requires additional verification against nuclear safety best practices from NuclearQA reference."
        elif not high_confidence_matches and medium_confidence_matches:
            warning = "⚠ CAUTION: Found potential matching regulations but confidence level is moderate. Please review manually."
        elif not high_confidence_matches and not medium_confidence_matches:
            warning = "⚠ ALERT: Low confidence in regulation matches. Please consult with nuclear safety officers."
        
        return {
            "action_id": action.id,
            "overall_compliant": overall_compliant,
            "compliance_details": compliance_results,
            "warning": warning
        }

    def check_multiple_compliance(self, actions: List[MaintenanceAction]) -> List[Dict]:
        """Check compliance for multiple actions and generate consolidated report"""
        results = []
        for action in actions:
            result = self.check_compliance(action)
            if result:
                results.append(result)
        
        # Generate consolidated report
        consolidated_report = self.report_generator.generate_consolidated_report(actions, results)
        
        # Add consolidated report to each result
        for result in results:
            result['consolidated_report'] = consolidated_report
        
        return results

# Initialize global instances
knowledge_base = NuclearKnowledgeBase()
compliance_checker = ComplianceChecker(knowledge_base)

# API Endpoints for Predictive Maintenance
@router.post("/predict-single/", response_model=PredictionResult, tags=["Predictive Maintenance"])
async def predict_single(input_data: PredictionInput):
    """
    Make a single prediction for equipment failure probability
    """
    try:
        input_features = {
            "Air temperature [K]": input_data.features[0],
            "Process temperature [K]": input_data.features[1],
            "Rotational speed [rpm]": input_data.features[2],
            "Torque [Nm]": input_data.features[3],
            "Type": input_data.features[4],
            "Tool wear [min]": input_data.features[5],
            "TWF": 0,
            "HDF": 0,
            "PWF": 0,
            "OSF": 0,
            "RNF": 0
        }
        df = pd.DataFrame([input_features])
        df = add_time_series_features(df)
        scaled_data = SCALER.transform(df[FEATURE_NAMES])
        
        probability = MODEL.predict_proba(scaled_data)[0][1]
        shap_values = explainer.shap_values(scaled_data)[0]
        explanation = {FEATURE_NAMES[i]: float(shap_values[i]) for i in range(len(FEATURE_NAMES))}
        suggestion = generate_suggestion(shap_values)
        
        return {
            "product_id": input_data.product_id,
            "failure_probability": probability,
            "criticality_rank": None,
            "maintenance_suggestion": suggestion,
            "shap_values": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict-file/", tags=["Predictive Maintenance"])
async def predict_file(file: UploadFile = File(...)):
    """
    Make predictions for multiple equipment instances using a file upload
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp.seek(0)
            
            if file.filename.endswith('.csv'):
                df = pd.read_csv(tmp.name)
            elif file.filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(tmp.name)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
        
        scaled_data, product_ids = process_input_data(df)
        probabilities = MODEL.predict_proba(scaled_data)[:, 1]
        
        results = []
        for i in range(len(probabilities)):
            shap_values = explainer.shap_values(scaled_data[i:i+1])[0]
            explanation = {FEATURE_NAMES[j]: float(shap_values[j]) for j in range(len(FEATURE_NAMES))}
            
            results.append({
                "product_id": product_ids.iloc[i] if product_ids is not None else None,
                "failure_probability": float(probabilities[i]),
                "maintenance_suggestion": generate_suggestion(shap_values),
                "shap_values": explanation
            })
        
        sorted_results = sorted(results, key=lambda x: x['failure_probability'], reverse=True)
        for rank, item in enumerate(sorted_results, 1):
            item['criticality_rank'] = rank
        
        return sorted_results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# API Endpoints for Compliance Checking
@router.post("/check-compliance/", tags=["Compliance"])
async def check_compliance(actions: List[MaintenanceActionInput]):
    """
    Check compliance of maintenance actions against nuclear regulations
    """
    try:
        maintenance_actions = [
            MaintenanceAction(
                id=action.id,
                description=action.description,
                component=action.component,
                proposed_action=action.proposed_action,
                timestamp=action.timestamp
            )
            for action in actions
        ]
        
        results = compliance_checker.check_multiple_compliance(maintenance_actions)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", tags=["System"])
async def health_check():
    """
    Check the health status of the API
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Include router in the app
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
