// 작성자: 최이서
const ID_REGEX = /^[a-z0-9]{5,20}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PW_HAS_LETTER_AND_NUMBER = /^(?=.*[A-Za-z])(?=.*\d)/

function isValidId(id) {
  return ID_REGEX.test(id)
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}

function isValidPwLength(pw) {
  return pw.length >= 8 && pw.length <= 20
}

function hasLetterAndNumber(pw) {
  return PW_HAS_LETTER_AND_NUMBER.test(pw)
}

export {
  ID_REGEX,
  EMAIL_REGEX,
  PW_HAS_LETTER_AND_NUMBER,
  isValidId,
  isValidEmail,
  isValidPwLength,
  hasLetterAndNumber,
}
