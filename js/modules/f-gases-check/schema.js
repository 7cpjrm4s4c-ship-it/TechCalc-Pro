const schema = Object.freeze({
  version: 1,
  fields: Object.freeze([
    Object.freeze({ id: 'systemName', type: 'text' }),
    Object.freeze({ id: 'systemType', type: 'text' }),
    Object.freeze({ id: 'constructionType', type: 'text' }),
    Object.freeze({ id: 'performanceRange', type: 'text' }),
    Object.freeze({ id: 'refrigerantId', type: 'select' }),
    Object.freeze({ id: 'chargeKg', type: 'number' })
  ])
});

export default schema;
