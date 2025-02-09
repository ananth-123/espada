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
  FileSpreadsheet,
} from "lucide-react";

// Update color constants to match AtkinsRéalis brand
const brandColors = {
  primary: "#0063A3", // AtkinsRéalis primary blue
  secondary: "#00B2A9", // AtkinsRéalis teal
  accent: "#FFB81C", // AtkinsRéalis yellow
  success: "#4CAF50",
  warning: "#FF9800",
  danger: "#F44336",
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
};

// Risk threshold constants
const RISK_THRESHOLDS = {
  HIGH: 0.7, // 70%
  MEDIUM: 0.3, // 30%
};

// Performance metrics data
const PERFORMANCE_METRICS = {
  temperature: {
    current: 298.1,
    optimal: 298.0,
    range: { min: 295.0, max: 304.0 },
    unit: "K",
    trend: "stable",
  },
  pressure: {
    current: 101.3,
    optimal: 101.0,
    range: { min: 98.0, max: 104.0 },
    unit: "kPa",
    trend: "up",
  },
  vibration: {
    current: 2.1,
    optimal: 2.0,
    range: { min: 0.0, max: 5.0 },
    unit: "mm/s",
    trend: "down",
  },
  efficiency: {
    current: 92.5,
    optimal: 95.0,
    range: { min: 85.0, max: 100.0 },
    unit: "%",
    trend: "stable",
  },
};

// Historical performance data (last 24 hours)
const HISTORICAL_PERFORMANCE = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  temperature: 298 + Math.sin(i * 0.5) * 0.5,
  pressure: 101 + Math.cos(i * 0.3) * 0.8,
  vibration: 2 + Math.sin(i * 0.8) * 0.3,
  efficiency: 92 + Math.cos(i * 0.4) * 2,
}));

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

// Helper function to get trend icon
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-brand-secondary" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <span className="h-4 w-4 rounded-full bg-brand-accent" />;
  }
};

// Performance metrics visualization
const PerformanceMetricsCard = () => {
  return (
    <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
      <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
        24-Hour Performance Trends
      </Title>
      <BarChart
        className="h-72"
        data={HISTORICAL_PERFORMANCE}
        index="hour"
        categories={["temperature", "efficiency"]}
        colors={["brand-primary", "brand-secondary"]}
        valueFormatter={(value: number) => value.toFixed(1)}
        showLegend
        showGridLines={false}
        yAxisWidth={60}
      />
      <div className="grid grid-cols-2 gap-4 mt-6">
        {Object.entries(PERFORMANCE_METRICS).map(([key, metric]) => (
          <div
            key={key}
            className="p-4 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Text className="text-sm font-roboto font-medium text-text-primary capitalize">
                {key}
              </Text>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="flex items-baseline gap-2">
              <Text className="text-2xl font-roboto font-medium text-text-primary">
                {metric.current}
              </Text>
              <Text className="text-sm font-roboto text-text-secondary">
                {metric.unit}
              </Text>
            </div>
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all"
                  style={{
                    width: `${
                      ((metric.current - metric.range.min) /
                        (metric.range.max - metric.range.min)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <Text className="text-xs font-roboto text-text-tertiary">
                  {metric.range.min}
                </Text>
                <Text className="text-xs font-roboto text-text-tertiary">
                  {metric.range.max}
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Risk Distribution Card
const RiskDistributionCard = ({ results }: { results: PredictionResult[] }) => {
  const riskCategories = [
    {
      label: "Low Risk",
      count: results.filter(
        (r) => r.failure_probability <= RISK_THRESHOLDS.MEDIUM
      ).length,
      color: "bg-brand-secondary",
    },
    {
      label: "Medium Risk",
      count: results.filter(
        (r) =>
          r.failure_probability > RISK_THRESHOLDS.MEDIUM &&
          r.failure_probability <= RISK_THRESHOLDS.HIGH
      ).length,
      color: "bg-brand-accent",
    },
    {
      label: "High Risk",
      count: results.filter((r) => r.failure_probability > RISK_THRESHOLDS.HIGH)
        .length,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {riskCategories.map((category) => (
        <Card
          key={category.label}
          className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${category.color}`} />
            <Text className="font-roboto font-medium text-text-primary">
              {category.label}
            </Text>
          </div>
          <Text className="text-3xl font-roboto font-medium text-text-primary mt-4">
            {category.count}
          </Text>
          <Text className="text-sm font-roboto text-text-secondary">
            Equipment Units
          </Text>
        </Card>
      ))}
    </div>
  );
};

// Risk Assessment Chart
const RiskAssessmentChart = ({ results }: { results: PredictionResult[] }) => (
  <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
    <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
      Equipment Risk Distribution
    </Title>
    <BarChart
      data={results.map((r) => ({
        name: `Unit ${r.product_id}`,
        "Failure Risk": r.failure_probability * 100,
      }))}
      index="name"
      categories={["Failure Risk"]}
      colors={["brand-primary"]}
      valueFormatter={(value: number) => `${value.toFixed(1)}%`}
      showLegend={true}
      showGridLines={false}
      className="h-80"
      yAxisWidth={56}
      customTooltip={({ payload }) => {
        if (!payload?.length) return null;
        const value = payload[0].value as number;
        const color =
          value > 70
            ? "red-500"
            : value > 30
            ? "brand-accent"
            : "brand-secondary";
        return (
          <div className="rounded-lg border border-gray-100 bg-white p-2 shadow-md">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-${color}`} />
              <span className="font-roboto text-sm font-medium">
                {value.toFixed(1)}% Risk
              </span>
            </div>
          </div>
        );
      }}
    />
  </Card>
);

// Performance Trend Chart
const PerformanceTrendChart = () => (
  <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
    <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
      System Performance Trends
    </Title>
    <BarChart
      data={HISTORICAL_PERFORMANCE}
      index="hour"
      categories={["temperature", "pressure", "efficiency"]}
      colors={["brand-primary", "brand-secondary", "brand-accent"]}
      valueFormatter={(value: number) => value.toFixed(1)}
      showLegend={true}
      showGridLines={false}
      className="h-80"
      yAxisWidth={56}
    />
  </Card>
);

// Component Health Distribution
const ComponentHealthChart = () => {
  const healthData = [
    { component: "Core Systems", health: 98.5, status: "Optimal" },
    { component: "Cooling System", health: 92.3, status: "Good" },
    { component: "Control Rods", health: 97.8, status: "Optimal" },
    { component: "Safety Systems", health: 99.1, status: "Optimal" },
    { component: "Monitoring", health: 95.6, status: "Good" },
    { component: "Power Systems", health: 94.2, status: "Good" },
  ];

  return (
    <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
      <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
        Component Health Status
      </Title>
      <BarChart
        data={healthData}
        index="component"
        categories={["health"]}
        colors={["brand-secondary"]}
        valueFormatter={(value: number) => `${value.toFixed(1)}%`}
        showLegend={false}
        showGridLines={false}
        className="h-80"
        yAxisWidth={56}
        customTooltip={({ payload }) => {
          if (!payload?.length) return null;
          const value = payload[0].value as number;
          const status =
            value >= 97 ? "Optimal" : value >= 93 ? "Good" : "Needs Attention";
          const color =
            value >= 97
              ? "brand-secondary"
              : value >= 93
              ? "brand-accent"
              : "red-500";
          return (
            <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${color}`} />
                  <span className="font-roboto text-sm font-medium">
                    {value.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  Status: {status}
                </div>
              </div>
            </div>
          );
        }}
      />
    </Card>
  );
};

// System Overview Cards
const SystemOverviewCards = () => {
  const metrics = [
    {
      title: "Overall System Health",
      value: "96.8%",
      trend: "up",
      change: "+2.1%",
      description: "Across all monitored units",
    },
    {
      title: "Average Uptime",
      value: "99.2%",
      trend: "stable",
      change: "0.0%",
      description: "Last 30 days",
    },
    {
      title: "Maintenance Efficiency",
      value: "94.5%",
      trend: "up",
      change: "+1.8%",
      description: "Tasks completed on schedule",
    },
    {
      title: "Safety Compliance",
      value: "100%",
      trend: "stable",
      change: "0.0%",
      description: "Regulatory standards met",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
        >
          <Text className="font-roboto text-text-secondary">
            {metric.title}
          </Text>
          <div className="flex items-baseline gap-2 mt-2">
            <Text className="text-2xl font-roboto font-medium text-text-primary">
              {metric.value}
            </Text>
            <div
              className={`flex items-center gap-1 text-sm ${
                metric.trend === "up"
                  ? "text-brand-secondary"
                  : metric.trend === "down"
                  ? "text-red-500"
                  : "text-brand-accent"
              }`}
            >
              {getTrendIcon(metric.trend)}
              <span>{metric.change}</span>
            </div>
          </div>
          <Text className="text-sm font-roboto text-text-tertiary mt-1">
            {metric.description}
          </Text>
        </Card>
      ))}
    </div>
  );
};

// Critical Systems Status
const CriticalSystemsStatus = () => {
  const systems = [
    { name: "Reactor Core", status: "Optimal", health: 99.2 },
    { name: "Cooling System", status: "Good", health: 95.8 },
    { name: "Safety Controls", status: "Optimal", health: 98.7 },
    { name: "Power Distribution", status: "Attention", health: 92.3 },
    { name: "Monitoring Systems", status: "Good", health: 96.5 },
  ];

  return (
    <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
      <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
        Critical Systems Status
      </Title>
      <div className="space-y-4">
        {systems.map((system) => (
          <div
            key={system.name}
            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  system.health >= 97
                    ? "bg-brand-secondary"
                    : system.health >= 93
                    ? "bg-brand-accent"
                    : "bg-red-500"
                }`}
              />
              <div>
                <Text className="font-roboto font-medium text-text-primary">
                  {system.name}
                </Text>
                <Text className="text-sm font-roboto text-text-secondary">
                  {system.status}
                </Text>
              </div>
            </div>
            <Text className="text-lg font-roboto font-medium text-text-primary">
              {system.health}%
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
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

  // Helper function to get risk color
  const getRiskColor = (value: number, type: "bg" | "text" = "bg") => {
    if (value > RISK_THRESHOLDS.HIGH) {
      return type === "bg" ? "bg-red-500" : "text-red-700";
    }
    if (value > RISK_THRESHOLDS.MEDIUM) {
      return type === "bg" ? "bg-brand-accent" : "text-brand-accent";
    }
    return type === "bg" ? "bg-brand-secondary" : "text-brand-secondary";
  };

  return (
    <div className="space-y-8">
      {/* File Upload Section */}
      <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Title className="text-xl font-roboto font-medium text-text-primary">
              Equipment Health Analysis
            </Title>
            <Text className="mt-1 font-roboto text-text-secondary">
              Upload maintenance data for AI-powered predictive analysis
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
          <div
            className={`
              flex flex-col items-center justify-center p-8 
              border-2 border-dashed rounded-xl
              ${
                file
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-gray-200 bg-gray-50"
              } 
              hover:border-brand-primary hover:bg-brand-primary/5 
              transition-colors cursor-pointer
            `}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <FileSpreadsheet
                className={`h-12 w-12 ${
                  file ? "text-brand-primary" : "text-gray-400"
                }`}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <label className="relative cursor-pointer">
                    <span className="text-brand-primary hover:text-brand-primary-dark font-medium">
                      Upload a file
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <span>or drag and drop</span>
                </div>
                <Text className="text-xs text-text-tertiary">
                  CSV, Excel files up to 10MB
                </Text>
              </div>
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-2 text-sm text-text-primary">
                <CheckCircle className="h-4 w-4 text-brand-secondary" />
                <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!file || predictMutation.isPending}
              className={`
                flex-1 items-center gap-2 rounded-lg font-roboto
                ${
                  !file || predictMutation.isPending
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-primary hover:bg-brand-primary-dark text-white"
                }
                transition-colors duration-200
              `}
            >
              {predictMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="font-medium flex-1">Analyze Equipment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Additional Performance Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ComponentHealthChart />
        <PerformanceTrendChart />
      </div>

      {/* System Overview */}
      <div className="space-y-8">
        <SystemOverviewCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CriticalSystemsStatus />
          <PerformanceTrendChart />
        </div>
      </div>

      {/* Risk Assessment Overview */}
      <div className="mb-8">
        {/* <RiskAssessmentChart results={results} /> */}
      </div>

      {/* Analysis Results */}
      {results.length > 0 && (
        <>
          <TabGroup>
            <TabList className="flex gap-8 border-b border-gray-100 mb-8">
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Equipment Analysis
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Maintenance Insights
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-roboto font-medium text-text-secondary hover:text-text-primary focus:outline-none ui-selected:text-brand-primary ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-brand-primary">
                Risk Assessment
              </Tab>
            </TabList>

            <TabPanels>
              {/* Equipment Analysis Panel */}
              <TabPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <Card
                      key={result.product_id}
                      className="space-y-6 bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Title className="text-lg font-roboto font-medium text-text-primary">
                            Unit {result.product_id}
                          </Title>
                          <Text className="text-sm font-roboto text-text-secondary">
                            Equipment Health Status
                          </Text>
                        </div>
                        <Badge
                          size="lg"
                          className={`
                            font-roboto px-3 py-1
                            ${getRiskColor(
                              result.failure_probability
                            )} text-white
                          `}
                        >
                          {(result.failure_probability * 100).toFixed(1)}% Risk
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <Text className="font-roboto font-medium text-text-primary mb-2">
                            Failure Probability
                          </Text>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 
                                  ${getRiskColor(result.failure_probability)}`}
                                style={{
                                  width: `${result.failure_probability * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-roboto font-medium text-text-primary min-w-[4rem] text-right">
                              {(result.failure_probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div>
                          <Text className="font-roboto font-medium text-text-primary mb-4">
                            Contributing Factors
                          </Text>
                          <div className="space-y-3">
                            {Object.entries(result.shap_values)
                              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                              .slice(0, 5)
                              .map(([feature, value]) => (
                                <div
                                  key={feature}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                                >
                                  {value > 0 ? (
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-brand-secondary" />
                                  )}
                                  <Text className="flex-1 text-sm font-roboto text-text-secondary">
                                    {feature}
                                  </Text>
                                  <Text
                                    className={`text-sm font-roboto font-medium ${
                                      value > 0
                                        ? "text-red-700"
                                        : "text-brand-secondary"
                                    }`}
                                  >
                                    {value.toFixed(3)}
                                  </Text>
                                </div>
                              ))}
                          </div>
                        </div>

                        {result.maintenance_suggestion && (
                          <div className="p-4 rounded-lg bg-brand-primary/5 border border-brand-primary/10">
                            <Text className="font-roboto font-medium text-text-primary mb-2">
                              Recommended Action
                            </Text>
                            <Text className="text-sm font-roboto text-text-secondary">
                              {result.maintenance_suggestion.action}
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabPanel>

              {/* Maintenance Insights Panel */}
              <TabPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result) => (
                    <Card
                      key={result.product_id}
                      className="space-y-6 bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Title className="text-lg font-roboto font-medium text-text-primary">
                            Unit {result.product_id}
                          </Title>
                          <Text className="text-sm font-roboto text-text-secondary">
                            Maintenance Recommendations
                          </Text>
                        </div>
                        <Badge
                          size="lg"
                          className={`
                            font-roboto px-3 py-1
                            ${
                              result.maintenance_suggestion.severity === "High"
                                ? "bg-red-500 text-white"
                                : result.maintenance_suggestion.severity ===
                                  "Medium"
                                ? "bg-brand-accent text-text-primary"
                                : "bg-brand-secondary text-white"
                            }
                          `}
                        >
                          {result.maintenance_suggestion.severity} Priority
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <Text className="font-roboto font-medium text-text-primary mb-2">
                            Reason for Action
                          </Text>
                          <Text className="text-sm font-roboto text-text-secondary">
                            {result.maintenance_suggestion.reason}
                          </Text>
                        </div>

                        <div>
                          <Text className="font-roboto font-medium text-text-primary mb-4">
                            Maintenance Instructions
                          </Text>
                          <div className="space-y-3">
                            {result.maintenance_suggestion.instructions
                              .split("\n")
                              .map((instruction, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                                >
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                                    <Text className="text-sm font-roboto font-medium text-brand-primary">
                                      {idx + 1}
                                    </Text>
                                  </div>
                                  <Text className="text-sm font-roboto text-text-secondary">
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

              {/* Risk Assessment Panel */}
              <TabPanel>
                <div className="space-y-8">
                  <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
                    <Title className="text-lg font-roboto font-medium text-text-primary mb-6">
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
                      showLegend={false}
                      className="h-80"
                    />
                  </Card>

                  {/* Add Risk Distribution Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        label: "Low Risk",
                        count: results.filter(
                          (r) => r.failure_probability <= RISK_THRESHOLDS.MEDIUM
                        ).length,
                        color: "bg-brand-secondary",
                      },
                      {
                        label: "Medium Risk",
                        count: results.filter(
                          (r) =>
                            r.failure_probability > RISK_THRESHOLDS.MEDIUM &&
                            r.failure_probability <= RISK_THRESHOLDS.HIGH
                        ).length,
                        color: "bg-brand-accent",
                      },
                      {
                        label: "High Risk",
                        count: results.filter(
                          (r) => r.failure_probability > RISK_THRESHOLDS.HIGH
                        ).length,
                        color: "bg-red-500",
                      },
                    ].map((category) => (
                      <Card
                        key={category.label}
                        className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${category.color}`}
                          />
                          <Text className="font-roboto font-medium text-text-primary">
                            {category.label}
                          </Text>
                        </div>
                        <Text className="text-3xl font-roboto font-medium text-text-primary mt-4">
                          {category.count}
                        </Text>
                        <Text className="text-sm font-roboto text-text-secondary">
                          Equipment Units
                        </Text>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>

          {/* Performance Metrics & Risk Analysis Dashboard */}
          <div className="mt-12 space-y-8">
            <div>
              <Title className="text-xl font-roboto font-medium text-text-primary mb-4">
                Performance Analytics
              </Title>
              <Text className="font-roboto text-text-secondary mb-6">
                Real-time monitoring and historical trends of critical
                parameters
              </Text>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceMetricsCard />
                <RiskDistributionCard results={results} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
