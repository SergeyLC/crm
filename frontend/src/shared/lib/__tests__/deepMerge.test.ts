import deepMergeObjects from '../utils/deepMerge';

describe('deepMergeObjects', () => {
  it('merges nested objects without mutating inputs', () => {
    const a = { table: { title: 'A', nested: { x: 1 } }, foo: 'bar' };
    const b = { table: { column: { name: 'Name' }, nested: { y: 2 } }, baz: true };

    const res = deepMergeObjects(a, b);

    expect(res).not.toBe(a);
    expect(res).not.toBe(b);
  const table = res.table as Record<string, unknown>;
  const nested = table.nested as Record<string, unknown>;
  const column = (table.column as Record<string, unknown>);

  expect(table.title).toBe('A');
  expect(column.name).toBe('Name');
  expect(nested.x).toBe(1);
  expect(nested.y).toBe(2);
  expect(res.foo).toBe('bar');
  expect(res.baz).toBe(true);
  });
});
