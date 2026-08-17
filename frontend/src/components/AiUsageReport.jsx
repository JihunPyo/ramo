import { useState } from 'react'
import { RamoLogo } from './RamoLogo.jsx'

const REPORT_PERIODS = [
  {
    id: 'week',
    label: '주간',
    date: '2026. 8. 10 - 8. 16',
    usage: 78,
    usageChange: 12,
    usageLabel: '능동적 · 구조적 활용',
    types: [['탐색형', 32], ['비교형', 24], ['검증형', 18], ['체계형', 26]],
    sessions: 28,
    activeDays: 6,
    hours: ['9', '40'],
    trend: [12, 19, 23, 30, 24, 25, 34],
    trendLabels: ['8.10', '8.11', '8.12', '8.13', '8.14', '8.15', '8.16'],
    stages: [['탐색', 24], ['확장', 18], ['비교', 21], ['검증', 14], ['수정', 11], ['정리', 12]],
    quality: [64, 3.2, 42, 71],
    changes: [['활용 비율', 12, 72], ['사고 깊이', 18, 80], ['검증 활동', 9, 66], ['정리 품질', 15, 88]],
    summary: ['이번 주에는 탐색과 구조화 활용이 가장 활발했어요.', '브랜치 깊이와 검증 활동이 이전 기간보다 향상되었어요.', '다음 주에는 비교 후 검증 단계를 더 자주 연결해 보세요.'],
  },
  {
    id: 'month',
    label: '월간',
    date: '2026. 8. 1 - 8. 31',
    usage: 74,
    usageChange: 9,
    usageLabel: '꾸준한 · 탐색 중심 활용',
    types: [['탐색형', 36], ['비교형', 20], ['검증형', 17], ['체계형', 27]],
    sessions: 104,
    activeDays: 22,
    hours: ['34', '15'],
    trend: [18, 24, 22, 31, 28, 34, 37],
    trendLabels: ['1주', '2주', '3주', '4주', '5주', '6주', '7주'],
    stages: [['탐색', 86], ['확장', 65], ['비교', 72], ['검증', 51], ['수정', 43], ['정리', 58]],
    quality: [59, 2.9, 38, 68],
    changes: [['활용 비율', 9, 68], ['사고 깊이', 14, 74], ['검증 활동', 7, 61], ['정리 품질', 12, 81]],
    summary: ['이번 달에는 새로운 주제를 탐색하는 활동이 가장 많았어요.', '월 후반으로 갈수록 세션 수와 사고 깊이가 함께 증가했어요.', '검증형 브랜치를 조금 더 늘리면 결과의 신뢰도가 높아져요.'],
  },
  {
    id: 'semester',
    label: '학기',
    date: '2026. 3. 2 - 8. 16',
    usage: 69,
    usageChange: 16,
    usageLabel: '확장적 · 비교 중심 활용',
    types: [['탐색형', 28], ['비교형', 31], ['검증형', 16], ['체계형', 25]],
    sessions: 486,
    activeDays: 92,
    hours: ['148', '30'],
    trend: [14, 18, 25, 22, 29, 33, 38],
    trendLabels: ['3월', '4월', '5월', '6월', '7월', '8월', '현재'],
    stages: [['탐색', 340], ['확장', 286], ['비교', 372], ['검증', 194], ['수정', 175], ['정리', 231]],
    quality: [71, 3.8, 47, 76],
    changes: [['활용 비율', 16, 77], ['사고 깊이', 22, 86], ['검증 활동', 13, 70], ['정리 품질', 19, 83]],
    summary: ['이번 학기에는 비교형 활용과 주제 확장이 크게 늘었어요.', '여러 관점을 연결하는 브랜치의 평균 깊이가 향상되었어요.', '학기 말에는 핵심 세션을 정리해 지식 자산으로 남겨 보세요.'],
  },
  {
    id: 'year',
    label: '연간',
    date: '2026. 1. 1 - 12. 31',
    usage: 72,
    usageChange: 21,
    usageLabel: '통합적 · 심화 활용',
    types: [['탐색형', 25], ['비교형', 27], ['검증형', 22], ['체계형', 26]],
    sessions: 938,
    activeDays: 168,
    hours: ['286', '20'],
    trend: [10, 17, 20, 26, 31, 35, 40],
    trendLabels: ['1월', '3월', '5월', '7월', '9월', '11월', '12월'],
    stages: [['탐색', 684], ['확장', 592], ['비교', 645], ['검증', 488], ['수정', 403], ['정리', 517]],
    quality: [76, 4.1, 55, 82],
    changes: [['활용 비율', 21, 84], ['사고 깊이', 27, 91], ['검증 활동', 18, 78], ['정리 품질', 24, 92]],
    summary: ['올해는 탐색에서 검증까지 이어지는 활용 흐름이 정착되었어요.', '사고 깊이와 정리 품질이 연초보다 크게 향상되었어요.', '내년에는 자주 쓰는 브랜치 패턴을 템플릿으로 만들어 보세요.'],
  },
]

function ReportCard({ number, title, children, className = '' }) {
  return (
    <section className={`usage-report-card ${className}`} tabIndex="0">
      <h3><span><b>{number}</b></span>{title}</h3>
      {children}
    </section>
  )
}

function ReportIcon({ type }) {
  const paths = {
    search: <><circle cx="10" cy="10" r="5" /><path d="m14 14 5 5" /></>,
    compare: <><circle cx="7" cy="15" r="3" /><circle cx="17" cy="15" r="3" /><path d="M7 12V7h10v5M12 7V4" /></>,
    verify: <><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="m9 12 2 2 4-5" /></>,
    branch: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="7" cy="18" r="2" /><path d="M8 6h3a4 4 0 0 1 4 4v6M9 17l5-5" /></>,
    expand: <><path d="M8 8 4 4m0 0h5M4 4v5M16 8l4-4m0 0h-5m5 0v5M8 16l-4 4m0 0v-5m0 5h5M16 16l4 4m0 0v-5m0 5h-5" /></>,
    edit: <><path d="m4 18 1-4L15 4l4 4L9 18zM13 6l4 4" /></>,
    organize: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="m8 8 1 1 2-2M13 8h3m-8 5 1 1 2-2m2 1h3m-8 5 1 1 2-2m2 1h3" /></>,
    trend: <><path d="M4 18 9 12l4 3 7-9" /><path d="M15 6h5v5" /></>,
    depth: <><path d="M12 3a5 5 0 0 1 5 5 5 5 0 0 1 2 8 5 5 0 0 1-7 4 5 5 0 0 1-7-4 5 5 0 0 1 2-8 5 5 0 0 1 5-5Z" /><path d="M9 8v8m6-8v8m-3-10v12" /></>,
  }

  return <svg className="usage-row-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[type] ?? paths.branch}</svg>
}

function MiniTrend({ values, labels }) {
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = Math.max(1, maxValue - minValue)
  const getY = (value) => 15 - ((value - minValue) / valueRange) * 11
  const points = values.map((value, index) => `${6 + index * 15.4},${getY(value)}`).join(' ')

  return (
    <div className="usage-report-trend">
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 15H100M0 11H100M0 7H100M0 3H100" className="trend-grid" />
        <polyline points={points} className="trend-area" />
        <polyline points={points} className="trend-line" />
        {values.map((value, index) => <circle key={labels[index]} cx={6 + index * 15.4} cy={getY(value)} r="1.25" />)}
      </svg>
      <div>{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  )
}

export function AiUsageReport() {
  const [periodId, setPeriodId] = useState('week')
  const report = REPORT_PERIODS.find((item) => item.id === periodId)
  const maxStage = Math.max(...report.stages.map(([, value]) => value))

  return (
    <article className="usage-report" aria-live="polite">
      <header className="usage-report-heading">
        <div>
          <div className="usage-report-brand"><RamoLogo /><b>AI-Report</b></div>
          <p>{report.date}</p>
        </div>
        <div className="usage-report-periods" role="group" aria-label="리포트 조회 기간">
          {REPORT_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              className={period.id === periodId ? 'selected' : ''}
              aria-pressed={period.id === periodId}
              onClick={() => setPeriodId(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </header>

      <div className="usage-report-grid" key={periodId}>
        <ReportCard number="1" title="AI 활용 비율" className="usage-ratio-card">
          <div className="ratio-chart" style={{ '--ratio': `${report.usage * 3.6}deg` }}><strong>{report.usage}<small>%</small></strong></div>
          <div className="ratio-copy"><strong>{report.usageLabel}</strong><p>이전 기간 대비 <b>+{report.usageChange}%</b></p></div>
        </ReportCard>

        <ReportCard number="2" title="AI 활용 유형" className="usage-type-card">
          <div className="usage-type-list">
            {report.types.map(([label, value], index) => <div key={label}><ReportIcon type={['search', 'compare', 'verify', 'branch'][index]} /><span>{label}</span><i><b style={{ width: `${value * 2.6}%` }} /></i><em>{value}%</em></div>)}
          </div>
        </ReportCard>

        <ReportCard number="3" title="기본 AI 활용 지표" className="usage-metrics-card">
          <div className="usage-metrics">
            <div><span>세션 수</span><strong><b>{report.sessions}</b></strong></div>
            <div><span>활성 일수</span><strong><b>{report.activeDays}<small>일</small></b></strong></div>
            <div><span>활용 시간</span><strong><b>{report.hours[0]}<small>시간</small></b><b>{report.hours[1]}<small>분</small></b></strong></div>
          </div>
          <MiniTrend values={report.trend} labels={report.trendLabels} />
        </ReportCard>

        <ReportCard number="4" title="사고 단계 지표" className="usage-stage-card">
          <div className="usage-stage-list">
            {report.stages.map(([label, value], index) => <div key={label}><ReportIcon type={['search', 'expand', 'compare', 'verify', 'edit', 'organize'][index]} /><span>{label}</span><i><b style={{ width: `${Math.max(18, value / maxStage * 88)}%` }} /></i><em>{value}</em></div>)}
          </div>
        </ReportCard>

        <ReportCard number="5" title="브랜치 · 활용 품질" className="usage-quality-card">
          <div className="branch-illustration" aria-hidden="true">
            <svg viewBox="0 0 270 150">
              <g className="branch-lines"><path d="M34 75 C70 75 58 27 99 27 H235" /><path d="M34 75 H235" /><path d="M34 75 C70 75 58 123 99 123 H235" /></g>
              <g className="branch-nodes"><circle cx="34" cy="75" r="17" className="start-node" /><circle cx="100" cy="27" r="9" /><circle cx="145" cy="27" r="9" /><circle cx="190" cy="27" r="9" /><circle cx="235" cy="27" r="9" /><circle cx="100" cy="75" r="9" /><circle cx="145" cy="75" r="9" /><circle cx="190" cy="75" r="9" /><circle cx="235" cy="75" r="9" className="pending-node" /><circle cx="100" cy="123" r="9" /><circle cx="145" cy="123" r="9" /><circle cx="190" cy="123" r="9" /><circle cx="235" cy="123" r="9" className="pending-node" /></g>
              <text x="34" y="79" textAnchor="middle">시작</text><text x="235" y="31" textAnchor="middle" className="done-text">정리</text>
            </svg>
          </div>
          <div className="quality-metrics">
            <div><span>브랜치 활용률</span><strong>{report.quality[0]}%</strong></div>
            <div><span>평균 깊이</span><strong>{report.quality[1]}</strong></div>
            <div><span>비교·검증률</span><strong>{report.quality[2]}%</strong></div>
            <div><span>정리율</span><strong>{report.quality[3]}%</strong></div>
          </div>
        </ReportCard>

        <ReportCard number="6" title="성과 변화" className="usage-change-card">
          <div className="change-legend"><span>이전 기간</span><b>이번 기간</b></div>
          <div className="usage-change-list">
            {report.changes.map(([label, change, width], index) => <div key={label}><ReportIcon type={['trend', 'depth', 'verify', 'organize'][index]} /><span>{label}</span><i><small /><b style={{ width: `${width}%` }} /></i><em>+{change}%</em></div>)}
          </div>
        </ReportCard>
      </div>

      <footer className="usage-report-summary">
        <h3>전체 요약</h3>
        {report.summary.map((line) => <p key={line}><span>●</span>{line}</p>)}
      </footer>
    </article>
  )
}
