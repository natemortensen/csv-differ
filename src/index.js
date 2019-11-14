const Papa = require('papaparse')
const diff = require("deep-object-diff").detailedDiff
const { get, set } = require('object-path')
const pick = require('lodash.pick')
const pickBy = require('lodash.pickby')
const fromPairs = require('lodash.frompairs')
const isEmpty = require('lodash.isempty')

const clearNulls = obj => pickBy(obj, v => v != null)

class CsvApprover {
  constructor(csv, { resolve, reject }, { records, mapping, identifier, updateFunction }) {
    const self = this
    self.records = records
    self.identifier = identifier
    self.recordsByIdentifier = new Map(records.map(r => [r[identifier], r]))
    self.updateFunction = updateFunction

    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      complete({ data }) {
        self.changes = data
        self.headers = Object.keys(data[0])
        self.mapping = mapping || fromPairs(self.headers.map(f => [f, f]))

        const allowedHeaders = Object.keys(self.mapping).concat([identifier])
        const invalidCols = self.headers.filter(x => !allowedHeaders.includes(x))
        if(invalidCols.length) {
          reject(new Error(`The following columns are not allowed: ${invalidCols.join(', ')}`))
          return
        }

        self.changedRecords = self.changes.map(c => {
          const record = self.recordsByIdentifier.get(c[self.identifier])
          if(record) {
            return {
              record,
              diff: self.diffRecord(record, c)
            }
          } else {
            return null
          }
        }).filter(r => r && r.diff)

        self.changedById = new Map(self.changedRecords.map(r => [r.record[self.identifier], r]))
        resolve(self)
      }
    })
  }

  flattenRecord(record) {
    return {
      ...record,
      ...fromPairs(Object.entries(this.mapping).map(([k, path]) => [k, get(record, path)]))
    }
  }

  expandChanges(changes) {
    return {
      ...record,
      ...fromPairs(Object.entries(this.mapping).map(([k, path]) => [k, set(record, path)]))
    }
  }

  diffRecord(record, changes) {
    const flattened = this.flattenRecord(record)
    const result = diff(clearNulls(pick(flattened, this.headers)), clearNulls(changes))
    return Object.values(result).find(r => !isEmpty(r)) ? result : null
  }

  updateAll() {
    this.changedRecords.forEach(({ record, diff }) => {
      this.updateFunction(record, Object.assign({}, ...Object.values(diff)))
    })
  }

  update(id) {
    let { record, diff } = this.changedById.get(id)
    this.updateFunction(record, Object.assign({}, ...Object.values(diff)))
  }
}

function detectChanges(csv, options) {
  return new Promise(
    function (resolve, reject) {
      const instance = new CsvApprover(csv, { resolve, reject }, options)
  })
}

export default detectChanges