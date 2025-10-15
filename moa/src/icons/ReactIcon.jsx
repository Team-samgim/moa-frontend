import PropTypes from './types'
import ReactSvg from '@/assets/react.svg?react'

const ReactIcon = ({ width, height, fill, stroke, className }) => {
  const test = 1
  return (
    <ReactSvg className={className} width={width} height={height} fill={fill} stroke={stroke} />
  )
}

ReactIcon.propTypes = PropTypes

export default ReactIcon
