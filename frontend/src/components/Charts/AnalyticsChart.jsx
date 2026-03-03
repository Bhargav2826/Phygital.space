import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
)

const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
        tooltip: {
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            cornerRadius: 8,
            padding: 10,
        },
    },
    scales: {
        x: {
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
            grid: { color: '#1e293b' },
        },
        y: {
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
            grid: { color: '#1e293b' },
        },
    },
}

export function LineChart({ labels, datasets, height = 250 }) {
    return (
        <div style={{ height }}>
            <Line
                data={{ labels, datasets: datasets.map(d => ({ ...d, tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3, pointHoverRadius: 6 })) }}
                options={baseOptions}
            />
        </div>
    )
}

export function BarChart({ labels, datasets, height = 250 }) {
    return (
        <div style={{ height }}>
            <Bar
                data={{ labels, datasets: datasets.map(d => ({ ...d, borderRadius: 6, borderSkipped: false })) }}
                options={baseOptions}
            />
        </div>
    )
}
