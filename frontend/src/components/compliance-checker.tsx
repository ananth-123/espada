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
      <CheckCircle className="h-5 w-5 text-brand-secondary" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    );

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Title className="text-xl font-roboto font-medium text-text-primary">
              Maintenance Action Details
            </Title>
            <Text className="mt-1 font-roboto text-text-secondary">
              Enter maintenance action details for compliance verification
            </Text>
          </div>
          <Badge
            size="sm"
            className="bg-brand-primary text-white font-roboto px-3 py-1"
          >
            AI-Powered
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-roboto font-medium text-text-primary mb-2">
                  Action ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={action.id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 
                    focus:border-brand-primary focus:ring-1 focus:ring-brand-primary
                    text-text-primary placeholder-text-tertiary bg-white font-roboto
                    transition-colors duration-200"
                  required
                  placeholder="e.g., MAINT-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-roboto font-medium text-text-primary mb-2">
                  Component
                </label>
                <input
                  type="text"
                  name="component"
                  value={action.component}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 
                    focus:border-brand-primary focus:ring-1 focus:ring-brand-primary
                    text-text-primary placeholder-text-tertiary bg-white font-roboto
                    transition-colors duration-200"
                  required
                  placeholder="e.g., Primary Cooling System"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-roboto font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={action.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 
                    focus:border-brand-primary focus:ring-1 focus:ring-brand-primary
                    text-text-primary placeholder-text-tertiary bg-white font-roboto
                    transition-colors duration-200 resize-none"
                  required
                  placeholder="Detailed description of the maintenance action..."
                />
              </div>
              <div>
                <label className="block text-sm font-roboto font-medium text-text-primary mb-2">
                  Proposed Action
                </label>
                <textarea
                  name="proposed_action"
                  value={action.proposed_action}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 
                    focus:border-brand-primary focus:ring-1 focus:ring-brand-primary
                    text-text-primary placeholder-text-tertiary bg-white font-roboto
                    transition-colors duration-200 resize-none"
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
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-roboto
                ${
                  complianceMutation.isPending ||
                  !action.id ||
                  !action.component ||
                  !action.description ||
                  !action.proposed_action
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-primary hover:bg-brand-primary-dark text-white"
                }
                transition-colors duration-200
              `}
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
        <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
          <Title className="text-xl font-roboto font-medium text-text-primary mb-8">
            Compliance Results
          </Title>

          <TabGroup>
            <TabList className="flex gap-8 border-b border-gray-100 mb-8">
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Overview
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Detailed Analysis
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Recommendations
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Consolidated Report
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overview Panel */}
              <TabPanel>
                <div className="space-y-6">
                  {results.map((result, index) => (
                    <Card
                      key={index}
                      className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSeverityIcon(result.overall_compliant)}
                            <div>
                              <Text className="font-roboto font-medium text-text-primary">
                                Action ID: {result.action_id}
                              </Text>
                              <Text className="text-sm font-roboto text-text-secondary">
                                Compliance Status
                              </Text>
                            </div>
                          </div>
                          <Badge
                            size="lg"
                            className={`
                              font-roboto px-3 py-1
                              ${
                                result.overall_compliant
                                  ? "bg-brand-secondary text-white"
                                  : "bg-red-500 text-white"
                              }
                            `}
                          >
                            {result.overall_compliant
                              ? "Compliant"
                              : "Non-Compliant"}
                          </Badge>
                        </div>

                        {result.warning && (
                          <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-accent/10 border border-brand-accent">
                            <AlertCircle className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <Text className="font-roboto font-medium text-text-primary">
                                Warning
                              </Text>
                              <Text className="text-sm font-roboto text-text-secondary mt-1">
                                {result.warning}
                              </Text>
                            </div>
                          </div>
                        )}

                        {result.report && (
                          <div className="space-y-4">
                            <Text className="font-roboto font-medium text-text-primary">
                              Action Details
                            </Text>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <Text className="text-sm font-roboto font-medium text-text-primary">
                                  Component
                                </Text>
                                <Text className="text-sm font-roboto text-text-secondary mt-1">
                                  {result.report.action_details.component}
                                </Text>
                              </div>
                              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <Text className="text-sm font-roboto font-medium text-text-primary">
                                  Description
                                </Text>
                                <Text className="text-sm font-roboto text-text-secondary mt-1">
                                  {result.report.action_details.description}
                                </Text>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabPanel>

              {/* Detailed Analysis Panel */}
              <TabPanel>
                <div className="space-y-6">
                  {results.map((result) =>
                    result.compliance_details.map((detail, detailIndex) => (
                      <Card
                        key={`${result.action_id}-${detailIndex}`}
                        className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getSeverityIcon(detail.compliant)}
                              <div>
                                <Text className="font-roboto font-medium text-text-primary">
                                  Rule ID: {detail.rule_id}
                                </Text>
                                <Text className="text-sm font-roboto text-text-secondary">
                                  Source: {detail.source}
                                </Text>
                              </div>
                            </div>
                            <Badge
                              size="lg"
                              className={`
                                font-roboto px-3 py-1
                                ${
                                  detail.compliant
                                    ? "bg-brand-secondary text-white"
                                    : "bg-red-500 text-white"
                                }
                              `}
                            >
                              {detail.compliant ? "Compliant" : "Non-Compliant"}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <Text className="text-sm font-roboto text-text-secondary">
                              Similarity Score:
                            </Text>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    detail.similarity_score > 0.7
                                      ? "bg-brand-secondary"
                                      : detail.similarity_score > 0.5
                                      ? "bg-brand-accent"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${detail.similarity_score * 100}%`,
                                  }}
                                />
                              </div>
                              <Text className="text-sm font-roboto font-medium text-text-primary min-w-[4rem] text-right">
                                {(detail.similarity_score * 100).toFixed(1)}%
                              </Text>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <Text className="text-sm font-roboto text-text-primary">
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
                        className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
                          Recommendations
                        </Title>
                        <div className="space-y-4">
                          {result.report.recommendations.map(
                            (recommendation, recIndex) => (
                              <div
                                key={recIndex}
                                className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100"
                              >
                                {recommendation.startsWith("✓") ? (
                                  <CheckCircle className="h-5 w-5 text-brand-secondary flex-shrink-0" />
                                ) : recommendation.startsWith("⚠") ? (
                                  <AlertTriangle className="h-5 w-5 text-brand-accent flex-shrink-0" />
                                ) : (
                                  <Info className="h-5 w-5 text-brand-primary flex-shrink-0" />
                                )}
                                <Text className="font-roboto text-text-primary">
                                  {recommendation}
                                </Text>
                              </div>
                            )
                          )}
                        </div>
                      </Card>
                    )
                )}
              </TabPanel>

              {/* Consolidated Report Panel */}
              <TabPanel>
                <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    <Title className="text-lg font-roboto font-medium text-text-primary">
                      Consolidated Report
                    </Title>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-text-primary bg-gray-50 p-6 rounded-lg overflow-auto max-h-[600px] border border-gray-100">
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
