"use client";

import {
  Card,
  Title,
  Text,
  Grid,
  Metric,
  AreaChart,
  DonutChart,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Flex,
  BarChart,
  type CustomTooltipProps,
} from "@tremor/react";
import {
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap,
  LucideIcon,
} from "lucide-react";
import { PredictiveMaintenance } from "@/components/predictive-maintenance";
import { ComplianceChecker } from "@/components/compliance-checker";
import { useState } from "react";
import { type PredictionResult } from "@/lib/api";

// Performance metrics from ai4i2020.csv dataset
const performanceData = [
  {
    timestamp: "Hour 1",
    "Air Temperature (K)": 298.1,
    "Process Temperature (K)": 308.6,
    "Rotational Speed (rpm)": 1551,
    "Torque (Nm)": 42.8,
    "Tool Wear (min)": 0,
  },
  {
    timestamp: "Hour 2",
    "Air Temperature (K)": 298.2,
    "Process Temperature (K)": 308.7,
    "Rotational Speed (rpm)": 1408,
    "Torque (Nm)": 46.3,
    "Tool Wear (min)": 3,
  },
  {
    timestamp: "Hour 3",
    "Air Temperature (K)": 298.6,
    "Process Temperature (K)": 309.2,
    "Rotational Speed (rpm)": 1498,
    "Torque (Nm)": 49.4,
    "Tool Wear (min)": 5,
  },
  {
    timestamp: "Hour 4",
    "Air Temperature (K)": 298.9,
    "Process Temperature (K)": 309.5,
    "Rotational Speed (rpm)": 1433,
    "Torque (Nm)": 39.5,
    "Tool Wear (min)": 7,
  },
  {
    timestamp: "Hour 5",
    "Air Temperature (K)": 299.1,
    "Process Temperature (K)": 309.8,
    "Rotational Speed (rpm)": 1408,
    "Torque (Nm)": 40.2,
    "Tool Wear (min)": 9,
  },
  {
    timestamp: "Hour 6",
    "Air Temperature (K)": 299.4,
    "Process Temperature (K)": 310.1,
    "Rotational Speed (rpm)": 1425,
    "Torque (Nm)": 41.8,
    "Tool Wear (min)": 11,
  },
];

// Operating ranges based on dataset analysis
const operatingRanges = {
  "Air Temperature (K)": { min: 295.0, max: 304.0, optimal: 298.0 },
  "Process Temperature (K)": { min: 305.0, max: 313.0, optimal: 309.0 },
  "Rotational Speed (rpm)": { min: 1300, max: 1600, optimal: 1500 },
  "Torque (Nm)": { min: 35.0, max: 50.0, optimal: 42.0 },
  "Tool Wear (min)": { min: 0, max: 200, warning: 150 },
};

// System components and their weights
interface SystemComponent {
  name: string;
  health: number;
  criticalityWeight: number;
  activeComponents: number;
  lastMaintenance: string;
}

const systemComponents: Record<string, SystemComponent[]> = {
  "Core Systems": [
    {
      name: "Reactor Core",
      health: 98.5,
      criticalityWeight: 10,
      activeComponents: 24,
      lastMaintenance: "2024-01-15",
    },
    {
      name: "Primary Cooling",
      health: 97.2,
      criticalityWeight: 9,
      activeComponents: 18,
      lastMaintenance: "2024-02-01",
    },
    {
      name: "Control Rods",
      health: 99.1,
      criticalityWeight: 9,
      activeComponents: 12,
      lastMaintenance: "2024-01-20",
    },
  ],
  "Safety Systems": [
    {
      name: "Emergency Cooling",
      health: 99.5,
      criticalityWeight: 10,
      activeComponents: 16,
      lastMaintenance: "2024-02-10",
    },
    {
      name: "Containment",
      health: 98.8,
      criticalityWeight: 9,
      activeComponents: 8,
      lastMaintenance: "2024-01-25",
    },
    {
      name: "Radiation Monitoring",
      health: 97.9,
      criticalityWeight: 8,
      activeComponents: 32,
      lastMaintenance: "2024-02-05",
    },
  ],
  "Auxiliary Systems": [
    {
      name: "Power Distribution",
      health: 96.5,
      criticalityWeight: 7,
      activeComponents: 14,
      lastMaintenance: "2024-01-30",
    },
    {
      name: "HVAC",
      health: 95.8,
      criticalityWeight: 6,
      activeComponents: 10,
      lastMaintenance: "2024-02-08",
    },
    {
      name: "Water Treatment",
      health: 97.2,
      criticalityWeight: 7,
      activeComponents: 8,
      lastMaintenance: "2024-01-28",
    },
  ],
  "Monitoring Systems": [
    {
      name: "Sensors Network",
      health: 96.8,
      criticalityWeight: 8,
      activeComponents: 64,
      lastMaintenance: "2024-02-12",
    },
    {
      name: "Control Systems",
      health: 98.2,
      criticalityWeight: 8,
      activeComponents: 28,
      lastMaintenance: "2024-02-03",
    },
    {
      name: "Data Processing",
      health: 97.5,
      criticalityWeight: 7,
      activeComponents: 12,
      lastMaintenance: "2024-02-15",
    },
  ],
};

// Calculate system health distribution
const calculateSystemDistribution = () => {
  const distribution: Record<string, number> = {};
  let totalWeight = 0;

  // Calculate weighted scores for each system
  Object.entries(systemComponents).forEach(([system, components]) => {
    const systemScore = components.reduce((acc, component) => {
      const componentScore =
        (component.health *
          component.criticalityWeight *
          component.activeComponents) /
        100;
      return acc + componentScore;
    }, 0);

    distribution[system] = systemScore;
    totalWeight += systemScore;
  });

  // Convert to percentages
  Object.keys(distribution).forEach((key) => {
    distribution[key] = Math.round((distribution[key] / totalWeight) * 100);
  });

  return distribution;
};

// Calculate system health scores
const calculateSystemHealth = () => {
  const healthScores: Record<string, number> = {};

  Object.entries(systemComponents).forEach(([system, components]) => {
    const avgHealth =
      components.reduce((acc, comp) => acc + comp.health, 0) /
      components.length;
    healthScores[system] = Math.round(avgHealth * 10) / 10;
  });

  return healthScores;
};

const systemDistribution = calculateSystemDistribution();
const systemHealthScores = calculateSystemHealth();

// Update color constants to match AtkinsRéalis brand
const colors = {
  primary: {
    DEFAULT: "#0063A3", // AtkinsRéalis primary blue
    light: "#3D8DBC",
    dark: "#004B7A",
  },
  secondary: {
    DEFAULT: "#00B2A9", // AtkinsRéalis teal
    light: "#33C5BE",
    dark: "#008680",
  },
  accent: {
    DEFAULT: "#FFB81C", // AtkinsRéalis yellow
    light: "#FFCA4F",
    dark: "#CC9316",
  },
  success: {
    DEFAULT: "#4CAF50",
    light: "#81C784",
    dark: "#388E3C",
  },
  warning: {
    DEFAULT: "#FF9800",
    light: "#FFB74D",
    dark: "#F57C00",
  },
  danger: {
    DEFAULT: "#F44336",
    light: "#E57373",
    dark: "#D32F2F",
  },
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
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

// System metrics type definition
interface SystemMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
  icon: LucideIcon;
  color: "success" | "warning" | "primary";
  description: string;
  unit?: string;
  target?: string;
  details?: Array<{ type: string; unit: string }>;
  nextMaintenance?: string;
}

// System metrics data
const systemMetrics: Record<string, SystemMetric> = {
  status: {
    label: "System Status",
    value: "Operational",
    trend: "up",
    icon: CheckCircle,
    color: "success",
    description: "All systems functioning normally",
  },
  alerts: {
    label: "Active Alerts",
    value: "2",
    trend: "up",
    icon: AlertTriangle,
    color: "warning",
    description: "Critical alerts requiring attention",
    details: [
      { type: "Temperature Warning", unit: "Reactor Unit 2" },
      { type: "Maintenance Due", unit: "Cooling System" },
    ],
  },
  power: {
    label: "Power Output",
    value: "98.5",
    unit: "%",
    trend: "stable",
    icon: Zap,
    color: "primary",
    target: "Target: 99%",
    description: "Current reactor power output",
  },
  maintenance: {
    label: "System Health",
    value: "92.3",
    unit: "%",
    trend: "down",
    icon: Settings,
    color: "primary",
    description: "Overall system health score",
    nextMaintenance: "Scheduled: 7 days",
  },
};

export default function Home() {
  const [results, setResults] = useState<PredictionResult[]>([]);

  // Custom tooltip formatter for charts
  const customTooltipFormatter = ({ payload }: CustomTooltipProps) => {
    if (!payload?.length) return null;
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-lg">
        <div className="space-y-1">
          {payload.map((category) => (
            <div
              key={category.dataKey}
              className="flex items-center justify-between gap-8"
            >
              <Text className="text-sm font-medium text-gray-600">
                {category.dataKey}
              </Text>
              <Text className="tabular-nums text-sm font-medium text-gray-900">
                {typeof category.value === "number"
                  ? category.value.toFixed(1)
                  : category.value}
              </Text>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-medium text-gray-900">
                Nuclear Plant Management
              </h1>
              <div className="hidden md:flex items-center space-x-6">
                <select className="text-sm bg-transparent border-0 font-medium text-primary-dark focus:outline-none focus:ring-0">
                  <option value="unit1">Reactor Unit 1</option>
                  <option value="unit2">Reactor Unit 2</option>
                </select>
                <span className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success-DEFAULT" />
                  <span className="text-sm font-medium text-gray-700">
                    Operational
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge color="success" size="sm" className="animate-pulse">
                  Live
                </Badge>
                <Text className="text-sm font-medium text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* System Overview */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Title className="text-2xl font-semibold text-gray-900">
                System Overview
              </Title>
              <Text className="mt-1 text-gray-600">
                Real-time monitoring and system health
              </Text>
            </div>
            <div className="flex items-center gap-4">
              <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:border-primary-DEFAULT focus:ring-primary-DEFAULT">
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(systemMetrics).map(([key, metric]) => (
              <Card
                key={key}
                className={`bg-white hover:shadow-lg transition-all duration-300 border-0 ring-1 ring-gray-100 ${
                  metric.color === "warning" ? "bg-warning-light/10" : ""
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <Text className="font-medium text-gray-600">
                      {metric.label}
                    </Text>
                    <metric.icon
                      className={`h-5 w-5 text-${
                        metric.color === "success"
                          ? "emerald"
                          : metric.color === "warning"
                          ? "amber"
                          : "blue"
                      }-600`}
                    />
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <Metric className="text-2xl font-semibold">
                      {metric.value}
                      {metric.unit}
                    </Metric>
                    {metric.target && (
                      <Text className="text-sm text-gray-500">
                        {metric.target}
                      </Text>
                    )}
                  </div>

                  <Text className="text-sm text-gray-600 mb-4">
                    {metric.description}
                  </Text>

                  {metric.details && (
                    <div className="mt-auto space-y-2">
                      {metric.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-gray-50/80 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full bg-${
                                metric.color === "success"
                                  ? "emerald"
                                  : metric.color === "warning"
                                  ? "amber"
                                  : "blue"
                              }-500`}
                            />
                            <Text className="text-sm font-medium text-gray-700">
                              {detail.type}
                            </Text>
                          </div>
                          <Text className="text-sm text-gray-500">
                            {detail.unit}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Performance Analytics */}
        <Card className="bg-white ring-1 ring-gray-100 border-0 mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Text className="text-xl font-semibold text-brand-primary">
                Machine Performance Metrics
              </Text>
              <Text className="text-sm text-text-secondary mt-1">
                Real-time monitoring of critical machine parameters
              </Text>
            </div>
            <div className="flex items-center gap-4">
              <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-text-primary hover:border-brand-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors">
                <option value="temperature">Temperature Analysis</option>
                <option value="mechanical">Mechanical Parameters</option>
                <option value="wear">Tool Wear Analysis</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                <Text className="text-sm font-medium text-text-primary">
                  Air Temperature
                </Text>
                <div className="mt-1 flex items-baseline gap-2">
                  <Metric className="text-2xl text-brand-primary">
                    298.1 K
                  </Metric>
                  <Text className="text-xs text-text-tertiary">
                    (295-304 K)
                  </Text>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                <Text className="text-sm font-medium text-text-primary">
                  Process Temperature
                </Text>
                <div className="mt-1 flex items-baseline gap-2">
                  <Metric className="text-2xl text-brand-primary">
                    308.6 K
                  </Metric>
                  <Text className="text-xs text-text-tertiary">
                    (305-313 K)
                  </Text>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                <Text className="text-sm font-medium text-text-primary">
                  Rotational Speed
                </Text>
                <div className="mt-1 flex items-baseline gap-2">
                  <Metric className="text-2xl text-brand-primary">
                    1551 rpm
                  </Metric>
                  <Text className="text-xs text-text-tertiary">
                    (1300-1600)
                  </Text>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                <Text className="text-sm font-medium text-text-primary">
                  Torque
                </Text>
                <div className="mt-1 flex items-baseline gap-2">
                  <Metric className="text-2xl text-brand-primary">
                    42.8 Nm
                  </Metric>
                  <Text className="text-xs text-text-tertiary">(35-50 Nm)</Text>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                <Text className="text-sm font-medium text-text-primary">
                  Tool Wear
                </Text>
                <div className="mt-1 flex items-baseline gap-2">
                  <Metric className="text-2xl text-brand-primary">0 min</Metric>
                  <Text className="text-xs text-brand-secondary">New Tool</Text>
                </div>
              </div>
            </div>

            <AreaChart
              className="h-80"
              data={performanceData}
              index="timestamp"
              categories={[
                "Air Temperature (K)",
                "Process Temperature (K)",
                "Tool Wear (min)",
              ]}
              colors={["brand-primary", "brand-secondary", "brand-accent"]}
              valueFormatter={(value) => value.toFixed(1)}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              curveType="monotone"
              yAxisWidth={60}
              customTooltip={customTooltipFormatter}
            />

            <div className="flex items-center justify-between text-xs">
              <Text className="text-text-secondary font-medium">
                Operating Ranges:
              </Text>
              <div className="flex gap-4">
                <Text className="text-text-secondary">
                  Air Temp:{" "}
                  <span className="text-brand-primary font-medium">
                    295-304 K
                  </span>
                </Text>
                <Text className="text-text-secondary">
                  Process Temp:{" "}
                  <span className="text-brand-secondary font-medium">
                    305-313 K
                  </span>
                </Text>
                <Text className="text-text-secondary">
                  Tool Wear Warning:{" "}
                  <span className="text-brand-accent font-medium">150 min</span>
                </Text>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <Text className="font-medium text-brand-primary mb-4 text-lg">
                Additional Available Metrics:
              </Text>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                  <Text className="font-medium text-brand-primary mb-3">
                    Process Parameters
                  </Text>
                  <ul className="mt-2 space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                      Type (H/M/L) - High/Medium/Low Quality Products
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                      Rotational Speed Variations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent"></div>
                      Torque Fluctuations
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-brand-primary/20 hover:shadow-md transition-all">
                  <Text className="font-medium text-brand-primary mb-3">
                    Failure Modes
                  </Text>
                  <ul className="mt-2 space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                      Tool Wear Failure (TWF)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                      Heat Dissipation Failure (HDF)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent"></div>
                      Power Failure (PWF)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      Overstrain Failure (OSF)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {results.length > 0 && (
          <div>
            <Title className="text-xl font-roboto font-medium text-text-primary mb-4">
              Risk Distribution Overview
            </Title>
            <Text className="font-roboto text-text-secondary mb-6">
              Equipment risk assessment and failure probability analysis
            </Text>
            <Card className="bg-white border border-gray-100 hover:shadow-md transition-all duration-200">
              <BarChart
                data={results.map((r) => ({
                  name: `Unit ${r.product_id}`,
                  "Failure Risk": r.failure_probability * 100,
                }))}
                index="name"
                categories={["Failure Risk"]}
                colors={["brand-primary"]}
                valueFormatter={(value: number) => `${value.toFixed(1)}%`}
                showLegend={false}
                className="h-80"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
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
                  <div
                    key={category.label}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${category.color}`}
                      />
                      <Text className="font-roboto font-medium text-text-primary">
                        {category.label}
                      </Text>
                    </div>
                    <Text className="text-2xl font-roboto font-medium text-text-primary">
                      {category.count}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="bg-white ring-1 ring-gray-100 border-0">
          <TabGroup>
            <TabList className="flex gap-8 border-b border-gray-100">
              <Tab className="relative px-2 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none ui-selected:text-primary-DEFAULT ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-primary-DEFAULT">
                Predictive Maintenance
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none ui-selected:text-primary-DEFAULT ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-primary-DEFAULT">
                Compliance Management
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div className="py-6">
                  <PredictiveMaintenance />
                </div>
              </TabPanel>
              <TabPanel>
                <div className="py-6">
                  <ComplianceChecker />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      </div>
    </main>
  );
}
