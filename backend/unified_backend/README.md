# Nuclear Plant Management API

A unified FastAPI backend that combines predictive maintenance and compliance checking functionalities for nuclear plant management.

## Features

### Predictive Maintenance

- Single prediction endpoint for equipment failure probability
- Batch prediction through file upload (CSV/Excel)
- SHAP-based feature importance explanations
- Automated maintenance suggestions based on predictions
- Time-series feature engineering

### Compliance Checking

- Regulatory compliance verification for maintenance actions
- Semantic similarity-based regulation matching
- Multi-action compliance checking
- Detailed compliance reports with similarity scores
- Integration with nuclear regulation knowledge base

## API Endpoints

All endpoints are prefixed with `/api`

### Predictive Maintenance Endpoints

#### POST `/api/predict-single/`

Make a single prediction for equipment failure probability.

Request body:

```json
{
    "features": [float, float, float, float, float, float],
    "product_id": "optional_string"
}
```

#### POST `/api/predict-file/`

Make predictions for multiple equipment instances using a file upload (CSV/Excel).

### Compliance Checking Endpoints

#### POST `/api/check-compliance/`

Check compliance of maintenance actions against nuclear regulations.

Request body:

```json
[
  {
    "id": "string",
    "description": "string",
    "component": "string",
    "proposed_action": "string",
    "timestamp": "datetime"
  }
]
```

### System Endpoints

#### GET `/api/health`

Check the health status of the API.

## Setup and Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Ensure model files are present in the root directory:

- `xgb_model.pkl`
- `scaler.pkl`
- `label_encoder.pkl`
- `feature_names.pkl`

4. Run the server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

Once the server is running, you can access:

- Interactive API documentation (Swagger UI): http://localhost:8000/api/docs
- Alternative API documentation (ReDoc): http://localhost:8000/api/redoc
- OpenAPI specification: http://localhost:8000/api/openapi.json

## Input Data Format

### Predictive Maintenance Features

The features array should contain the following values in order:

1. Air temperature [K]
2. Process temperature [K]
3. Rotational speed [rpm]
4. Torque [Nm]
5. Type (encoded value)
6. Tool wear [min]

### File Upload Format

CSV or Excel files should contain the following columns:

- Air temperature [K]
- Process temperature [K]
- Rotational speed [rpm]
- Torque [Nm]
- Type
- Tool wear [min]
- TWF
- HDF
- PWF
- OSF
- RNF
- Product ID (optional)

## Error Handling

The API includes comprehensive error handling:

- Input validation errors (400)
- Missing required columns (400)
- File format errors (400)
- Processing errors (500)
- Detailed error messages in the response

## Security

- CORS middleware enabled for cross-origin requests
- Input validation using Pydantic models
- Error handling to prevent information leakage
- Logging for monitoring and debugging

## Dependencies

See `requirements.txt` for a complete list of dependencies and their versions.
