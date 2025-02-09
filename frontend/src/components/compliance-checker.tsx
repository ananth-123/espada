"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  nuclearApi,
  type ComplianceResult,
  type MaintenanceAction,
} from "@/lib/api";
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Badge,
  List,
  ListItem,
  Button,
} from "@tremor/react";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Shield,
  AlertCircle,
} from "lucide-react";

export function ComplianceChecker() {
  const [action, setAction] = useState<Omit<MaintenanceAction, "timestamp">>({
    id: "",
    description: "",
    component: "",
    proposed_action: "",
  });
  const [results, setResults] = useState<ComplianceResult[]>([]);

  const complianceMutation = useMutation({
    mutationFn: nuclearApi.checkCompliance,
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !action.id ||
      !action.component ||
      !action.description ||
      !action.proposed_action
    ) {
      alert("Please fill in all fields");
      return;
    }

    complianceMutation.mutate([
      {
        ...action,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAction((prev) => ({ ...prev, [name]: value }));
  };

  const getSeverityIcon = (isCompliant: boolean) =>
    isCompliant ? (
      <CheckCircle className="h-5 w-5 text-emerald-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    );

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title className="text-xl font-semibold text-gray-900">
              Maintenance Action Details
            </Title>
            <Text className="mt-1 text-gray-700">
              Enter maintenance action details for compliance verification
            </Text>
          </div>
          <Badge color="blue" size="sm" className="bg-blue-600 text-white">
            AI-Powered
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Action ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={action.id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-gray-900 placeholder-gray-500 bg-white"
                  required
                  placeholder="e.g., MAINT-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Component
                </label>
                <input
                  type="text"
                  name="component"
                  value={action.component}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-gray-900 placeholder-gray-500 bg-white"
                  required
                  placeholder="e.g., Primary Cooling System"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Description
                </label>
                <textarea
                  name="description"
                  value={action.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-gray-900 placeholder-gray-500 bg-white"
                  required
                  placeholder="Detailed description of the maintenance action..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Proposed Action
                </label>
                <textarea
                  name="proposed_action"
                  value={action.proposed_action}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 text-gray-900 placeholder-gray-500 bg-white"
                  required
                  placeholder="Specific steps and procedures to be followed..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                complianceMutation.isPending ||
                !action.id ||
                !action.component ||
                !action.description ||
                !action.proposed_action
              }
              color="blue"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {complianceMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Checking Compliance...</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Check Compliance</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <Title className="text-xl font-semibold text-gray-900 mb-6">
            Compliance Results
          </Title>

          <TabGroup>
            <TabList className="mb-6">
              <Tab className="text-sm text-gray-700 hover:text-gray-900 ui-selected:text-gray-900 ui-selected:border-blue-600">
                Overview
              </Tab>
              <Tab className="text-sm text-gray-700 hover:text-gray-900 ui-selected:text-gray-900 ui-selected:border-blue-600">
                Detailed Analysis
              </Tab>
              <Tab className="text-sm text-gray-700 hover:text-gray-900 ui-selected:text-gray-900 ui-selected:border-blue-600">
                Recommendations
              </Tab>
              <Tab className="text-sm text-gray-700 hover:text-gray-900 ui-selected:text-gray-900 ui-selected:border-blue-600">
                Consolidated Report
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overview Panel */}
              <TabPanel>
                {results.map((result, index) => (
                  <div key={index} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(result.overall_compliant)}
                        <div>
                          <Text className="font-medium text-gray-900">
                            Action ID: {result.action_id}
                          </Text>
                          <Text className="text-sm text-gray-700">
                            Compliance Status
                          </Text>
                        </div>
                      </div>
                      <Badge
                        color={result.overall_compliant ? "emerald" : "red"}
                        size="lg"
                        className={`${
                          result.overall_compliant
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {result.overall_compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </Badge>
                    </div>

                    {result.warning && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <Text className="font-medium text-amber-900">
                            Warning
                          </Text>
                          <Text className="text-sm text-amber-800 mt-1">
                            {result.warning}
                          </Text>
                        </div>
                      </div>
                    )}

                    {result.report && (
                      <div className="space-y-4">
                        <Text className="font-medium text-gray-900">
                          Action Details
                        </Text>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <Text className="text-sm font-medium text-gray-900">
                              Component
                            </Text>
                            <Text className="text-sm text-gray-700 mt-1">
                              {result.report.action_details.component}
                            </Text>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <Text className="text-sm font-medium text-gray-900">
                              Description
                            </Text>
                            <Text className="text-sm text-gray-700 mt-1">
                              {result.report.action_details.description}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TabPanel>

              {/* Detailed Analysis Panel */}
              <TabPanel>
                <div className="space-y-6">
                  {results.map((result) =>
                    result.compliance_details.map((detail, detailIndex) => (
                      <Card
                        key={`${result.action_id}-${detailIndex}`}
                        className="bg-white border border-gray-200"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getSeverityIcon(detail.compliant)}
                              <div>
                                <Text className="font-medium text-gray-900">
                                  Rule ID: {detail.rule_id}
                                </Text>
                                <Text className="text-sm text-gray-700">
                                  Source: {detail.source}
                                </Text>
                              </div>
                            </div>
                            <Badge
                              color={detail.compliant ? "emerald" : "red"}
                              size="lg"
                              className={`${
                                detail.compliant
                                  ? "bg-emerald-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {detail.compliant ? "Compliant" : "Non-Compliant"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Text className="text-sm text-gray-700">
                              Similarity Score:
                            </Text>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full">
                              <div
                                className={`h-full rounded-full ${
                                  detail.similarity_score > 0.7
                                    ? "bg-emerald-600"
                                    : detail.similarity_score > 0.5
                                    ? "bg-amber-600"
                                    : "bg-red-600"
                                }`}
                                style={{
                                  width: `${detail.similarity_score * 100}%`,
                                }}
                              />
                            </div>
                            <Text className="text-sm tabular-nums text-gray-900 font-medium">
                              {(detail.similarity_score * 100).toFixed(1)}%
                            </Text>
                          </div>

                          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <Text className="text-sm text-gray-900">
                              {detail.regulation_text}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabPanel>

              {/* Recommendations Panel */}
              <TabPanel>
                {results.map(
                  (result) =>
                    result.report && (
                      <Card
                        key={result.action_id}
                        className="bg-white border border-gray-200"
                      >
                        <Title className="text-lg text-gray-900 mb-4">
                          Recommendations
                        </Title>
                        <List className="space-y-3">
                          {result.report.recommendations.map(
                            (recommendation, recIndex) => (
                              <ListItem
                                key={recIndex}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                              >
                                {recommendation.startsWith("✓") ? (
                                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                ) : recommendation.startsWith("⚠") ? (
                                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                ) : (
                                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                )}
                                <Text className="text-gray-900">
                                  {recommendation}
                                </Text>
                              </ListItem>
                            )
                          )}
                        </List>
                      </Card>
                    )
                )}
              </TabPanel>

              {/* Consolidated Report Panel */}
              <TabPanel>
                <Card className="bg-white border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <Title className="text-lg text-gray-900">
                      Consolidated Report
                    </Title>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 bg-gray-50 p-6 rounded-lg overflow-auto max-h-[600px] border border-gray-200">
                    {results[0]?.consolidated_report || "No report available"}
                  </pre>
                </Card>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      )}
    </div>
  );
}
