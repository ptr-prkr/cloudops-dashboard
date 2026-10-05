import './App.css'
import MetricCard from './components/MetricCard'
import StatusBadge from './components/StatusBadge'
import { useDashboard } from './hooks/useDashboard'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)

  return `${days}d ${hours}h`
}

function App() {
  const { data: dashboardData, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <div className="loading-indicator" />
          <p className="eyebrow">CloudOps</p>
          <h1>Loading infrastructure data</h1>
          <p>Connecting to the CloudOps API...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="state-screen">
        <div className="state-card">
          <p className="eyebrow">CloudOps API</p>
          <h1>Unable to load dashboard</h1>
          <p>{error ?? 'No dashboard data was returned.'}</p>
        </div>
      </div>
    )
  }

  const memoryPercentage = Math.round(
    (dashboardData.system.memoryUsed / dashboardData.system.memoryTotal) * 100,
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CO</div>

          <div>
            <strong>CloudOps</strong>
            <span>Operations Console</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-item active" href="#overview">
            <span>◈</span>
            Overview
          </a>

          <a className="nav-item" href="#services">
            <span>◇</span>
            Services
          </a>

          <a className="nav-item" href="#infrastructure">
            <span>⬡</span>
            Infrastructure
          </a>

          <a className="nav-item" href="#deployment">
            <span>↗</span>
            Deployments
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-label">Environment</span>
          <div className="environment-row">
            <span className="environment-dot" />
            {dashboardData.deployment.environment}
          </div>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Infrastructure monitoring</p>
            <h1>Operations Overview</h1>
          </div>

          <div className="topbar-status">
            <span>Platform status</span>
            <StatusBadge status={dashboardData.status} />
          </div>
        </header>

        <section id="overview" className="metrics-grid">
          <MetricCard
            label="System Status"
            value="Operational"
            detail="All systems normal"
          />

          <MetricCard
            label="Host"
            value={dashboardData.system.hostname}
            detail={`${dashboardData.system.platform} · ${dashboardData.system.architecture}`}
          />

          <MetricCard
            label="Uptime"
            value={formatUptime(dashboardData.system.uptime)}
            detail="System uptime"
          />

          <MetricCard
            label="Memory"
            value={`${memoryPercentage}%`}
            detail={`${dashboardData.system.memoryUsed} / ${dashboardData.system.memoryTotal} GiB`}
          />
        </section>

        <div className="dashboard-grid">
          <section id="services" className="panel services-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Runtime</p>
                <h2>Service Health</h2>
              </div>

              <span className="panel-meta">
                {dashboardData.services.length} services
              </span>
            </div>

            <div className="service-list">
              {dashboardData.services.map((service) => (
                <div className="service-row" key={service.name}>
                  <div className="service-name">
                    <div className="service-icon">
                      {service.name.charAt(0)}
                    </div>

                    <div>
                      <strong>{service.name}</strong>
                      <span>Service endpoint</span>
                    </div>
                  </div>

                  <span className="response-time">
                    {service.responseTime} ms
                  </span>

                  <StatusBadge status={service.status} />
                </div>
              ))}
            </div>
          </section>

          <section id="infrastructure" className="panel infrastructure-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Compute</p>
                <h2>Infrastructure</h2>
              </div>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Provider</dt>
                <dd>{dashboardData.infrastructure.provider}</dd>
              </div>

              <div>
                <dt>Region</dt>
                <dd>{dashboardData.infrastructure.region}</dd>
              </div>

              <div>
                <dt>Instance</dt>
                <dd>{dashboardData.infrastructure.instance}</dd>
              </div>

              <div>
                <dt>Network</dt>
                <dd>{dashboardData.infrastructure.network}</dd>
              </div>
            </dl>
          </section>

          <section id="deployment" className="panel deployment-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Release</p>
                <h2>Deployment</h2>
              </div>

              <span className="version">
                v{dashboardData.deployment.version}
              </span>
            </div>

            <div className="deployment-content">
              <div>
                <span className="detail-label">Environment</span>
                <strong>{dashboardData.deployment.environment}</strong>
              </div>

              <div>
                <span className="detail-label">Deployed</span>
                <strong>{dashboardData.deployment.deployedAt}</strong>
              </div>

              <div>
                <span className="detail-label">Method</span>
                <strong>{dashboardData.deployment.deployedBy}</strong>
              </div>
            </div>
          </section>
        </div>

        <footer className="dashboard-footer">
          <span>CloudOps Dashboard</span>
          <span>React · TypeScript · Node.js · Docker · AWS</span>
        </footer>
      </main>
    </div>
  )
}

export default App
