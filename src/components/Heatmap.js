import { DAYS_IN_ONE_YEAR, DAYS_IN_WEEK } from './consts'
import moment from 'moment'

export default class CalendarHeatmap {
  constructor (endDate, values, max, showLegend) {
    this.endDate = this._parseDate(endDate)
    this.max = max || Math.ceil((Math.max(...values.map(day => day.count)) / 5) * 4)
    this.startDate = this._shiftDate(endDate, -DAYS_IN_ONE_YEAR)
    this.values = values
    this.showLegend = showLegend
  }

  get activities () {
    const result = this.values.reduce((newValues, day) => {
      const dateString = this._keyDayParser(day.date)
      newValues[dateString] = {
        referenceDate: day.date && new Date(day.date),
        count: day.count,
        attendance: day.attendance,
        colorIndex: this.getColorIndex(day.count)
      }
      return newValues
    }, {})

    return result
  }

  get weekCount () {
    return this.getDaysCount() / DAYS_IN_WEEK
  }

  get calendar () {
    let date = this._shiftDate(this.startDate, -this.getCountEmptyDaysAtStart())
    const result = Array.from({ length: this.weekCount },
      () => Array.from({ length: DAYS_IN_WEEK },
        () => {
          let dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          let dayValues = this.activities[this._keyDayParser(dDate)]
          date.setDate(date.getDate() + 1)
          return {
            date: dDate,
            count: dayValues ? dayValues.count : null,
            attendance: dayValues ? dayValues.attendance : null,
            colorIndex: dayValues ? dayValues.colorIndex : 0
          }
        }
      )
    )

    return result
  }

  get firstFullWeekOfMonths () {
    return this.calendar.reduce((months, week, index, weeks) => {
      if (index > 0) {
        let lastWeek = weeks[index - 1][0].date
        let currentWeek = week[0].date
        if (lastWeek.getFullYear() < currentWeek.getFullYear() || lastWeek.getMonth() < currentWeek.getMonth()) {
          months.push({ value: currentWeek.getMonth(), index })
        }
      }
      return months
    }, [])
  }

  getColorIndex (value) {
    if (value == null || value === undefined) {
      return 0
    } else if (value <= 0) {
      return 1
    } else if (value >= this.max) {
      return 5
    } else {
      return (Math.ceil(((value * 100) / this.max) * (0.03))) + 1
    }
  }

  getCountEmptyDaysAtStart () {
    return this.startDate.getDay()
  }

  getCountEmptyDaysAtEnd () {
    return (DAYS_IN_WEEK - 1) - this.endDate.getDay()
  }

  getDaysCount () {
    return DAYS_IN_ONE_YEAR + 1 + this.getCountEmptyDaysAtStart() + this.getCountEmptyDaysAtEnd()
  }

  _shiftDate (date, numDays) {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + numDays)
    return newDate
  }

  _parseDate (entry) {
    return (entry instanceof Date) ? entry : (new Date(entry))
  }

  _keyDayParser (date) {
    let day = this._parseDate(this._normalizeDate(date))
    return `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
  }

  _normalizeDate (date) {
    if (date instanceof Date) {
      date = moment(date.toDateString(), 'ddd MMM DD YYYY hh:mm:ss').format('YYYY-MM-DD')
    }
    return date
  }
}
