import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MaintenanceAction {
  id: string;
  description: string;
  component: string;
  proposed_action: string;
  timestamp: string;
}

export interface PredictionInput {
  features: number[];
  product_id?: string;
}

export interface MaintenanceSuggestion {
  severity: string;
  action: string;
  reason: string;
  instructions: string;
}

export interface PredictionResult {
  product_id?: string;
  failure_probability: number;
  criticality_rank?: number;
  maintenance_suggestion: MaintenanceSuggestion;
  shap_values: Record<string, number>;
}

export interface ComplianceReport {
  timestamp: string;
  action_details: {
    id: string;
    component: string;
    proposed_action: string;
    description: string;
  };
  compliance_status: "COMPLIANT" | "NON-COMPLIANT";
  warning?: string;
  details: Array<{
    rule_id: string;
    source: string;
    regulation: string;
    similarity_score: number;
    status: "COMPLIANT" | "NON-COMPLIANT";
  }>;
  recommendations: string[];
}

export interface ComplianceResult {
  action_id: string;
  overall_compliant: boolean;
  compliance_details: Array<{
    rule_id: string;
    regulation_text: string;
    similarity_score: number;
    compliant: boolean;
    source: string;
  }>;
  warning?: string;
  report?: ComplianceReport;
  consolidated_report?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const nuclearApi = {
  // Predictive Maintenance Endpoints
  async predictSingle(input: PredictionInput): Promise<PredictionResult> {
    const response = await api.post<PredictionResult>(
      "/api/predict-single/",
      input
    );
    return response.data;
  },

  async predictFile(file: File): Promise<PredictionResult[]> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<PredictionResult[]>(
      "/api/predict-file/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Compliance Checking Endpoints
  async checkCompliance(
    actions: MaintenanceAction[]
  ): Promise<ComplianceResult[]> {
    const response = await api.post<ComplianceResult[]>(
      "/api/check-compliance/",
      actions
    );
    return response.data;
  },

  // Health Check
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get("/api/health");
    return response.data;
  },
};
