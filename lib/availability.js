export function validateRule(rule) {
  if (rule.dayOfWeek < 0 || rule.dayOfWeek > 6) {
    throw new Error('Invalid dayOfWeek');
  }
  if (rule.startTime === rule.endTime) {
    throw new Error('startTime and endTime cannot be equal');
  }
}

export function normalizeRule(rule) {
  if (rule.startTime < rule.endTime) {
    return [rule];
  }

  return [
    {
      ...rule,
      endTime: '23:59:59'
    },
    {
      ...rule,
      dayOfWeek: (rule.dayOfWeek + 1) % 7,
      startTime: '00:00:00',
      
      endTime: rule.endTime
    }
  ];
}
