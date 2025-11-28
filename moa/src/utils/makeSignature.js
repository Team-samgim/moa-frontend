/**
 * makeSignature
 *
 * 목적:
 * - 객체의 key 를 정렬한 뒤 JSON.stringify 로 직렬화하여
 *   "항상 동일한 형태의 해시 문자열"을 만드는 유틸 함수
 *
 * 특징:
 * - queryKey, 캐싱 시그니처, 메모이제이션 등에 사용
 * - key 순서가 달라도 동일한 내용이면 동일한 문자열 생성
 *
 * AUTHOR: 방대혁
 */
export default function makeSignature(obj) {
  const keys = Object.keys(obj).sort()
  return JSON.stringify(obj, keys)
}
