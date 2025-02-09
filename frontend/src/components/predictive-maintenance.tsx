"use client";

import React from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { nuclearApi, type PredictionResult } from "@/lib/api";
import {
  Card,
  Title,
  Text,
  Metric,
  BarChart,
  LineChart,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Button,
} from "@tremor/react";
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Tool,
  Thermometer,
  RotateCw,
  FileSpreadsheet,
} from "lucide-react";

// Add color constants at the top
const colors = {
  primary: "#2563eb", // Blue-600
  secondary: "#3b82f6", // Blue-500
  accent: "#f59e0b", // Amber-500
  success: "#10b981", // Emerald-500
  warning: "#f97316", // Orange-500
  danger: "#ef4444", // Red-500
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    600: "#4b5563",
    800: "#1f2937",
    900: "#111827",
  },
};

// Historical data visualization
const generateHistoricalData = (results: PredictionResult[]) => {
  return results.map((result, index) => ({
    timestamp: new Date(
      Date.now() - (results.length - index) * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0],
    "Temperature (K)": result.shap_values["Air temperature [K]"],
    "Rotational Speed (rpm)": result.shap_values["Rotational speed [rpm]"],
    "Tool Wear (min)": result.shap_values["Tool wear [min]"],
  }));
};

// GPT-powered insight generation
const generateGPTInsight = (shapValues: Record<string, number>) => {
  const insights = [];

  // Temperature Analysis
  const tempImpact = shapValues["Air temperature [K]"];
  insights.push({
    title: "Temperature Impact",
    icon: <Thermometer className="h-5 w-5" />,
    detail:
      tempImpact > 0
        ? "Elevated temperature levels are increasing failure risk. Consider improving cooling systems and ventilation."
        : "Temperature levels are within optimal range, contributing to system stability.",
    color: tempImpact > 0 ? "red" : "green",
  });

  // Rotational Analysis
  const rotationImpact = shapValues["Rotational speed [rpm]"];
  insights.push({
    title: "Rotational Performance",
    icon: <RotateCw className="h-5 w-5" />,
    detail:
      rotationImpact > 0
        ? "Higher than optimal rotational speeds detected. Monitor bearing conditions and lubrication."
        : "Rotational parameters are well-maintained, supporting efficient operation.",
    color: rotationImpact > 0 ? "orange" : "green",
  });

  // Tool Wear Analysis
  const wearImpact = shapValues["Tool wear [min]"];
  insights.push({
    title: "Tool Condition",
    icon: <Tool className="h-5 w-5" />,
    detail:
      wearImpact > 0
        ? "Significant tool wear detected. Schedule replacement to prevent performance degradation."
        : "Tool wear is within acceptable limits. Continue regular monitoring.",
    color: wearImpact > 0 ? "red" : "green",
  });

  return insights;
};

export function PredictiveMaintenance() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<PredictionResult[]>([]);

  const predictMutation = useMutation({
    mutationFn: (file: File) => nuclearApi.predictFile(file),
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) predictMutation.mutate(file);
  };

  return (
    <div className="space-y-8">
      {/* File Upload Section */}
      <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title className="text-xl font-semibold text-gray-800">
              Equipment Health Analysis
            </Title>
            <Text className="mt-1 text-gray-700">
              Upload maintenance data for AI-powered analysis
            </Text>
          </div>
          <Badge color="blue" size="sm">
            AI-Powered
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center text-center">
              <FileSpreadsheet className="h-10 w-10 text-gray-500 mb-4" />
              <div className="flex text-sm text-gray-700">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-700">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                CSV, Excel files up to 10MB
              </p>
            </div>
            {file && (
              <div className="mt-4 text-sm text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>{file.name}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!file || predictMutation.isPending}
              color="blue"
              className="flex items-center gap-2"
            >
              {predictMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Analyze Equipment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {results.length > 0 && (
        <>
          {/* Analysis Results */}
          <TabGroup>
            <TabList className="mb-8">
              <Tab className="text-sm text-gray-700">Equipment Analysis</Tab>
              <Tab className="text-sm text-gray-700">Maintenance Insights</Tab>
              <Tab className="text-sm text-gray-700">Risk Assessment</Tab>
            </TabList>

            <TabPanels>
              {/* Equipment Analysis */}
              <TabPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <Card key={result.product_id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Title className="text-lg text-gray-800">
                            Unit {result.product_id}
                          </Title>
                          <Text className="text-sm text-gray-700">
                            Equipment Health Status
                          </Text>
                        </div>
                        <Badge
                          color={
                            result.failure_probability > 0.5 ? "red" : "emerald"
                          }
                          size="lg"
                        >
                          {(result.failure_probability * 100).toFixed(1)}% Risk
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Text className="font-medium text-gray-800">
                            Failure Probability
                          </Text>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 rounded-full bg-gray-200">
                              <div
                                className={`h-full rounded-full ${
                                  result.failure_probability > 0.5
                                    ? "bg-red-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${result.failure_probability * 100}%`,
                                }}
                              />
                            </div>
                            <Text className="text-sm tabular-nums text-gray-700">
                              {(result.failure_probability * 100).toFixed(1)}%
                            </Text>
                          </div>
                        </div>

                        <div>
                          <Text className="font-medium text-gray-800 mb-2">
                            Contributing Factors
                          </Text>
                          <div className="space-y-2">
                            {Object.entries(result.shap_values)
                              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                              .slice(0, 5)
                              .map(([feature, value]) => (
                                <div
                                  key={feature}
                                  className="flex items-center gap-2"
                                >
                                  {value > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-red-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                                  )}
                                  <Text className="text-sm flex-1 text-gray-700">
                                    {feature}
                                  </Text>
                                  <Text
                                    className={`text-sm tabular-nums ${
                                      value > 0
                                        ? "text-red-700"
                                        : "text-emerald-700"
                                    }`}
                                  >
                                    {value.toFixed(3)}
                                  </Text>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabPanel>

              {/* Maintenance Insights */}
              <TabPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <Card key={result.product_id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Title className="text-lg text-gray-800">
                            Unit {result.product_id}
                          </Title>
                          <Text className="text-sm text-gray-700">
                            Maintenance Recommendations
                          </Text>
                        </div>
                        <Badge
                          color={
                            result.maintenance_suggestion.severity === "High"
                              ? "red"
                              : "emerald"
                          }
                          size="lg"
                        >
                          {result.maintenance_suggestion.severity} Priority
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Text className="font-medium text-gray-800 mb-2">
                            Suggested Action
                          </Text>
                          <Text className="text-sm text-gray-700">
                            {result.maintenance_suggestion.action}
                          </Text>
                        </div>

                        <div>
                          <Text className="font-medium text-gray-800 mb-2">
                            Reason
                          </Text>
                          <Text className="text-sm text-gray-700">
                            {result.maintenance_suggestion.reason}
                          </Text>
                        </div>

                        <div>
                          <Text className="font-medium text-gray-800 mb-2">
                            Instructions
                          </Text>
                          <div className="space-y-2">
                            {result.maintenance_suggestion.instructions
                              .split("\n")
                              .map((instruction, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm text-blue-700 font-medium">
                                    {idx + 1}
                                  </div>
                                  <Text className="text-sm text-gray-700">
                                    {instruction}
                                  </Text>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabPanel>

              {/* Risk Assessment */}
              <TabPanel>
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <Title className="mb-6 text-gray-800">
                      Equipment Risk Distribution
                    </Title>
                    <BarChart
                      data={results.map((r) => ({
                        name: `Unit ${r.product_id}`,
                        "Failure Risk": r.failure_probability * 100,
                      }))}
                      index="name"
                      categories={["Failure Risk"]}
                      colors={["rose"]}
                      valueFormatter={(value) => `${value.toFixed(1)}%`}
                      yAxisWidth={48}
                    />
                  </Card>

                  <Card>
                    <Title className="mb-6 text-gray-800">
                      Risk Factors Analysis
                    </Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.map((result) => (
                        <div key={result.product_id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Text className="font-medium text-gray-800">
                              Unit {result.product_id}
                            </Text>
                            <Badge
                              color={
                                result.failure_probability > 0.5
                                  ? "red"
                                  : "emerald"
                              }
                              size="sm"
                            >
                              {(result.failure_probability * 100).toFixed(1)}%
                              Risk
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            {Object.entries(result.shap_values)
                              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                              .map(([feature, value]) => (
                                <div
                                  key={feature}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className={`w-1 h-1 rounded-full ${
                                      value > 0
                                        ? "bg-red-600"
                                        : "bg-emerald-600"
                                    }`}
                                  />
                                  <Text className="text-sm flex-1 text-gray-700">
                                    {feature}
                                  </Text>
                                  <div className="w-24 h-1.5 rounded-full bg-gray-100">
                                    <div
                                      className={`h-full rounded-full ${
                                        value > 0
                                          ? "bg-red-600"
                                          : "bg-emerald-600"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          Math.abs(value * 100),
                                          100
                                        )}%`,
                                        marginLeft:
                                          value > 0 ? "50%" : undefined,
                                        marginRight:
                                          value < 0 ? "50%" : undefined,
                                      }}
                                    />
                                  </div>
                                  <Text
                                    className={`text-xs tabular-nums w-16 text-right ${
                                      value > 0
                                        ? "text-red-700"
                                        : "text-emerald-700"
                                    }`}
                                  >
                                    {value.toFixed(3)}
                                  </Text>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </>
      )}
    </div>
  );
}
