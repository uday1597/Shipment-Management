import AnalyticsDashboard from "../components/AnalyticsDashboard";

export function AnalyticsPage() {
  return (
    <main className="analytics-page">
      <header className="analytics-page-header">
        <p className="analytics-eyebrow">
          COMMAND CENTER / INTELLIGENCE
        </p>

        <h1>Analytics & Insights</h1>

        <p>
          Understand shipment performance, costs, and operational trends.
        </p>
      </header>

      <AnalyticsDashboard />
    </main>
  );
}