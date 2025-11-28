/**
 * OPERATOR_OPTIONS
 *
 * 필터 패널에서 데이터 타입(fieldType)에 따라 선택 가능한
 * 조건 연산자 목록을 정의한 상수 객체.
 *
 * 타입별 제공 연산자 규칙:
 *
 * 1) string
 *    - contains : 문자열 포함 여부
 *    - equals   : 완전 동일 여부
 *    - startsWith : 특정 문자열로 시작
 *    - endsWith   : 특정 문자열로 끝남
 *
 * 2) number
 *    - =   : 값이 동일
 *    - >   : 값이 큼
 *    - <   : 값이 작음
 *    - >=  : 값이 크거나 같음
 *    - <=  : 값이 작거나 같음
 *
 * 3) date
 *    - equals   : 같은 날짜
 *    - before   : 기준보다 이전
 *    - after    : 기준보다 이후
 *    - between  : 날짜 범위 (val1 ~ val2)
 *
 * 4) ip
 *    - equals     : IP 전체 일치
 *    - startsWith : 특정 prefix로 시작 (CIDR 전 단계 활용 가능)
 *    - endsWith   : 특정 suffix로 끝남
 *
 * 5) mac
 *    - equals     : MAC 전체 일치
 *    - startsWith : 특정 prefix로 시작
 *    - endsWith   : 특정 suffix로 끝남
 *
 * AUTHOR: 방대혁
 */

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
