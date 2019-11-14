# csv-differ

This plugin parses a CSV and outputs an item-by-item diff against a collection of objects.
It will accept both `File` and `String` arguments as CSV.

Example usage:

Initialize service
```javascript
const service = await detectChanges(
  csvFileOrString,
   {
    records: [{ slug: 'test', firstName: 'Nate' }],
    identifier: 'slug',
    updateFunction(record, changes) {
      $axios.patch(apiUrl(record.slug), changes)
    }
  }
)
```

Get all records with detected changes
```javascript
service.changedRecords
// => [
// {
// "record":{"slug":"test","firstName":"Aaron"},
// "diff":{"added":{},"deleted":{},"updated":{"firstName":"Aaron"}}
// },
// ..
// ]
```


Update a single record (assuming you provided a function)
```javascript
service.update('test')
```

Update all changed records
```javascript
service.updateAll()
```
