const controller = {
  normalizeFields: [],
  segments: {
    fields: {
      calculationMode: {
        action: 'platform:segment:calculationMode',
        patch: value => ({ calculationMode: value })
      }
    }
  },
  collections: {}
};

export default controller;
