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

// Color scheme following design principles
const colors = {
  primary: {
    DEFAULT: "#2563eb",
    light: "#60a5fa",
    dark: "#1e40af",
  },
  success: {
    DEFAULT: "#059669",
    light: "#34d399",
    dark: "#065f46",
  },
  warning: {
    DEFAULT: "#d97706",
    light: "#fbbf24",
    dark: "#92400e",
  },
  danger: {
    DEFAULT: "#dc2626",
    light: "#f87171",
    dark: "#991b1b",
  },
  gray: {
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
} as const;

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
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-medium text-gray-900">
                Nuclear Plant Management
              </h1>
              <div className="hidden md:flex items-center space-x-6">
                <select className="text-sm bg-transparent border-0 font-medium text-gray-700 focus:outline-none focus:ring-0">
                  <option value="unit1">Reactor Unit 1</option>
                  <option value="unit2">Reactor Unit 2</option>
                </select>
                <span className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Operational
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge color="emerald" size="sm" className="animate-pulse">
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
              <Text className="mt-1 text-gray-500">
                Real-time monitoring and system health
              </Text>
            </div>
            <div className="flex items-center gap-4">
              <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700">
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
                  metric.color === "warning" ? "bg-amber-50/50" : ""
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
        <div className="mb-12">
          <Card className="bg-white ring-1 ring-gray-100 border-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Text className="text-xl font-semibold text-gray-900">
                  Machine Performance Metrics
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Real-time monitoring of critical machine parameters
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <select className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700">
                  <option value="temperature">Temperature Analysis</option>
                  <option value="mechanical">Mechanical Parameters</option>
                  <option value="wear">Tool Wear Analysis</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-gray-50/60 rounded-lg p-4">
                  <Text className="text-sm font-medium text-gray-600">
                    Air Temperature
                  </Text>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Metric className="text-2xl text-gray-900">298.1 K</Metric>
                    <Text className="text-xs text-gray-500">(295-304 K)</Text>
                  </div>
                </div>
                <div className="bg-gray-50/60 rounded-lg p-4">
                  <Text className="text-sm font-medium text-gray-600">
                    Process Temperature
                  </Text>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Metric className="text-2xl text-gray-900">308.6 K</Metric>
                    <Text className="text-xs text-gray-500">(305-313 K)</Text>
                  </div>
                </div>
                <div className="bg-gray-50/60 rounded-lg p-4">
                  <Text className="text-sm font-medium text-gray-600">
                    Rotational Speed
                  </Text>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Metric className="text-2xl text-gray-900">1551 rpm</Metric>
                    <Text className="text-xs text-gray-500">(1300-1600)</Text>
                  </div>
                </div>
                <div className="bg-gray-50/60 rounded-lg p-4">
                  <Text className="text-sm font-medium text-gray-600">
                    Torque
                  </Text>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Metric className="text-2xl text-gray-900">42.8 Nm</Metric>
                    <Text className="text-xs text-gray-500">(35-50 Nm)</Text>
                  </div>
                </div>
                <div className="bg-gray-50/60 rounded-lg p-4">
                  <Text className="text-sm font-medium text-gray-600">
                    Tool Wear
                  </Text>
                  <div className="mt-1 flex items-baseline gap-2">
                    <Metric className="text-2xl text-gray-900">0 min</Metric>
                    <Text className="text-xs text-emerald-500">New Tool</Text>
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
                colors={["sky", "amber", "rose"]}
                valueFormatter={(value) => value.toFixed(1)}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
                curveType="monotone"
                yAxisWidth={60}
                customTooltip={({ payload }) => {
                  if (!payload?.[0]) return null;
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
                              {category.value.toFixed(1)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <Text>Operating Ranges:</Text>
                <div className="flex gap-4">
                  <Text>Air Temp: 295-304 K</Text>
                  <Text>Process Temp: 305-313 K</Text>
                  <Text>Tool Wear Warning: 150 min</Text>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6">
                <Text className="font-medium text-gray-900 mb-4">
                  Additional Available Metrics:
                </Text>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Text className="font-medium text-gray-700">
                      Process Parameters
                    </Text>
                    <ul className="mt-2 space-y-2 text-sm text-gray-600">
                      <li>• Type (H/M/L) - High/Medium/Low Quality Products</li>
                      <li>• Rotational Speed Variations</li>
                      <li>• Torque Fluctuations</li>
                    </ul>
                  </div>
                  <div>
                    <Text className="font-medium text-gray-700">
                      Failure Modes
                    </Text>
                    <ul className="mt-2 space-y-2 text-sm text-gray-600">
                      <li>• Tool Wear Failure (TWF)</li>
                      <li>• Heat Dissipation Failure (HDF)</li>
                      <li>• Power Failure (PWF)</li>
                      <li>• Overstrain Failure (OSF)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white ring-1 ring-gray-100 border-0">
          <TabGroup>
            <TabList className="flex gap-8 border-b border-gray-100">
              <Tab className="relative px-2 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none ui-selected:text-gray-900 ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-blue-600">
                Predictive Maintenance
              </Tab>
              <Tab className="relative px-2 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none ui-selected:text-gray-900 ui-selected:after:absolute ui-selected:after:bottom-0 ui-selected:after:left-0 ui-selected:after:right-0 ui-selected:after:h-0.5 ui-selected:after:bg-blue-600">
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
