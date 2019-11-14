const differ = require('../src/index')

const records = [
  {
    name: 'John',
    status: 'active',
    id: 1,
    home: {
      doorStatus: 'open'
    }
  },
  {
    name: 'Jane',
    status: 'inactive',
    id: 2
  }
]

const identifier = 'id'

const csv = [
  'id,name,status,door',
  '1,John,inactive,closed',
  '2,Jane,inactive,open'
].join("\n")

const mapping = {
  name: 'name',
  status: 'status',
  id: 'id',
  door: 'home.doorStatus'
}

test('basic tests', async () => {
  const service = await differ(
    csv,
    {
      records,
      identifier,
      mapping
    }
  )

  expect(service.records).toBe(records)
  expect(service.changedRecords.length).toEqual(2)

  // First record
  expect(service.changedRecords[0].diff.added).toMatchObject({})
  expect(service.changedRecords[0].diff.deleted).toMatchObject({})
  expect(service.changedRecords[0].diff.updated).toMatchObject({ door: 'closed', status: 'inactive' })

  // Second record
  expect(service.changedRecords[1].diff.added).toMatchObject({ door: 'open' })
  expect(service.changedRecords[1].diff.deleted).toMatchObject({})
  expect(service.changedRecords[1].diff.updated).toMatchObject({})
});