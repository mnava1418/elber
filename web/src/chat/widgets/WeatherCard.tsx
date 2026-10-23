import { AlertIcon } from '../icons'
import { WeatherIcon } from './WeatherIcon'
import { capitalize, dayLabel, deg, hourOf, longDate, type WeatherReport } from './weather'
import '../../styles/WeatherCard.css'

// Below this, a chance of rain is noise.
const SHOW_RAIN_FROM = 20

function RainChance({ chance }: { chance: number }) {
  return <span className="wx-rain">{chance >= SHOW_RAIN_FROM ? `${chance}%` : ''}</span>
}

export function WeatherCard({ report }: { report: WeatherReport }) {
  const { place, localTime, current, hourly, daily, alerts } = report
  const today = localTime.slice(0, 10)
  // Hours without a chance of rain don't get an empty row.
  const rainSoon = hourly.some((h) => h.rainChance >= SHOW_RAIN_FROM)

  // The bars of the days share one scale: the week's coldest to warmest.
  const low = Math.min(...daily.map((d) => d.min))
  const span = Math.max(...daily.map((d) => d.max)) - low || 1

  return (
    <section className="wx" aria-label={`Clima en ${place.name}`}>
      <header className="wx-head">
        <span className="wx-place">
          <span className="wx-place-name">{place.name}</span>
          {/* Not the state: Geocoding only has it in English ("Community of Madrid"). */}
          {place.country && <span className="wx-place-where">{place.country}</span>}
        </span>
        <span className="wx-time">
          {capitalize(longDate(localTime))} · {hourOf(localTime)}
        </span>
      </header>

      <div className="wx-now">
        <WeatherIcon code={current.icon} size={52} className="wx-now-icon" />
        <span className="wx-now-temp">{deg(current.temp)}</span>
        <span className="wx-now-desc">{capitalize(current.description)}</span>
      </div>
      <dl className="wx-stats">
        <div><dt>Sensación</dt><dd>{deg(current.feelsLike)}</dd></div>
        <div><dt>Humedad</dt><dd>{current.humidity}%</dd></div>
        <div><dt>Viento</dt><dd>{Math.round(current.windKmh)} km/h</dd></div>
        <div><dt>UV</dt><dd>{Math.round(current.uvIndex)}</dd></div>
      </dl>

      {alerts.map((alert, i) => (
        <details key={i} className="wx-alert">
          <summary>
            <AlertIcon width={15} height={15} />
            <span className="wx-alert-event">{alert.event}</span>
            <span className="wx-alert-until">hasta {alert.end.slice(0, 10) === today ? hourOf(alert.end) : `${dayLabel(alert.end.slice(0, 10), today)} ${hourOf(alert.end)}`}</span>
          </summary>
          <p>{alert.description}</p>
        </details>
      ))}

      {hourly.length > 0 && (
        <ol className="wx-hours" aria-label="Próximas horas">
          {hourly.map((h) => (
            <li key={h.time} title={capitalize(h.description)}>
              <span className="wx-hour">{hourOf(h.time)}</span>
              <WeatherIcon code={h.icon} size={20} />
              <span className="wx-hour-temp">{deg(h.temp)}</span>
              {rainSoon && <RainChance chance={h.rainChance} />}
            </li>
          ))}
        </ol>
      )}

      {daily.length > 0 && (
        <ol className="wx-days" aria-label="Próximos días">
          {daily.map((d) => (
            <li key={d.date} title={d.summary}>
              <span className="wx-day">{dayLabel(d.date, today)}</span>
              <WeatherIcon code={d.icon} size={20} />
              <RainChance chance={d.rainChance} />
              <span className="wx-min">{deg(d.min)}</span>
              <span className="wx-range" aria-hidden="true">
                <span style={{ left: `${((d.min - low) / span) * 100}%`, width: `${((d.max - d.min) / span) * 100}%` }} />
              </span>
              <span className="wx-max">{deg(d.max)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
