/**
 * Example how Y axis fitting to visible data can be achieved in scrolling line chart applications
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Import xydata
const xydata = require('@arction/xydata')
const { lightningChart, AxisScrollStrategies, Themes } = lcjs
const { createProgressiveTraceGenerator } = xydata

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    })
    .setTitle('Axis Y Fitting to visible data')
    .setMouseInteractions(false)

const lineSeries = chart.addLineSeries({
    dataPattern: {
        pattern: 'ProgressiveX',
    },
})

// Setup scrolling X Axis.
const dataPointsHistory = 500
const axisX = chart
    .getDefaultAxisX()
    .setScrollStrategy(AxisScrollStrategies.progressive)
    .setDefaultInterval((state) => ({ end: state.dataMax, start: (state.dataMax ?? 0) - dataPointsHistory, stopAxisAfter: false }))
    .setMouseInteractions(false)

const axisY = chart.getDefaultAxisY().setMouseInteractions(false)

// Keep track of n last data points (visible data points).
const lastYValues = []
// Value that controls how often visible Y interval should be updated. Frequent updates can be CPU intensive especially if there are a lot of data points in view.
const updateYViewIntervalMs = 100
let lastYViewIntervalUpdate = 0

createProgressiveTraceGenerator()
    .setNumberOfPoints(10000)
    .generate()
    .setStreamInterval(1000 / 60)
    .setStreamBatchSize(1)
    .setStreamRepeat(true)
    .toStream()
    .forEach((point) => {
        // Add point to line series.
        lineSeries.add(point)

        // Keep track of n last data points (visible last points)
        if (lastYValues.length >= dataPointsHistory) {
            lastYValues.shift()
        }
        lastYValues.push(point.y)

        const tNow = window.performance.now()
        if (tNow - lastYViewIntervalUpdate >= updateYViewIntervalMs) {
            lastYViewIntervalUpdate = tNow
            // Calculate Y values range of visible data points.
            let yMin = Number.MAX_SAFE_INTEGER
            let yMax = -Number.MAX_SAFE_INTEGER
            for (const y of lastYValues) {
                yMin = Math.min(yMin, y)
                yMax = Math.max(yMax, y)
            }
            // Actively set displayed Y axis interval to the range of visible data points.
            axisY.setInterval({ start: yMin, end: yMax })
        }
    })
