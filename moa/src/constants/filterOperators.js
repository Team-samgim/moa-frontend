export const OPERATOR_OPTIONS = {
  string: [
    { label: '포함', value: 'contains' },
    { label: '일치', value: 'equals' },
    { label: '시작', value: 'startsWith' },
    { label: '끝', value: 'endsWith' },
  ],
  number: [
    { label: '=', value: '=' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '≥', value: '>=' },
    { label: '≤', value: '<=' },
  ],
  date: [
    { label: '같음', value: 'equals' },
    { label: '이전', value: 'before' },
    { label: '이후', value: 'after' },
    { label: '사이(between)', value: 'between' },
  ],
  ip: [
    { label: '일치', value: 'equals' },
    { label: '시작', value: 'startsWith' },
    { label: '끝', value: 'endsWith' },
  ],
  mac: [
    { label: '일치', value: 'equals' },
    { label: '시작', value: 'startsWith' },
    { label: '끝', value: 'endsWith' },
  ],
}
