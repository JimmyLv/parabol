import {keyframes} from '@emotion/core'
import {Elevation} from '../../styles/elevation'
import {BezierCurve, DragAttribute, Times, ZIndex} from '../../types/constEnums'
import getDeCasteljau from '../getDeCasteljau'

const reflectionSpotlightFadeIn = keyframes`
  0% {
    opacity: 0.1;
    z-index: ${ZIndex.REFLECTION_IN_FLIGHT_SPOTLIGHT};
  }
  100% {
    opacity: 1;
    z-index: ${ZIndex.REFLECTION_IN_FLIGHT_SPOTLIGHT};
  }
`

const reflectionSpotlightFadeOut = keyframes`
  0% {
    opacity: 1;
    z-index: ${ZIndex.REFLECTION_IN_FLIGHT_SPOTLIGHT};
  }
  99% {
    opacity: 0.1;
    z-index: ${ZIndex.REFLECTION_IN_FLIGHT_SPOTLIGHT};
  }
  100% {
    opacity: 1;
    z-index: ${ZIndex.REFLECTION_IN_FLIGHT};
  }
`

export const getMinTop = (top: number, targetEl: HTMLElement | null) => {
  if (top >= 0) return top
  let dropzone = targetEl
  while (dropzone && dropzone.hasAttribute) {
    if (dropzone.hasAttribute(DragAttribute.DROPZONE)) {
      return dropzone.getBoundingClientRect().top
    }
    dropzone = dropzone.parentElement
  }
  return top
}

const getTransition = (isClipped: boolean, timeRemaining: number) => {
  const completed = 1 - timeRemaining / Times.REFLECTION_DROP_DURATION
  const curve = getDeCasteljau(completed, BezierCurve.DECELERATE)
  const t = `${timeRemaining}ms ${curve}`
  const transition = `box-shadow ${t}, transform ${t}`
  return isClipped
    ? `${transition}, opacity ${timeRemaining / 2}ms ${curve} ${timeRemaining / 2}ms`
    : transition
}

export const getDroppingStyles = (
  element: HTMLDivElement,
  bbox: ClientRect,
  maxTop: number,
  timeRemaining: number,
  targetId?: string | null,
  isClose?: boolean,
  lastStyle?: React.CSSProperties
) => {
  const spotlightEl = document.getElementById('spotlight')
  const isTargetInSpotlight = targetId
    ? spotlightEl && document.querySelector(`div[${DragAttribute.DROPPABLE}='${targetId}']`)
    : false
  const isBelongsToSpotlight = spotlightEl && spotlightEl.contains(element)
  const showAboveSpotlight = isBelongsToSpotlight || isTargetInSpotlight
  const {top, left} = bbox
  const minTop = getMinTop(top, element)
  const clippedTop = Math.min(Math.max(minTop, top), maxTop - bbox.height)
  const isClipped = clippedTop !== top

  const fadeInAnimation = `${reflectionSpotlightFadeIn.toString()} 0.5s linear 0s forwards`
  const fadeOutAnimation = `${reflectionSpotlightFadeOut.toString()} 0.5s linear 0s forwards`
  let animation: string | undefined = undefined

  if (spotlightEl && !isBelongsToSpotlight && lastStyle) {
    if (isTargetInSpotlight && !isClose) {
      animation = fadeInAnimation
    }

    const isCurrentlyBehindSpotlight =
      lastStyle.zIndex === ZIndex.REFLECTION_IN_FLIGHT || lastStyle.zIndex == null
    if (!isCurrentlyBehindSpotlight && (!showAboveSpotlight || isClose)) {
      animation = fadeOutAnimation
    }
  }

  return {
    transform: `translate(${left}px,${clippedTop}px)`,
    transition: getTransition(isClipped, timeRemaining),
    opacity: isClipped ? 0 : 1,
    zIndex: showAboveSpotlight
      ? ZIndex.REFLECTION_IN_FLIGHT_SPOTLIGHT
      : ZIndex.REFLECTION_IN_FLIGHT,
    animation
  }
}

const maybeUpdate = (
  clone: HTMLDivElement,
  targetEl: HTMLDivElement,
  maxTop: number,
  timeRemaining: number,
  lastTargetTop?: number
) => {
  if (timeRemaining <= 0) return
  const targetBBox = targetEl.getBoundingClientRect()
  // adjusting column width removes target from the DOM
  if (targetBBox.x === 0 && targetBBox.y === 0) return
  if (!targetBBox) {
    document.body.removeChild(clone)
    return
  }
  if (lastTargetTop !== targetBBox.top) {
    const {transform, transition, opacity} = getDroppingStyles(
      targetEl,
      targetBBox,
      maxTop,
      timeRemaining
    )
    const {style} = clone
    style.transform = transform
    style.boxShadow = Elevation.CARD_SHADOW
    style.opacity = String(opacity)
    style.transition = transition
  }
  const beforeFrame = Date.now()
  // the target maybe be moving, so update every frame
  // REPRO: create a list of 12 cards. drag the 2nd from bottom to somewhere else & drop to cancel the drag
  requestAnimationFrame(() => {
    const timeElapsed = Date.now() - beforeFrame
    const newTimeRemaining = timeRemaining - timeElapsed
    maybeUpdate(clone, targetEl, maxTop, newTimeRemaining, targetBBox.top)
  })
}

const updateClonePosition = (targetEl: HTMLDivElement, reflectionId: string, maxTop: number) => {
  const clone = document.getElementById(`clone-${reflectionId}`) as HTMLDivElement
  // When dragging from an expanded group, this function gets called first for the expanded, then for the collapsed
  // We don't know it's expanded until the 2nd call occurs
  // So, we set an acquired flag after called the first time & save the ID of the target
  // Then if a second call occurs, we know it's an expanded drag & can handle appropriately
  if (!clone) return
  if (clone.getAttribute('acquired')) {
    const bestTarget = document.getElementById('localDropTarget')
    if (!bestTarget) return
    bestTarget.style.opacity = '0'
    setTimeout(() => {
      bestTarget.style.opacity = ''
    }, Times.REFLECTION_DROP_DURATION * 0.9)
    return
  }
  targetEl.id = 'localDropTarget'
  setTimeout(() => {
    targetEl.id = ''
  })
  clone.setAttribute('acquired', 'true')
  maybeUpdate(clone, targetEl, maxTop, Times.REFLECTION_DROP_DURATION)
}

export default updateClonePosition
